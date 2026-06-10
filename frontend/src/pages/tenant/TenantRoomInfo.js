import React, { useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Card, Col, Descriptions, Form, Input, Rate, Row, Select, Spin, Typography } from 'antd';
import { rentedRoomService } from '../../services/rentedRoomService';
import { houseService } from '../../services/houseService';
import { reviewService } from '../../services/reviewService';

const { Title, Text } = Typography;

export default function TenantRoomInfo() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [contracts, setContracts] = useState([]);
  const [selectedRrId, setSelectedRrId] = useState(null);
  const [house, setHouse] = useState(null);
  const [reviewForm] = Form.useForm();

  const selectedContract = useMemo(
    () => contracts.find((c) => c.rr_id === selectedRrId) || null,
    [contracts, selectedRrId]
  );
  const selectedRoomId = selectedContract?.room_id || selectedContract?.room?.room_id || selectedContract?.room?.roomId;

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
      const houseId = selectedContract?.room?.house_id;
      if (!houseId) return;
      try {
        const houseData = await houseService.getById(houseId);
        setHouse(houseData || null);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin nhà trọ.');
      }
    };
    loadHouse();
  }, [selectedContract?.room?.house_id]);

  useEffect(() => {
    const loadReview = async () => {
      reviewForm.resetFields();
      if (!selectedRoomId) return;
      try {
        const review = await reviewService.getMyReview(selectedRoomId);
        if (review) {
          reviewForm.setFieldsValue({
            rating: review.rating,
            comment: review.comment || '',
          });
        }
      } catch (e) {
        message.error(e?.response?.data?.message || e?.message || 'Không thể tải đánh giá phòng.');
      }
    };
    loadReview();
  }, [selectedRoomId, reviewForm, message]);

  const handleSaveReview = async (values) => {
    if (!selectedRoomId) return;
    setReviewLoading(true);
    try {
      await reviewService.saveMyReview(selectedRoomId, {
        rating: values.rating,
        comment: values.comment,
      });
      message.success('Đã lưu đánh giá phòng.');
    } catch (e) {
      message.error(e?.response?.data?.message || e?.message || 'Không thể lưu đánh giá phòng.');
    } finally {
      setReviewLoading(false);
    }
  };

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
          <Text type="secondary">Thông tin trọ/phòng bạn đang thuê.</Text>
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
          <Card className="dash-animate-fade-in-up" title="Nhà trọ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Tên nhà trọ">{house?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[house?.address_line, house?.ward, house?.district].filter(Boolean).join(', ') || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card className="dash-animate-fade-in-up" title="Phòng" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Tên phòng">{selectedContract?.room?.name || `#${selectedContract?.room_id}`}</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{selectedContract?.room?.capacity ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{selectedContract?.room?.description || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24}>
          <Card className="dash-animate-fade-in-up" title="Đánh giá phòng" bordered>
            <Form form={reviewForm} layout="vertical" onFinish={handleSaveReview}>
              <Form.Item
                name="rating"
                label="Số sao"
                rules={[{ required: true, message: 'Vui lòng chọn số sao đánh giá.' }]}
              >
                <Rate />
              </Form.Item>
              <Form.Item name="comment" label="Nhận xét">
                <Input.TextArea rows={4} maxLength={1000} showCount placeholder="Chia sẻ trải nghiệm thuê phòng của bạn" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={reviewLoading}>
                Lưu đánh giá
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
