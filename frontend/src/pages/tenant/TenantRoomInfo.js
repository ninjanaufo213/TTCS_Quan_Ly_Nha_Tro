import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Card, Col, Descriptions, Row, Select, Spin, Typography } from 'antd';
import { rentedRoomService } from '../../services/rentedRoomService';
import { houseService } from '../../services/houseService';

const { Title, Text } = Typography;

export default function TenantRoomInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [selectedRrId, setSelectedRrId] = useState(null);
  const [house, setHouse] = useState(null);

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
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin phòng trọ.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHouse = async () => {
      setHouse(null);
      if (!selectedContract?.room?.houseId) return;
      try {
        const houseData = await houseService.getById(selectedContract.room.houseId);
        setHouse(houseData || null);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin nhà trọ.');
      }
    };
    loadHouse();
  }, [selectedContract?.room?.houseId]);

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
            Thông tin phòng trọ
          </Title>
          <Text type="secondary">Thông tin trọ/phòng bạn đang thuê (demo UI).</Text>
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
          <Card title="Nhà trọ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Tên nhà trọ">{house?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[house?.addressLine, house?.ward, house?.district].filter(Boolean).join(', ') || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phòng" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Tên phòng">{selectedContract?.room?.name || `#${selectedContract?.room_id}`}</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{selectedContract?.room?.capacity ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{selectedContract?.room?.description || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
