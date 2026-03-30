import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Tag, Typography, Progress, Statistic, Avatar, List, Divider, Tooltip
} from 'antd';
import {
  EnvironmentOutlined,
  RiseOutlined,
  EyeOutlined,
  HomeOutlined,
  FireOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import adminService from '../../services/adminService';

const { Title, Text } = Typography;

const MOCK_AREA_DATA = [
  { district: 'Cầu Giấy', ward: 'Dịch Vọng Hậu', totalViews: 4820, listings: 18, avgPrice: 4200000, trend: '+12%', color: '#e94560' },
  { district: 'Đống Đa', ward: 'Ô Chợ Dừa', totalViews: 3950, listings: 14, avgPrice: 4800000, trend: '+8%', color: '#f5a623' },
  { district: 'Thanh Xuân', ward: 'Nhân Chính', totalViews: 3210, listings: 11, avgPrice: 3800000, trend: '+15%', color: '#0f3460' },
  { district: 'Hà Đông', ward: 'Văn Quán', totalViews: 2780, listings: 9, avgPrice: 3200000, trend: '+5%', color: '#7b61ff' },
  { district: 'Long Biên', ward: 'Bồ Đề', totalViews: 2350, listings: 8, avgPrice: 3000000, trend: '+3%', color: '#00c9a7' },
  { district: 'Hoàng Mai', ward: 'Định Công', totalViews: 1890, listings: 7, avgPrice: 2800000, trend: '+7%', color: '#febc2e' },
  { district: 'Bắc Từ Liêm', ward: 'Cổ Nhuế', totalViews: 1450, listings: 5, avgPrice: 2600000, trend: '+2%', color: '#ff6b6b' },
  { district: 'Nam Từ Liêm', ward: 'Mỹ Đình', totalViews: 1320, listings: 5, avgPrice: 3400000, trend: '+6%', color: '#43b89c' },
];

const MOCK_PRICE_RANGES = [
  { range: 'Dưới 2 triệu', count: 8, percent: 11, color: '#52c41a' },
  { range: '2 – 3 triệu', count: 22, percent: 30, color: '#1677ff' },
  { range: '3 – 5 triệu', count: 31, percent: 42, color: '#7b61ff' },
  { range: 'Trên 5 triệu', count: 13, percent: 17, color: '#e94560' },
];

const AreaStats = () => {
  const [areaData, setAreaData] = useState(MOCK_AREA_DATA);
  const [loading, setLoading] = useState(false);
  const maxViews = areaData.length > 0 ? areaData[0].totalViews : 1;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAreaDemandStats();
        if (data?.length) setAreaData(data);
      } catch {
        // Use mock
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      title: 'Hạng',
      key: 'rank',
      width: 56,
      render: (_, __, idx) => {
        if (idx === 0) return <TrophyOutlined style={{ color: '#ffd700', fontSize: 22 }} />;
        if (idx === 1) return <TrophyOutlined style={{ color: '#c0c0c0', fontSize: 20 }} />;
        if (idx === 2) return <TrophyOutlined style={{ color: '#cd7f32', fontSize: 18 }} />;
        return <Text type="secondary" style={{ fontWeight: 600 }}>#{idx + 1}</Text>;
      }
    },
    {
      title: 'Khu vực',
      key: 'area',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            <EnvironmentOutlined style={{ color: record.color, marginRight: 4 }} />
            {record.district}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.ward}</Text>
        </div>
      ),
    },
    {
      title: 'Lượt xem / Nhu cầu',
      key: 'views',
      render: (_, record) => (
        <div style={{ minWidth: 180 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text>
              <EyeOutlined style={{ color: record.color }} /> {record.totalViews.toLocaleString()}
            </Text>
            <Tag color="processing" style={{ fontSize: 11 }}>{record.trend}</Tag>
          </div>
          <Progress
            percent={Math.round((record.totalViews / maxViews) * 100)}
            strokeColor={{ from: record.color, to: record.color + '88' }}
            showInfo={false}
            size={['100%', 8]}
          />
        </div>
      ),
    },
    {
      title: 'Số tin',
      dataIndex: 'listings',
      key: 'listings',
      width: 80,
      render: v => <Tag icon={<HomeOutlined />} color="blue">{v}</Tag>,
    },
    {
      title: 'Giá TB/tháng',
      dataIndex: 'avgPrice',
      key: 'avgPrice',
      width: 140,
      render: v => (
        <span style={{ fontWeight: 600, color: '#e94560' }}>
          {(v / 1000000).toFixed(1)}tr đ
        </span>
      ),
    },
    {
      title: 'Mức độ',
      key: 'level',
      width: 100,
      render: (_, __, idx) => {
        const levels = [
          { text: 'Rất cao', color: '#e94560' },
          { text: 'Cao', color: '#f5a623' },
          { text: 'Khá cao', color: '#7b61ff' },
        ];
        const l = idx < 3 ? levels[idx] : { text: 'Trung bình', color: '#888' };
        return (
          <Tag style={{ color: l.color, borderColor: l.color, background: l.color + '12', fontWeight: 600 }}>
            {idx < 2 && <FireOutlined style={{ marginRight: 4 }} />}
            {l.text}
          </Tag>
        );
      },
    },
  ];

  const topDistrict = areaData[0];
  const totalViews = areaData.reduce((s, a) => s + a.totalViews, 0);
  const totalListings = areaData.reduce((s, a) => s + a.listings, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <EnvironmentOutlined style={{ color: '#e94560', marginRight: 8 }} />
          Thống kê khu vực có nhu cầu thuê cao
        </Title>
        <Text type="secondary">Phân tích dữ liệu lượt xem và xu hướng tìm thuê theo địa bàn</Text>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 14, background: 'linear-gradient(135deg, #e94560, #c0392b)', border: 'none' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Tổng lượt xem</span>}
              value={totalViews.toLocaleString()}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 28 }}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 14, background: 'linear-gradient(135deg, #0f3460, #16213e)', border: 'none' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Khu vực theo dõi</span>}
              value={areaData.length}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 28 }}
              prefix={<EnvironmentOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{ borderRadius: 14, background: 'linear-gradient(135deg, #7b61ff, #4c38c7)', border: 'none' }}
            bodyStyle={{ padding: '20px 24px' }}
          >
            <Statistic
              title={<span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Khu vực nổi bật</span>}
              value={topDistrict?.district || '—'}
              valueStyle={{ color: '#fff', fontWeight: 700, fontSize: 22 }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        {/* Main Table */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiseOutlined style={{ color: '#e94560' }} />
                <span>Xếp hạng khu vực theo nhu cầu</span>
              </div>
            }
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            loading={loading}
          >
            <Table
              dataSource={areaData}
              columns={columns}
              rowKey="district"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* Side panels */}
        <Col xs={24} lg={8}>
          {/* Price Range Chart */}
          <Card
            title="Phân bổ giá thuê"
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 16 }}
          >
            {MOCK_PRICE_RANGES.map((p) => (
              <div key={p.range} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 13 }}>{p.range}</Text>
                  <Text style={{ fontSize: 13, fontWeight: 600 }}>{p.count} tin ({p.percent}%)</Text>
                </div>
                <Progress
                  percent={p.percent}
                  strokeColor={p.color}
                  showInfo={false}
                  size={['100%', 10]}
                />
              </div>
            ))}
          </Card>

          {/* Quick Insights */}
          <Card
            title={
              <span>
                <FireOutlined style={{ color: '#e94560', marginRight: 6 }} />
                Điểm nóng hot
              </span>
            }
            style={{ borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <List
              dataSource={areaData.slice(0, 4)}
              renderItem={(item, idx) => (
                <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={36}
                        style={{ background: item.color, fontSize: 13, fontWeight: 700 }}
                      >
                        {idx + 1}
                      </Avatar>
                    }
                    title={
                      <Text style={{ fontWeight: 600, fontSize: 13 }}>{item.district}</Text>
                    }
                    description={
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag style={{ fontSize: 11 }}>{item.listings} tin</Tag>
                        <Tag color="processing" style={{ fontSize: 11 }}>
                          <RiseOutlined /> {item.trend}
                        </Tag>
                      </div>
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

export default AreaStats;
