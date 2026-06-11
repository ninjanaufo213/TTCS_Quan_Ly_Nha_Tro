import React, { useState, useEffect } from 'react';
import {
  Row, Col, Card, Statistic, Table, Tag, Spin, Progress, Avatar, List, Typography
} from 'antd';
import {
  TeamOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  EnvironmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import adminService from '../../services/adminService';

const { Title, Text } = Typography;

// Mock data dùng khi backend chưa có endpoint
const MOCK_STATS = {
  totalUsers: 128,
  totalListings: 74,
  pendingListings: 12,
  approvedListings: 62,
};

const MOCK_AREA_DEMAND = [
  { district: 'Cầu Giấy', ward: 'Dịch Vọng', totalViews: 4820, listings: 18, color: '#e94560' },
  { district: 'Đống Đa', ward: 'Ô Chợ Dừa', totalViews: 3950, listings: 14, color: '#f5a623' },
  { district: 'Thanh Xuân', ward: 'Nhân Chính', totalViews: 3210, listings: 11, color: '#0f3460' },
  { district: 'Hà Đông', ward: 'Văn Quán', totalViews: 2780, listings: 9, color: '#7b61ff' },
  { district: 'Long Biên', ward: 'Bồ Đề', totalViews: 2350, listings: 8, color: '#00c9a7' },
  { district: 'Hoàng Mai', ward: 'Định Công', totalViews: 1890, listings: 7, color: '#febc2e' },
  { district: 'Bắc Từ Liêm', ward: 'Cổ Nhuế', totalViews: 1450, listings: 5, color: '#ff6b6b' },
];

const MOCK_RECENT_LISTINGS = [
  { id: 1, title: 'Phòng trọ Cầu Giấy - Gần ĐH Quốc Gia', district: 'Cầu Giấy', views: 312, status: 'pending' },
  { id: 2, title: 'Căn hộ mini Đống Đa full nội thất', district: 'Đống Đa', views: 289, status: 'approved' },
  { id: 3, title: 'Phòng trọ Thanh Xuân giá rẻ', district: 'Thanh Xuân', views: 241, status: 'pending' },
  { id: 4, title: 'Studio Hà Đông ban công riêng', district: 'Hà Đông', views: 198, status: 'approved' },
  { id: 5, title: 'Phòng trọ Long Biên gần cầu Chương Dương', district: 'Long Biên', views: 175, status: 'pending' },
];

const statCardStyle = (color) => ({
  borderRadius: 16,
  border: 'none',
  background: `linear-gradient(135deg, ${color}15, ${color}08)`,
  boxShadow: `0 4px 20px ${color}20`,
  overflow: 'hidden',
  position: 'relative',
});

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapAreaDemand = (item, index) => ({
  district: item?.district || '—',
  ward: item?.ward || '—',
  totalViews: safeNumber(item?.total_views ?? item?.totalViews),
  listings: safeNumber(item?.listings),
  color: item?.color || ['#e94560', '#f5a623', '#0f3460', '#7b61ff', '#00c9a7'][index % 5],
});

const AdminDashboard = () => {
  const [stats, setStats] = useState(MOCK_STATS);
  const [areaDemand, setAreaDemand] = useState(MOCK_AREA_DEMAND);
  const [recentListings, setRecentListings] = useState(MOCK_RECENT_LISTINGS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, areaData, allListingsData, usersData] = await Promise.all([
        adminService.getDashboardStats().catch(() => null),
        adminService.getAreaDemandStats().catch(() => null),
        adminService.getAllListings().catch(() => null),
        adminService.getAllUsers().catch(() => null),
      ]);
      
      let currentStats = { ...stats };
      if (statsData) {
        currentStats = statsData;
      }

      if (Array.isArray(areaData) && areaData.length > 0) {
        setAreaDemand(areaData.map(mapAreaDemand));
      }
      
      if (Array.isArray(allListingsData)) {
        const mappedListings = allListingsData.map(l => ({
          ...l,
          listingId: l.listing_id || l.listingId,
          viewsCount: l.views_count || l.viewsCount,
          isPublished: l.is_published ?? l.isPublished ?? l.published,
          createdAt: l.created_at || l.createdAt
        }));

        const sortedListings = [...mappedListings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recent = sortedListings.slice(0, 5).map(item => ({
          id: item.listingId,
          title: item.title,
          district: item.room?.district || '—',
          views: item.viewsCount || 0,
          status: item.isPublished ? 'approved' : 'pending'
        }));
        setRecentListings(recent);

        currentStats.totalListings = mappedListings.length;
        currentStats.approvedListings = mappedListings.filter(l => l.isPublished).length;
        currentStats.pendingListings = mappedListings.filter(l => !l.isPublished).length;
      }

      if (Array.isArray(usersData)) {
        currentStats.totalUsers = usersData.length;
      }

      setStats(currentStats);

    } catch {
      // Use mock data if API not available
    } finally {
      setLoading(false);
    }
  };

  const maxViews = areaDemand.length > 0 ? safeNumber(areaDemand[0].totalViews) : 1;

  const areaColumns = [
    {
      title: '#',
      key: 'rank',
      width: 48,
      render: (_, __, index) => (
        <Avatar
          size={28}
          style={{
            background: index < 3
              ? ['#e94560', '#f5a623', '#0f3460'][index]
              : '#e0e0e0',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {index + 1}
        </Avatar>
      ),
    },
    {
      title: 'Quận/Huyện',
      key: 'location',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.district}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            <EnvironmentOutlined /> {record.ward}
          </div>
        </div>
      ),
    },
    {
      title: 'Lượt xem',
      key: 'views',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            <EyeOutlined style={{ color: record.color, marginRight: 4 }} />
            {safeNumber(record.totalViews).toLocaleString()}
          </div>
          <Progress
            percent={Math.round((safeNumber(record.totalViews) / maxViews) * 100)}
            strokeColor={record.color}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: 'Số tin',
      dataIndex: 'listings',
      key: 'listings',
      render: (v) => <Tag color="blue">{v} tin</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#0f3460' }}>Dashboard Quản trị</Title>
        <Text type="secondary">Tổng quan hệ thống quản lý nhà trọ</Text>
      </div>

      {/* Stat Cards */}
      <Row gutter={[20, 20]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dash-animate-fade-in-up" style={statCardStyle('#0f3460')} bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span style={{ color: '#555', fontWeight: 500 }}>Tổng người dùng</span>}
              value={stats.totalUsers}
              prefix={<TeamOutlined style={{ color: '#0f3460' }} />}
              valueStyle={{ color: '#0f3460', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <RiseOutlined style={{ color: '#52c41a' }} /> +5 tuần này
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dash-animate-fade-in-up" style={statCardStyle('#e94560')} bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span style={{ color: '#555', fontWeight: 500 }}>Tổng tin đăng</span>}
              value={stats.totalListings}
              prefix={<HomeOutlined style={{ color: '#e94560' }} />}
              valueStyle={{ color: '#e94560', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              <RiseOutlined style={{ color: '#52c41a' }} /> +3 tuần này
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dash-animate-fade-in-up" style={statCardStyle('#f5a623')} bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span style={{ color: '#555', fontWeight: 500 }}>Chờ duyệt</span>}
              value={stats.pendingListings}
              prefix={<ClockCircleOutlined style={{ color: '#f5a623' }} />}
              valueStyle={{ color: '#f5a623', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#f5a623', fontWeight: 500 }}>
              Cần xử lý ngay
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="dash-animate-fade-in-up" style={statCardStyle('#52c41a')} bodyStyle={{ padding: '20px 24px' }}>
            <Statistic
              title={<span style={{ color: '#555', fontWeight: 500 }}>Đã duyệt</span>}
              value={stats.approvedListings}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              Tỷ lệ: {Math.round((stats.approvedListings / (stats.totalListings || 1)) * 100)}%
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main content */}
      <Row gutter={[20, 20]}>
        {/* Area Demand Chart */}
        <Col xs={24} lg={14}>
          <Card className="dash-animate-fade-in-up"             title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <EnvironmentOutlined style={{ color: '#e94560' }} />
                <span>Khu vực có nhu cầu thuê cao</span>
              </div>
            }
            style={{ borderRadius: 16, border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            loading={loading}
          >
            <Table className="dash-animate-fade-in-up"               dataSource={areaDemand}
              columns={areaColumns}
              rowKey="district"
              pagination={false}
              size="middle"
              rowClassName={(_, index) => index % 2 === 0 ? 'even-row' : ''}
            />
          </Card>
        </Col>

        {/* Recent Listings */}
        <Col xs={24} lg={10}>
          <Card className="dash-animate-fade-in-up"             title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined style={{ color: '#f5a623' }} />
                <span>Tin đăng gần đây</span>
              </div>
            }
            style={{ borderRadius: 16, border: '1px solid #f0f0f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <List
              dataSource={recentListings}
              renderItem={(item) => (
                <List.Item
                  style={{ padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}
                  extra={
                    <Tag color={item.status === 'pending' ? 'warning' : 'success'}>
                      {item.status === 'pending' ? 'Chờ duyệt' : 'Đã duyệt'}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ background: '#0f3460' }}
                        size={36}
                        icon={<HomeOutlined />}
                      />
                    }
                    title={
                      <Text style={{ fontSize: 13, fontWeight: 600 }} ellipsis>
                        {item.title}
                      </Text>
                    }
                    description={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <EnvironmentOutlined /> {item.district} &nbsp;·&nbsp;
                        <EyeOutlined /> {item.views} lượt xem
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
