import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Descriptions, Divider, List, Row, Select, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { invoiceService } from '../../services/invoiceService';
import { rentedRoomService } from '../../services/rentedRoomService';

const { Title, Text } = Typography;

const formatMoney = (value) => (value === null || value === undefined ? '-' : new Intl.NumberFormat('vi-VN').format(value));
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

export default function TenantServicesInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [selectedRrId, setSelectedRrId] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.rr_id === selectedRrId) || null,
    [contracts, selectedRrId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rentedRooms = await rentedRoomService.getMyActive();
        const list = Array.isArray(rentedRooms) ? rentedRooms : [];
        setContracts(list);
        setSelectedRrId(list[0]?.rr_id ?? null);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin dịch vụ.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadInvoices = async () => {
      setInvoices([]);
      if (!selectedRrId) return;
      try {
        const data = await invoiceService.getMy();
        const list = Array.isArray(data) ? data : [];
        setInvoices(list.filter((inv) => Number(inv?.rr_id) === Number(selectedRrId)));
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không thể tải hóa đơn.');
      }
    };
    loadInvoices();
  }, [selectedRrId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" showIcon message="Có lỗi xảy ra" description={error} />;
  }

  if (!contracts.length) {
    return (
      <Alert
        type="info"
        showIcon
        message="Bạn chưa có hợp đồng thuê còn hiệu lực"
        description="Vui lòng liên hệ chủ trọ để kiểm tra hợp đồng thuê."
      />
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} align="middle">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Tiền điện / nước / wifi
          </Title>
          <Text type="secondary">Giá dịch vụ và hóa đơn gần đây.</Text>
        </Col>
        <Col flex="auto" />
        <Col>
          <Select
            style={{ minWidth: 260 }}
            value={selectedRrId}
            onChange={setSelectedRrId}
            options={contracts.map((c) => ({
              value: c.rr_id,
              label: c.room?.name || `Phòng #${c.room_id}`,
            }))}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Bảng giá dịch vụ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Giá điện">{formatMoney(selectedContract?.electricity_unit_price)} đ/kWh</Descriptions.Item>
              <Descriptions.Item label="Số điện đầu">{selectedContract?.initial_electricity_num ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">{formatMoney(selectedContract?.water_price)} đ</Descriptions.Item>
              <Descriptions.Item label="Wifi">{formatMoney(selectedContract?.internet_price)} đ</Descriptions.Item>
              <Descriptions.Item label="Dịch vụ chung">{formatMoney(selectedContract?.general_price)} đ</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">Hóa đơn thể hiện chi tiết theo kỳ/tháng.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Hóa đơn gần đây" bordered>
            <List
              dataSource={invoices}
              locale={{ emptyText: 'Chưa có hóa đơn.' }}
              renderItem={(inv) => (
                <List.Item
                  extra={
                    <Tag color={inv?.is_paid ? 'green' : inv?.proof_status === 'PENDING' ? 'orange' : 'default'}>
                      {inv?.is_paid ? 'PAID' : inv?.proof_status || 'UNPAID'}
                    </Tag>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{`Hóa đơn #${inv?.invoice_id ?? ''}`}</Text>
                    <Text type="secondary">
                      Kỳ: {formatDate(inv?.created_at)} • Hạn: {formatDate(inv?.due_date)} • Tổng: {formatMoney(inv?.total_amount)} đ
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
