import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Carousel, Button, Descriptions, Tag, Modal, DatePicker, TimePicker, Form, message, Input } from 'antd';
import { PhoneOutlined, HomeOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { listingService } from '../../services/listingService';
import { viewingService } from '../../services/viewingService';
import { authService } from '../../services/authService';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form] = Form.useForm();

  const loadListing = async () => {
    setLoading(true);
    try {
      const data = await listingService.getListingDetail(id);
      setListing(data);
    } catch (error) {
      message.error('Không thể tải chi tiết phòng trọ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListing();
  }, [id]);

  const handleSchedule = async (values) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    try {
      const resolvedRoomId = Number(listing?.room?.roomId ?? listing?.room?.room_id ?? room.roomId ?? room.room_id);
      if (!Number.isFinite(resolvedRoomId)) {
        message.error('Không xác định phòng để đặt lịch');
        return;
      }
      await viewingService.createViewing({
        room_id: resolvedRoomId,
        visit_date: values.visitDate.format('YYYY-MM-DD'),
        visit_time: values.visitTime.format('HH:mm')
      });
      message.success('Đặt lịch xem phòng thành công');
      setScheduleOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(error?.response?.data?.detail || 'Không thể đặt lịch xem phòng');
    }
  };

  const room = listing?.room || {};
  const houseName = room.houseName || room.house_name || '';
  const addressLine = [room.address || room.address_line, room.ward, room.district].filter(Boolean).join(', ');
  const images = (room.image_urls && room.image_urls.length > 0)
    ? room.image_urls
    : (room.imageUrls && room.imageUrls.length > 0)
      ? room.imageUrls
      : [];
  const isAvailable = room.isAvailable ?? room.is_available ?? true;
  const roomName = room.name || '';
  const roomLabel = [roomName, houseName].filter(Boolean).join(' - ');
  const landlordName = room.landlordName || room.landlord_name || '';
  const landlordPhone = room.landlordPhone || room.landlord_phone || '';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <Card loading={loading} title={listing?.title || ''}>
        {images.length > 0 && (
          <Carousel autoplay style={{ marginBottom: 24 }}>
            {images.map((img, index) => (
              <div key={index}>
                <img
                  src={img}
                  alt={`Room ${index + 1}`}
                  style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 8 }}
                />
              </div>
            ))}
          </Carousel>
        )}

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Tên phòng">
            {room.name || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Nhà trọ">
            {houseName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa chỉ">
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            {addressLine || 'Chưa có địa chỉ'}
          </Descriptions.Item>
          <Descriptions.Item label="Diện tích">
            {room.area ? `${room.area} m2` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Giá thuê">
            <Tag color="green">{room.price ? `${room.price.toLocaleString()} VNĐ/tháng` : '—'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Mô tả">
            {room.description || 'Chưa có mô tả'}
          </Descriptions.Item>
          <Descriptions.Item label="Chủ trọ">
            <UserOutlined style={{ marginRight: 8 }} />
            {landlordName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <PhoneOutlined style={{ marginRight: 8 }} />
            {landlordPhone || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={isAvailable ? 'green' : 'red'}>
              {isAvailable ? 'Trống' : 'Đã thuê'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
          <Button type="primary" icon={<HomeOutlined />} onClick={() => setScheduleOpen(true)}>
            Đặt lịch xem phòng
          </Button>
        </div>
      </Card>

      <Modal
        title="Đặt lịch xem phòng"
        open={scheduleOpen}
        onCancel={() => setScheduleOpen(false)}
        onOk={() => form.submit()}
        okText="Đặt lịch"
      >
        <Form form={form} layout="vertical" onFinish={handleSchedule}>
          <Form.Item label="Phòng">
            <Input value={roomLabel} disabled />
          </Form.Item>
          <Form.Item
            name="visitDate"
            label="Ngày xem phòng"
            rules={[{ required: true, message: 'Vui lòng chọn ngày xem' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(current) => current && current.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item
            name="visitTime"
            label="Giờ xem phòng"
            rules={[{ required: true, message: 'Vui lòng chọn giờ xem' }]}
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ListingDetail;

