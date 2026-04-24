import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Space, Modal, Descriptions,
  App, Input, Select, Row, Col, Statistic, Badge, Typography, Avatar
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SearchOutlined,
  HomeOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import adminService from '../../services/adminService';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// No Mock Data Needed

const RoomApproval = () => {
  const { message } = App.useApp();
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModal, setDetailModal] = useState({ open: false, record: null });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFilters(listings, statusFilter, searchText);
  }, [listings, statusFilter, searchText]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const rawData = await adminService.getAllListings();
      const mappedData = rawData.map(l => ({
        ...l,
        listingId: l.listing_id || l.listingId,
        viewsCount: l.views_count || l.viewsCount,
        isPublished: l.is_published ?? l.isPublished,
        createdAt: l.created_at || l.createdAt
      }));
      setListings(mappedData);
    } catch {
      message.error("Lỗi khi tải dữ liệu từ Backend!");
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data, status, search) => {
    let result = [...data];
    if (status === 'pending') result = result.filter(l => !l.isPublished);
    else if (status === 'approved') result = result.filter(l => l.isPublished);

    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(l => l.title?.toLowerCase().includes(lower) ||
        l.room?.district?.toLowerCase().includes(lower));
    }
    setFiltered(result);
  };

  const handleApprove = async (record) => {
    try {
      await adminService.approveListing(record.listingId);
      message.success(`✅ Đã duyệt: "${record.title}"`);
      setListings(prev => prev.map(l =>
        l.listingId === record.listingId ? { ...l, isPublished: true } : l
      ));
      if (detailModal.record?.listingId === record.listingId) {
        setDetailModal({ open: false, record: null });
      }
    } catch {
      message.error('Lỗi khi duyệt tin!');
    }
  };

  const handleReject = async (record) => {
    try {
      await adminService.rejectListing(record.listingId);
      message.warning(`🚫 Đã từ chối: "${record.title}"`);
      setListings(prev => prev.map(l =>
        l.listingId === record.listingId ? { ...l, isPublished: false } : l
      ));
      if (detailModal.record?.listingId === record.listingId) {
        setDetailModal({ open: false, record: null });
      }
    } catch {
      message.error('Lỗi khi từ chối tin!');
    }
  };

  const pendingCount = listings.filter(l => !l.isPublished).length;
  const approvedCount = listings.filter(l => l.isPublished).length;

  const columns = [
    {
      title: 'Tin đăng',
      key: 'listing',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            size={44}
            icon={<HomeOutlined />}
            style={{ background: record.isPublished ? '#52c41a' : '#f5a623', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{record.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>
              📍 {record.room?.district} – {record.room?.ward}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Giá phòng',
      key: 'price',
      width: 130,
      render: (_, record) => (
        <span style={{ fontWeight: 600, color: '#e94560' }}>
          {(record.room?.price || 0).toLocaleString()} đ
        </span>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewsCount',
      key: 'viewsCount',
      width: 100,
      render: v => <Tag>👁 {v || 0}</Tag>,
    },
    {
      title: 'Ngày đăng',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 130,
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
          {!record.isPublished && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record)}
              style={{ background: '#52c41a', border: 'none' }}
            >
              Duyệt
            </Button>
          )}
          {record.isPublished && (
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(record)}
            >
              Thu hồi
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 12, background: '#fffbe6', border: '1px solid #ffe58f' }} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title="Chờ duyệt"
              value={pendingCount}
              prefix={<ClockCircleOutlined style={{ color: '#f5a623' }} />}
              valueStyle={{ color: '#f5a623', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, background: '#f6ffed', border: '1px solid #b7eb8f' }} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title="Đã duyệt"
              value={approvedCount}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 12, background: '#e6f4ff', border: '1px solid #91caff' }} bodyStyle={{ padding: '16px 20px' }}>
            <Statistic
              title="Tổng tin"
              value={listings.length}
              prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Duyệt tin đăng phòng trọ</span>
          </div>
        }
        style={{ borderRadius: 16 }}
        extra={
          <Space>
            <Search
              placeholder="Tìm tin đăng..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 200 }}
              onChange={e => setSearchText(e.target.value)}
            />
            <Select
              defaultValue="all"
              style={{ width: 140 }}
              suffixIcon={<FilterOutlined />}
              onChange={setStatusFilter}
              options={[
                { label: 'Tất cả', value: 'all' },
                { label: 'Chờ duyệt', value: 'pending' },
                { label: 'Đã duyệt', value: 'approved' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="listingId"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} tin` }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false, record: null })}
        footer={
          detailModal.record && (
            <Space>
              <Button onClick={() => setDetailModal({ open: false, record: null })}>Đóng</Button>
              {!detailModal.record.isPublished ? (
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(detailModal.record)}
                  style={{ background: '#52c41a', border: 'none' }}
                >
                  Duyệt tin này
                </Button>
              ) : (
                <Button
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleReject(detailModal.record)}
                >
                  Thu hồi
                </Button>
              )}
            </Space>
          )
        }
        width={620}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HomeOutlined style={{ color: '#0f3460' }} />
            <span>Chi tiết tin đăng</span>
          </div>
        }
      >
        {detailModal.record && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>{detailModal.record.title}</Title>
              <Tag
                color={detailModal.record.isPublished ? 'success' : 'warning'}
                style={{ marginTop: 8 }}
              >
                {detailModal.record.isPublished ? '✅ Đã duyệt' : '⏳ Chờ duyệt'}
              </Tag>
            </div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Quận/Huyện">
                {detailModal.record.room?.district}
              </Descriptions.Item>
              <Descriptions.Item label="Phường/Xã">
                {detailModal.record.room?.ward}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {detailModal.record.room?.address}
              </Descriptions.Item>
              <Descriptions.Item label="Giá thuê">
                <span style={{ fontWeight: 700, color: '#e94560' }}>
                  {(detailModal.record.room?.price || 0).toLocaleString()} đ/tháng
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Lượt xem">
                👁 {detailModal.record.viewsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đăng" span={2}>
                {detailModal.record.createdAt
                  ? new Date(detailModal.record.createdAt).toLocaleString('vi-VN')
                  : '—'}
              </Descriptions.Item>
            </Descriptions>
            {detailModal.record.description && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Mô tả:</Text>
                <Paragraph style={{ marginTop: 8, padding: 12, background: '#fafafa', borderRadius: 8 }}>
                  {detailModal.record.description}
                </Paragraph>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default RoomApproval;
