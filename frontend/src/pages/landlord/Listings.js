import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Space,
  Tag, App, Typography, Empty, Popconfirm, Row, Col
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { listingService } from '../../services/listingService';
import { roomService } from '../../services/roomService';
import { houseService } from '../../services/houseService';

const { Option } = Select;
const { Search } = Input;
const { Text } = Typography;

const Listings = () => {
  const { message } = App.useApp();
  const [listings, setListings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [housesById, setHousesById] = useState({});
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, record: null });
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchListings();
    fetchRooms();
    fetchHouses();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const data = await listingService.getMyListings();
      setListings(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách bài đăng!');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Fetch rooms error:', error);
    }
  };

  const fetchHouses = async () => {
    try {
      const data = await houseService.getAll();
      const mapped = Array.isArray(data)
        ? data.reduce((acc, house) => {
          acc[house.house_id] = house;
          return acc;
        }, {})
        : {};
      setHousesById(mapped);
    } catch (error) {
      console.error('Fetch houses error:', error);
    }
  };

  const handleCreateListing = async (values) => {
    try {
      const selectedRoom = rooms.find(room => room.room_id === values.roomId);
      const house = selectedRoom ? housesById[selectedRoom.house_id] : null;
      const roomName = selectedRoom?.name || '';
      const houseName = house?.name || '';
      const title = roomName && houseName ? `${roomName} - ${houseName}` : roomName;
      const addressLine = [house?.address_line || house?.addressLine, house?.ward, house?.district].filter(Boolean).join(', ');
      const descriptionLines = [
        addressLine ? `Dia chi: ${addressLine}` : null,
        selectedRoom?.area ? `Dien tich: ${selectedRoom.area} m2` : null,
        selectedRoom?.description ? `Mo ta: ${selectedRoom.description}` : null
      ].filter(Boolean);

      await listingService.createListing({
        room_id: values.roomId,
        title,
        description: descriptionLines.join('\n')
      });
      message.success('Đăng bài thành công!');
      setCreateModalVisible(false);
      form.resetFields();
      fetchListings();
    } catch (error) {
      console.error('Create listing error:', error);
      const errorMsg = error.response?.data?.detail || 'Lỗi khi đăng bài!';
      message.error(errorMsg);
    }
  };

  const handleDelete = async (record) => {
    try {
      await listingService.deleteListing(record.listingId || record.listing_id);
      message.success(`Đã xóa bài đăng "${record.title}"`);
      fetchListings();
    } catch (error) {
      console.error('Delete listing error:', error);
      message.error('Lỗi khi xóa bài đăng!');
    }
  };

  const filteredListings = listings.filter(l => {
    const mapped = {
      ...l,
      listingId: l.listing_id || l.listingId,
      viewsCount: l.views_count || l.viewsCount || 0,
      createdAt: l.created_at || l.createdAt
    };

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      if (!mapped.title?.toLowerCase().includes(lower)) return false;
    }
    return true;
  }).map(l => ({
    ...l,
    listingId: l.listing_id || l.listingId,
    viewsCount: l.views_count || l.viewsCount || 0,
    createdAt: l.created_at || l.createdAt
  }));

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Giá phòng',
      key: 'price',
      width: 140,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#e94560' }}>
          {(record.room?.price || 0).toLocaleString()} đ
        </span>
      ),
    },
    {
      title: 'Khu vực',
      key: 'area',
      render: (_, record) => (
        <span>
          {record.room?.district || '—'} – {record.room?.ward || ''}
        </span>
      ),
    },
    {
      title: 'Lượt xem',
      key: 'viewsCount',
      width: 100,
      render: (_, record) => <Tag>👁 {record.viewsCount || 0}</Tag>,
    },
    {
      title: 'Ngày đăng',
      key: 'createdAt',
      width: 120,
      render: (_, record) =>
        record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailModal({ open: true, record })}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Xóa bài đăng"
            description={`Bạn có chắc muốn xóa "${record.title}"?`}
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>Quản lý bài đăng</span>
          </div>
        }
        style={{ borderRadius: 16 }}
        extra={
          <Space>
            <Search
              placeholder="Tìm bài đăng..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 200 }}
              onChange={e => setSearchText(e.target.value)}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              form.resetFields();
              setCreateModalVisible(true);
            }}>
              Đăng tin mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="listingId"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} bài đăng` }}
          locale={{
            emptyText: <Empty description="Chưa có bài đăng nào" />
          }}
        />
      </Card>

      {/* Modal tạo bài đăng mới */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ color: '#1677ff' }} />
            <span>Đăng tin cho thuê phòng</span>
          </div>
        }
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateListing}
        >
          <Form.Item
            name="roomId"
            label="Chọn phòng"
            rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
          >
            <Select placeholder="Chọn phòng muốn đăng tin">
              {rooms.map(room => (
                <Option key={room.room_id} value={room.room_id}>
                  {room.name} – {(room.price || 0).toLocaleString()} VNĐ
                  {room.is_available ? ' (Trống)' : ' (Đã thuê)'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Đăng tin
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chi tiết bài đăng */}
      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={
          <Button onClick={() => setDetailModal({ open: false, record: null })}>
            Đóng
          </Button>
        }
        width={600}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#0f3460' }} />
            <span>Chi tiết bài đăng</span>
          </div>
        }
      >
        {detailModal.record && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 18 }}>{detailModal.record.title}</Text>
            </div>
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, marginBottom: 12 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text type="secondary">Khu vực:</Text>
                  <div>{detailModal.record.room?.district} – {detailModal.record.room?.ward}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Giá thuê:</Text>
                  <div style={{ fontWeight: 700, color: '#e94560' }}>
                    {(detailModal.record.room?.price || 0).toLocaleString()} đ/tháng
                  </div>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 12 }}>
                <Col span={12}>
                  <Text type="secondary">Lượt xem:</Text>
                  <div>👁 {detailModal.record.viewsCount || 0}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Ngày đăng:</Text>
                  <div>
                    {detailModal.record.createdAt
                      ? new Date(detailModal.record.createdAt).toLocaleString('vi-VN')
                      : '—'}
                  </div>
                </Col>
              </Row>
            </div>
            {detailModal.record.description && (
              <div>
                <Text strong>Mô tả:</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 8, whiteSpace: 'pre-wrap' }}>
                  {detailModal.record.description}
                </div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default Listings;
