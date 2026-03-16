import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Tag,
  Avatar,
  Space,
  Row,
  Col,
  Dropdown,
  Menu,
  Divider,
  Badge
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  HeartOutlined,
  HeartFilled,
  PhoneOutlined,
  PlayCircleOutlined,
  StarFilled,
  ArrowRightOutlined,
  MessageOutlined,
  ArrowUpOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import '../../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('suggest');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [savedListings, setSavedListings] = useState(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Listings data - will be populated from API
  const [listings, setListings] = useState([]);

  const provinces = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Phòng trọ Hồ Chí Minh', value: 'Ho Chi Minh' },
    { label: 'Phòng trọ Hà Nội', value: 'Ha Noi' },
    { label: 'Phòng trọ Đà Nẵng', value: 'Da Nang' },
    { label: 'Phòng trọ Bình Dương', value: 'Binh Duong' }
  ];

  const priceRanges = [
    { label: 'Dưới 1 triệu', value: [0, 1000000] },
    { label: 'Từ 1 - 2 triệu', value: [1000000, 2000000] },
    { label: 'Từ 2 - 3 triệu', value: [2000000, 3000000] },
    { label: 'Từ 3 - 5 triệu', value: [3000000, 5000000] },
    { label: 'Từ 5 - 7 triệu', value: [5000000, 7000000] },
    { label: 'Từ 7 - 10 triệu', value: [7000000, 10000000] },
    { label: 'Từ 10 - 15 triệu', value: [10000000, 15000000] },
    { label: 'Trên 15 triệu', value: [15000000, Infinity] }
  ];

  const areaRanges = [
    { label: 'Dưới 20 m²', value: [0, 20] },
    { label: 'Từ 20 - 30 m²', value: [20, 30] },
    { label: 'Từ 30 - 50 m²', value: [30, 50] },
    { label: 'Từ 50 - 70 m²', value: [50, 70] },
    { label: 'Từ 70 - 90 m²', value: [70, 90] },
    { label: 'Trên 90 m²', value: [90, Infinity] }
  ];

  const newListings = listings.slice(0, 3);

  const menuCategories = [
    { key: 'rooms', label: 'Phòng trọ' },
    { key: 'houses', label: 'Nhà nguyên căn' },
    { key: 'apartments', label: 'Căn hộ chung cư' },
    { key: 'mini', label: 'Căn hộ mini' },
    { key: 'service', label: 'Căn hộ dịch vụ' },
    { key: 'sharing', label: 'Ở ghép' },
    { key: 'office', label: 'Mặt bằng' },
    { key: 'blog', label: 'Blog' },
    { key: 'pricing', label: 'Bảng giá dịch vụ' }
  ];

  useEffect(() => {
    // Load listings from API
    // const fetchListings = async () => {
    //   try {
    //     const response = await fetch('/api/rooms');
    //     const data = await response.json();
    //     setListings(data);
    //   } catch (error) {
    //     console.error('Error fetching listings:', error);
    //   }
    // };
    // fetchListings();

    // Tạm thời để trống, chưa có API
    setListings([]);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = () => {
    setShowBackToTop(window.scrollY > 300);
  };

  const toggleSavedListing = (id) => {
    setSavedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)} triệu`;
    }
    return `${price.toLocaleString()} VNĐ`;
  };

  const renderListingCard = (listing) => (
    <Card key={listing.id} className="listing-card">
      <Row gutter={16}>
        {/* Images Section */}
        <Col xs={24} sm={24} md={14}>
          <div className="images-container">
            {/* Main large image */}
            <div className="main-image">
              <img src={listing.images[0]} alt="Main" />
              {listing.hasVideo && (
                <div className="video-badge">
                  <PlayCircleOutlined style={{ fontSize: 32, color: 'white' }} />
                </div>
              )}
              <Badge
                count={`${listing.totalImages}`}
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: 'white' }}
                className="image-count"
              />
            </div>

            {/* Small images grid */}
            <div className="small-images-grid">
              {listing.images.slice(1, 4).map((img, idx) => (
                <div key={idx} className="small-image">
                  <img src={img} alt={`Small ${idx}`} />
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Content Section */}
        <Col xs={24} sm={24} md={10}>
          <div className="listing-content">
            {/* Title */}
            <div className="listing-title">
              <StarFilled style={{ color: '#ffd700', marginRight: 8 }} />
              <span>{listing.title}</span>
            </div>

            {/* Meta info */}
            <div className="listing-meta">
              <span className="price">{formatPrice(listing.price)}/tháng</span>
              <span className="divider">•</span>
              <span className="area">{listing.area} m²</span>
              <span className="divider">•</span>
              <span className="location">
                {listing.district}, {listing.province}
              </span>
            </div>

            {/* Description */}
            <p className="listing-description">{listing.description}</p>

            {/* Footer */}
            <div className="listing-footer">
              <div className="owner-info">
                <Avatar icon={<PhoneOutlined />} />
                <span className="owner-name">{listing.owner}</span>
              </div>
              <div className="actions">
                <Button
                  type="link"
                  icon={
                    savedListings.has(listing.id) ? (
                      <HeartFilled style={{ color: 'red' }} />
                    ) : (
                      <HeartOutlined />
                    )
                  }
                  onClick={() => toggleSavedListing(listing.id)}
                />
                <Button
                  type="primary"
                  shape="round"
                  className="phone-button"
                  icon={<PhoneOutlined />}
                >
                  {listing.phone}
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="home-page">
      {/* Top Navigation Bar */}
      <header className="top-navbar">
        <div className="navbar-container">
          <div className="logo">TTCS</div>

          <Input
            placeholder="Tìm kiếm theo khu vực..."
            prefix={<SearchOutlined />}
            className="search-input"
          />

          <Button type="default" icon={<FilterOutlined />} className="filter-button">
            Bộ lọc
          </Button>

          <div className="navbar-actions">
            <Button type="link">Tin đã lưu</Button>
            <Button type="link" onClick={() => navigate('/register')}>Đăng ký</Button>
            <Button type="link" onClick={() => navigate('/login')}>Đăng nhập</Button>
            <Button
              type="primary"
              className="post-button"
              onClick={() => navigate('/login')}
            >
              Đăng tin
            </Button>
          </div>
        </div>
      </header>

      {/* Menu Categories */}
      <nav className="category-menu">
        <div className="menu-container">
          {menuCategories.map(cat => (
            <a
              key={cat.key}
              href="#"
              className={`menu-item ${cat.key === 'rooms' ? 'active' : ''}`}
            >
              {cat.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        <div className="content-container">
          {/* Left Sidebar - Ad Banner */}
          <aside className="left-sidebar">
            <div className="ad-banner">
            </div>
          </aside>

          {/* Center Content */}
          <main className="center-content">
            {/* Page Title */}
            <section className="page-title">
              <h1>Kênh thông tin Phòng Trọ số 1 Việt Nam</h1>
              <p>Có {listings.length} tin đăng cho thuê</p>
            </section>

            {/* Province Selection */}
            <section className="province-section">
              <div className="section-label">TỈNH THÀNH</div>
              <div className="province-buttons">
                {provinces.map(prov => (
                  <Button
                    key={prov.value}
                    className={`province-btn ${selectedProvince === prov.value ? 'active' : ''}`}
                    onClick={() => setSelectedProvince(prov.value)}
                  >
                    {prov.label}
                  </Button>
                ))}
              </div>
            </section>

            {/* Content Tabs */}
            <div className="content-tabs">
              <div className="tab-list">
                <div
                  className={`tab-item ${activeTab === 'suggest' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggest')}
                >
                  Đề xuất
                </div>
                <div
                  className={`tab-item ${activeTab === 'new' ? 'active' : ''}`}
                  onClick={() => setActiveTab('new')}
                >
                  Mới đăng
                </div>
                <div
                  className={`tab-item ${activeTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveTab('video')}
                >
                  Có video
                </div>
              </div>
            </div>

            {/* Listings */}
            <section className="listings-section">
              {listings.map(listing => renderListingCard(listing))}
            </section>
          </main>

          {/* Right Sidebar */}
          <aside className="right-sidebar">
            {/* Price Filter */}
            <Card className="filter-card">
              <h3 className="filter-title">Xem theo khoảng giá</h3>
              <div className="filter-links">
                {priceRanges.map((range, idx) => (
                  <div key={idx} className="filter-item">
                    <ArrowRightOutlined className="filter-icon" />
                    <a href="#" className="filter-link">
                      {range.label}
                    </a>
                  </div>
                ))}
              </div>
            </Card>

            {/* Area Filter */}
            <Card className="filter-card">
              <h3 className="filter-title">Xem theo diện tích</h3>
              <div className="filter-links">
                {areaRanges.map((range, idx) => (
                  <div key={idx} className="filter-item">
                    <ArrowRightOutlined className="filter-icon" />
                    <a href="#" className="filter-link">
                      {range.label}
                    </a>
                  </div>
                ))}
              </div>
            </Card>

            {/* Ad Banner */}
            <div className="ad-banner-right">
            </div>

            {/* New Listings */}
            <Card className="new-listings-card">
              <h3 className="filter-title">Tin mới đăng</h3>
              {newListings.map((listing, idx) => (
                <div key={idx}>
                  <div className="new-listing-item">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="new-listing-thumb"
                    />
                    <div className="new-listing-info">
                      <a href="#" className="new-listing-title">
                        {listing.title.substring(0, 40)}...
                      </a>
                      <div className="new-listing-meta">
                        <span className="new-price">
                          {formatPrice(listing.price)}
                        </span>
                        <span className="new-time">{listing.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  {idx < newListings.length - 1 && <Divider style={{ margin: '12px 0' }} />}
                </div>
              ))}
            </Card>
          </aside>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="floating-actions">
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          size="large"
          className="float-button chat-button"
          title="Chat với chúng tôi"
        />
        {showBackToTop && (
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            size="large"
            className="float-button back-to-top-button"
            onClick={scrollToTop}
            title="Lên đầu trang"
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;
