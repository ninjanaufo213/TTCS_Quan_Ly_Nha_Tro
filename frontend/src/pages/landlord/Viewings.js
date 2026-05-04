import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message } from 'antd';
import dayjs from 'dayjs';
import { viewingService } from '../../services/viewingService';
import { useNavigate } from 'react-router-dom';

const statusColorMap = {
  APPROVED: 'green',
  SCHEDULED: 'blue',
  CONTRACT_PENDING: 'gold',
  CONTRACTED: 'purple',
  CANCELED: 'red'
};

const Viewings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewings, setViewings] = useState([]);

  const loadViewings = async () => {
    setLoading(true);
    try {
      const data = await viewingService.getLandlordViewings();
      setViewings(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Không thể tải lịch xem phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViewings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await viewingService.cancelLandlordViewing(id);
      message.success('Đã hủy lịch xem');
      await loadViewings();
    } catch (error) {
      message.error('Không thể hủy lịch xem');
    }
  };

  const goToContractRequest = (record) => {
    const params = new URLSearchParams({
      action: 'request',
      viewingId: String(record.requestId),
      room: String(record.roomId),
      tenantName: record.tenantName || '',
      tenantPhone: record.tenantPhone || ''
    });
    navigate(`/app/contracts?${params.toString()}`);
  };

  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName'
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'houseName',
      key: 'houseName'
    },
    {
      title: 'Người thuê',
      dataIndex: 'tenantName',
      key: 'tenantName'
    },
    {
      title: 'SĐT',
      dataIndex: 'tenantPhone',
      key: 'tenantPhone'
    },
    {
      title: 'Ngày',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '')
    },
    {
      title: 'Giờ',
      dataIndex: 'visitTime',
      key: 'visitTime',
      render: (value) => value || ''
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const disabled = ['CANCELED', 'CONTRACTED'].includes(record.status);
        return (
          <Space>
            <Button size="small" onClick={() => goToContractRequest(record)} disabled={disabled}>
              Tạo hợp đồng mới
            </Button>
            <Button size="small" danger onClick={() => handleCancel(record.requestId)} disabled={disabled}>
              Hủy lịch
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Card title="Lịch đặt xem phòng">
      <Table
        rowKey="requestId"
        loading={loading}
        dataSource={viewings}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default Viewings;
