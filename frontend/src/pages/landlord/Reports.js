import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Typography,
  App,
  Table,
  Spin
} from 'antd';
import {
  DollarOutlined,
  HomeOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import { invoiceService } from '../../services/invoiceService';
import dayjs from 'dayjs';

const { Title } = Typography;

const Reports = () => {
  const { message } = App.useApp();

  // Start/End dates for reports
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'days'));
  const [endDate, setEndDate] = useState(dayjs());

  // Invoices data
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [billStats, setBillStats] = useState({ totalRevenue: 0, roomFeeRevenue: 0, serviceFeeRevenue: 0 });

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const data = await invoiceService.getAll();
      const start = startDate?.startOf('day');
      const end = endDate?.endOf('day');

      const paidInvoices = data.filter(inv => {
        if (!inv.is_paid) return false;
        const date = dayjs(inv.payment_date || inv.created_at);
        if (start && date.isBefore(start)) return false;
        if (end && date.isAfter(end)) return false;
        return true;
      });

      let total = 0;
      let room = 0;
      let service = 0;

      paidInvoices.forEach(inv => {
        const p = Number(inv.price) || 0;
        const wp = Number(inv.water_price) || 0;
        const ip = Number(inv.internet_price) || 0;
        const ep = Number(inv.electricity_price) || 0;
        const gp = Number(inv.general_price) || 0;

        const serv = wp + ip + ep + gp;
        const totalAmount = Number(inv.total_amount) || 0;

        room += p;
        service += serv;
        total += totalAmount;
      });

      setInvoices(paidInvoices);
      setBillStats({ totalRevenue: total, roomFeeRevenue: room, serviceFeeRevenue: service });
    } catch (error) {
      message.error('Lỗi khi tải danh sách hóa đơn!');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const disabledStartDate = (date) => {
    if (!date || !endDate) return false;
    return date.isAfter(endDate, 'day');
  };

  const disabledEndDate = (date) => {
    if (!date || !startDate) return false;
    return date.isBefore(startDate, 'day');
  };

  const invoiceColumns = [
    {
      title: 'Mã HĐ',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
    },
    {
      title: 'Phòng',
      key: 'room',
      render: (_, record) => record.rented_room?.room?.name || 'N/A'
    },
    {
      title: 'Ngày thanh toán',
      key: 'payment_date',
      render: (_, record) => dayjs(record.payment_date || record.created_at).format('DD/MM/YYYY')
    },
    {
      title: 'Tiền phòng',
      key: 'price',
      render: (_, record) => `${(Number(record.price) || 0).toLocaleString()} VNĐ`
    },
    {
      title: 'Tiền dịch vụ',
      key: 'service_fee',
      render: (_, record) => {
        const wp = Number(record.water_price) || 0;
        const ip = Number(record.internet_price) || 0;
        const ep = Number(record.electricity_price) || 0;
        const gp = Number(record.general_price) || 0;
        return `${(wp + ip + ep + gp).toLocaleString()} VNĐ`;
      }
    },
    {
      title: 'Tổng cộng',
      key: 'total_amount',
      render: (_, record) => <strong style={{ color: '#3f8600' }}>{`${(Number(record.total_amount) || 0).toLocaleString()} VNĐ`}</strong>
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Thống kê doanh thu</Title>
        <Space size={8}>
          <span style={{ fontWeight: 500 }}>Thời gian:</span>
          <DatePicker
            value={startDate}
            onChange={(d) => setStartDate(d)}
            format="DD/MM/YYYY"
            placeholder="Bắt đầu"
            disabledDate={disabledStartDate}
          />
          <span style={{ color: '#999' }}>đến</span>
          <DatePicker
            value={endDate}
            onChange={(d) => setEndDate(d)}
            format="DD/MM/YYYY"
            placeholder="Kết thúc"
            disabledDate={disabledEndDate}
          />
        </Space>
      </div>

      <Spin spinning={invoicesLoading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Tổng doanh thu hóa đơn"
                value={billStats.totalRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
                formatter={(value) => `${Number(value).toLocaleString()} VNĐ`}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Doanh thu tiền phòng"
                value={billStats.roomFeeRevenue}
                prefix={<HomeOutlined />}
                valueStyle={{ color: '#1890ff' }}
                formatter={(value) => `${Number(value).toLocaleString()} VNĐ`}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Doanh thu tiền dịch vụ"
                value={billStats.serviceFeeRevenue}
                prefix={<PieChartOutlined />}
                valueStyle={{ color: '#722ed1' }}
                formatter={(value) => `${Number(value).toLocaleString()} VNĐ`}
              />
            </Card>
          </Col>
        </Row>
        
        <Card title="Chi tiết các hóa đơn đã thanh toán">
          <Table 
            dataSource={invoices} 
            columns={invoiceColumns} 
            rowKey="invoice_id" 
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default Reports;

