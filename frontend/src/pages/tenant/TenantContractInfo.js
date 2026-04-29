import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Descriptions, Row, Select, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { rentedRoomService } from '../../services/rentedRoomService';

const { Title, Text, Link } = Typography;

const formatMoney = (value) => {
  if (value === null || value === undefined) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('vi-VN').format(numberValue);
};
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

const ContractStatusTag = ({ endDate, isActive }) => {
  if (!isActive) return <Tag color="default">Đã kết thúc</Tag>;
  if (!endDate) return <Tag color="blue">Đang hiệu lực</Tag>;

  const today = dayjs().startOf('day');
  const end = dayjs(endDate).startOf('day');
  const daysLeft = end.diff(today, 'day');

  if (daysLeft < 0) return <Tag color="default">Đã hết hạn</Tag>;
  if (daysLeft <= 7) return <Tag color="red">Sắp hết hạn ({daysLeft} ngày)</Tag>;
  if (daysLeft <= 30) return <Tag color="orange">Còn {daysLeft} ngày</Tag>;
  return <Tag color="green">Còn {daysLeft} ngày</Tag>;
};

export default function TenantContractInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [selectedRrId, setSelectedRrId] = useState(null);

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
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin hợp đồng.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
            Thông tin hợp đồng
          </Title>
          <Text type="secondary">Thời hạn hợp đồng, tiền thuê, tiền cọc.</Text>
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
        <Col xs={24} lg={16}>
          <Card
            title="Hợp đồng thuê phòng"
            bordered
            extra={<ContractStatusTag endDate={selectedContract?.end_date} isActive={selectedContract?.is_active} />}
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Phòng">{selectedContract?.room?.name || `#${selectedContract?.room_id}`}</Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{formatDate(selectedContract?.start_date)}</Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">{formatDate(selectedContract?.end_date)}</Descriptions.Item>
              <Descriptions.Item label="Số người ở">{selectedContract?.number_of_tenants ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Tiền thuê/tháng">{formatMoney(selectedContract?.monthly_rent)} đ</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatMoney(selectedContract?.deposit)} đ</Descriptions.Item>
              <Descriptions.Item label="File hợp đồng">
                {selectedContract?.contract_url ? (
                  <Link href={selectedContract.contract_url} target="_blank" rel="noreferrer">
                    Xem hợp đồng
                  </Link>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
