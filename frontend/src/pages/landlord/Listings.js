import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Space,
  Tag, App, Badge, Row, Col, Statistic, Typography, Empty, Popconfirm
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { listingService } from '../../services/listingService';
import { roomService } from '../../services/roomService';

const { TextArea } = Input;
const { Option } = Select;
const { Search } = Input;
const { Text } = Typography;

const Listings = () => {
  const { message } = App.useApp();
  const [listings, setListings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, record: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  useEffect(() => {
    fetchListings();
    fetchRooms();
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

  const handleCreateListing = async (values) => {
    try {
      await listingService.createListing({
        room_id: values.roomId,
        title: values.title,
        description: values.description
      });
      message.success('Đăng bài thành công! Bài đăng đang chờ admin duyệt.');
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
      isPublished: l.is_published ?? l.isPublished,
      viewsCount: l.views_count || l.viewsCount || 0,
      createdAt: l.created_at || l.createdAt
    };

    if (statusFilter === 'pending' && mapped.isPublished) return false;
    if (statusFilter === 'approved' && !mapped.isPublished) return false;

    if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      if (!mapped.title?.toLowerCase().includes(lower)) return false;
    }
    return true;
  }).map(l => ({
    ...l,
    listingId: l.listing_id || l.listingId,
    isPublished: l.is_published ?? l.isPublished,
    viewsCount: l.views_count || l.viewsCount || 0,
    createdAt: l.created_at || l.createdAt
  }));

  const pendingCount = filteredListings.filter(l => !l.isPublished).length;
  const approvedCount = filteredListings.filter(l => l.isPublished).length;

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
      title: 'Trạng thái',
      key: 'status',
      width: 140,
      render: (_, record) =>
        record.isPublished
          ? <Badge status="success" text={<Tag color="success">Đã duyệt</Tag>} />
          : <Badge status="warning" text={<Tag color="warning">Chờ duyệt</Tag>} />,
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
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, background: '#fffbe6', border: '1px solid #ffe58f' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title="Chờ duyệt"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#f5a623' }} />}
              valueStyle={{ color: '#f5a623', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, background: '#f6ffed', border: '1px solid #b7eb8f' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title="Đã duyệt"
              value={approvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            style={{ borderRadius: 12, background: '#e6f4ff', border: '1px solid #91caff' }}
            styles={{ body: { padding: '16px 20px' } }}
          >
            <Statistic
              title="Tổng bài đăng"
              value={listings.length}
              prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

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
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              onChange={setStatusFilter}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Chờ duyệt', value: 'pending' },
                { label: 'Đã duyệt', value: 'approved' },
              ]}
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

          <Form.Item
            name="title"
            label="Tiêu đề bài đăng"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề (VD: Cho thuê phòng trọ giá rẻ)" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả chi tiết!' }]}
          >
            <TextArea
              rows={5}
              placeholder="Mô tả chi tiết phòng trọ, tiện ích, nội quy..."
            />
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
              <div style={{ marginTop: 8 }}>
                <Tag color={detailModal.record.isPublished ? 'success' : 'warning'}>
                  {detailModal.record.isPublished ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
                </Tag>
              </div>
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
