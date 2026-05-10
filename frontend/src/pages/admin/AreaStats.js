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

const PRICE_RANGES = [
  { range: 'Dưới 2 triệu', min: 0, max: 2000000, color: '#52c41a' },
  { range: '2 – 3 triệu', min: 2000000, max: 3000000, color: '#1677ff' },
  { range: '3 – 5 triệu', min: 3000000, max: 5000000, color: '#7b61ff' },
  { range: 'Trên 5 triệu', min: 5000000, max: Infinity, color: '#e94560' },
];

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Convert snake_case API response to camelCase used by the component
const mapApiData = (item) => ({
  district: item?.district || '—',
  ward: item?.ward || '—',
  totalViews: safeNumber(item?.total_views ?? item?.totalViews),
  listings: safeNumber(item?.listings),
  avgPrice: safeNumber(item?.avg_price ?? item?.avgPrice),
  color: item?.color || '#1677ff',
});

// Dynamically compute price range distribution from area data
const computePriceRanges = (data) => {
  const totalListings = data.reduce((s, d) => s + d.listings, 0);
  const ranges = PRICE_RANGES.map((r) => ({ ...r, count: 0 }));

  data.forEach((d) => {
    const price = d.avgPrice;
    for (const r of ranges) {
      if (price >= r.min && price < r.max) {
        r.count += d.listings;
        break;
      }
    }
  });

  return ranges.map((r) => ({
    range: r.range,
    count: r.count,
    percent: totalListings > 0 ? Math.round((r.count / totalListings) * 100) : 0,
    color: r.color,
  }));
};

const AreaStats = () => {
  const [areaData, setAreaData] = useState([]);
  const [priceRanges, setPriceRanges] = useState(computePriceRanges([]));
  const [loading, setLoading] = useState(false);
  const maxViews = areaData.length > 0 ? safeNumber(areaData[0].totalViews) : 1;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await adminService.getAreaDemandStats();
        const mapped = Array.isArray(data) ? data.map(mapApiData) : [];
        setAreaData(mapped);
        setPriceRanges(computePriceRanges(mapped));
      } catch {
        setAreaData([]);
        setPriceRanges(computePriceRanges([]));
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
              <EyeOutlined style={{ color: record.color }} /> {safeNumber(record.totalViews).toLocaleString()}
            </Text>
          </div>
          <Progress
            percent={Math.round((safeNumber(record.totalViews) / maxViews) * 100)}
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
          {(safeNumber(v) / 1000000).toFixed(1)}tr đ
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
  const totalViews = areaData.reduce((s, a) => s + safeNumber(a.totalViews), 0);
  const totalListings = areaData.reduce((s, a) => s + safeNumber(a.listings), 0);

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
            {priceRanges.map((p) => (
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
