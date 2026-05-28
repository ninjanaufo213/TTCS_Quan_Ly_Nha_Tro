import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Avatar,
  Row,
  Col,
  Divider,
  Badge,
  Empty,
  Select,
  Drawer
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
  ArrowUpOutlined,
  EnvironmentOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { listingService } from '../../services/listingService';
import SharedHeader from '../../components/SharedHeader';
import SharedFooter from '../../components/SharedFooter';
import LocationSelector from '../../components/LocationSelector';
import '../../styles/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('new');
  const [savedListings, setSavedListings] = useState(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [addressData, setAddressData] = useState({});
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedAreaRange, setSelectedAreaRange] = useState(null);

  // Listings data
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);

  // Recommendations data
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const priceRanges = [
    { label: 'Tất cả mức giá', value: null },
    { label: 'Dưới 1 triệu', value: '0-1000000' },
    { label: 'Từ 1 - 2 triệu', value: '1000000-2000000' },
    { label: 'Từ 2 - 3 triệu', value: '2000000-3000000' },
    { label: 'Từ 3 - 5 triệu', value: '3000000-5000000' },
    { label: 'Từ 5 - 7 triệu', value: '5000000-7000000' },
    { label: 'Từ 7 - 10 triệu', value: '7000000-10000000' },
    { label: 'Từ 10 - 15 triệu', value: '10000000-15000000' },
    { label: 'Trên 15 triệu', value: '15000000-999999999' }
  ];

  const areaRanges = [
    { label: 'Tất cả diện tích', value: null },
    { label: 'Dưới 20 m²', value: '0-20' },
    { label: 'Từ 20 - 30 m²', value: '20-30' },
    { label: 'Từ 30 - 50 m²', value: '30-50' },
    { label: 'Từ 50 - 70 m²', value: '50-70' },
    { label: 'Từ 70 - 90 m²', value: '70-90' },
    { label: 'Trên 90 m²', value: '90-9999' }
  ];

  const newListings = filteredListings.slice(0, 3);

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
    setIsLoaded(true);

    const fetchRecommendations = async (lat, lng) => {
      setLoadingRecommendations(true);
      try {
        const data = await listingService.getRecommendedListings({
          latitude: lat,
          longitude: lng,
          radius: 1000.0,
          limit: 10
        });
        const mapped = data.map(l => {
          const room = l.room || {};
          const roomName = room.name || '';
          const houseName = room.houseName || '';
          const title = roomName && houseName ? `${roomName} - ${houseName}` : (l.title || roomName || '');
          const addressLine = [room.address, room.ward, room.district].filter(Boolean).join(', ');
          const images = (room.image_urls && room.image_urls.length > 0) ? room.image_urls : (
            (room.imageUrls && room.imageUrls.length > 0) ? room.imageUrls : [
              'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'
            ]
          );

          return {
            id: l.listing_id || l.listingId,
            title,
            roomName,
            houseName,
            addressLine,
            price: room.price || 0,
            area: room.area ?? null,
            description: l.description || room.description || '',
            images,
            totalImages: images.length,
            distance: l.distance,
            createdAt: l.created_at || l.createdAt
              ? new Date(l.created_at || l.createdAt).toLocaleDateString('vi-VN')
              : '',
          };
        });
        setRecommendedListings(mapped);
      } catch (err) {
        console.error('Lỗi tải gợi ý:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchRecommendations(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log("Location access denied or error, using fallback.");
          fetchRecommendations(null, null); // Backend handles fallback
        }
      );
    } else {
      console.log("Geolocation not supported, using fallback.");
      fetchRecommendations(null, null);
    }
  }, []);

  useEffect(() => {
    const fetchSearchResults = async () => {
      const keyword = searchKeyword.trim();

      let minPrice, maxPrice, minArea, maxArea;

      if (selectedPriceRange) {
        const [min, max] = selectedPriceRange.split('-');
        minPrice = Number(min);
        maxPrice = Number(max);
      }

      if (selectedAreaRange) {
        const [min, max] = selectedAreaRange.split('-');
        minArea = Number(min);
        maxArea = Number(max);
      }

      const params = {
        keyword: keyword || undefined,
        district: addressData.districtName || undefined,
        ward: addressData.wardName || undefined,
        minPrice,
        maxPrice,
        minArea,
        maxArea,
      };

      try {
        const data = await listingService.searchPublicListings(params);
        const mapped = data.map(l => {
          const room = l.room || {};
          const roomName = room.name || '';
          const houseName = room.houseName || '';
          const title = roomName && houseName ? `${roomName} - ${houseName}` : (l.title || roomName || '');
          const addressLine = [room.address, room.ward, room.district].filter(Boolean).join(', ');
          const images = (room.image_urls && room.image_urls.length > 0) ? room.image_urls : (
            (room.imageUrls && room.imageUrls.length > 0) ? room.imageUrls : [
              'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400'
            ]
          );

          return {
            id: l.listing_id || l.listingId,
            title,
            roomName,
            houseName,
            addressLine,
            price: room.price || 0,
            area: room.area ?? null,
            description: l.description || room.description || '',
            images,
            totalImages: images.length,
            createdAt: l.created_at || l.createdAt
              ? new Date(l.created_at || l.createdAt).toLocaleDateString('vi-VN')
              : '',
          };
        });
        setListings(mapped);
        setFilteredListings(mapped);
      } catch (err) {
        console.error('Lỗi tải bài đăng:', err);
        setListings([]);
        setFilteredListings([]);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 350);
    return () => clearTimeout(timeoutId);
  }, [searchKeyword, addressData, selectedPriceRange, selectedAreaRange]);

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

  const renderListingCard = (listing, index) => (
    <Card
      key={listing.id}
      className="listing-card animate-fade-in-up"
      style={{ animationDelay: `${(index % 8) * 100}ms`, cursor: 'pointer' }}
      onClick={() => navigate(`/listings/${listing.id}`)}
    >
      <Row gutter={24}>
        <Col xs={24} sm={24} md={10}>
          <div className="images-container">
            <div className="main-image">
              <img src={listing.images[0]} alt="Main" />
              <Badge
                count={`${listing.totalImages}`}
                className="image-count"
              />
            </div>
          </div>
        </Col>

        <Col xs={24} sm={24} md={14}>
          <div className="listing-content">
            <div className="listing-title">
              <span>{listing.title}</span>
            </div>

            <div className="listing-address">
              <EnvironmentOutlined style={{ marginRight: '6px' }} />
              {listing.addressLine || 'Chưa có địa chỉ'}
            </div>

            <div className="listing-meta">
              <span className="price">{formatPrice(listing.price)}/tháng</span>
              <span className="divider">•</span>
              <span className="area">{listing.area || '-'} m²</span>
              {listing.distance !== undefined && listing.distance !== null && (
                <>
                  <span className="divider">•</span>
                  <span className="distance" style={{ color: '#10b981', fontWeight: 500 }}>
                    Cách bạn {listing.distance.toFixed(1)} km
                  </span>
                </>
              )}
            </div>

            <p className="listing-description">{listing.description || 'Chưa có mô tả.'}</p>

            <div className="listing-footer">
              <div className="actions">
                <Button
                  type="link"
                  icon={
                    savedListings.has(listing.id) ? (
                      <HeartFilled style={{ color: '#ef4444', fontSize: '20px' }} />
                    ) : (
                      <HeartOutlined style={{ fontSize: '20px' }} />
                    )
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSavedListing(listing.id);
                  }}
                />
                <Button
                  type="primary"
                  shape="round"
                  className="phone-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/listings/${listing.id}`);
                  }}
                >
                  Xem chi tiết
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
      <SharedHeader
        showSearch={false}
        showDashboardButton
        showNotifications
        rightExtra={
          <>
            <Button
              type="default"
              icon={<FilterOutlined />}
              onClick={() => setShowFilters(true)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
              }}
            >
              Bộ lọc
            </Button>
          </>
        }
      />

      <nav className={`category-menu animate-fade-in`}>
        <div className="menu-container">
          {menuCategories.map(cat => (
            <a
              key={cat.key}
              href="#"
              className={`menu-item ${cat.key === 'rooms' ? 'active' : ''}`}
              onClick={(e) => e.preventDefault()}
            >
              {cat.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Premium Hero Banner Section */}
      <section
        className="hero-banner-section animate-fade-in"
        style={{
          background: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=2069&auto=format&fit=crop") center/cover no-repeat',
          padding: '80px 24px',
          textAlign: 'center',
          color: 'white'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: '36px', fontWeight: 700, marginBottom: '16px' }}>
            Không Gian Sống Lý Tưởng
          </h1>
          <p style={{ color: '#f0f0f0', fontSize: '18px', marginBottom: '40px' }}>
            Hàng ngàn phòng trọ, căn hộ, nhà nguyên căn cao cấp đang chờ bạn khám phá.
          </p>
          <div style={{
            background: 'white',
            padding: '8px',
            borderRadius: '32px',
            display: 'flex',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <Input
              size="large"
              bordered={false}
              prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: '20px', marginRight: '8px' }} />}
              placeholder="Nhập tên nhà trọ, tên đường, hoặc khu vực bạn muốn tìm..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              allowClear
              style={{ flex: 1, fontSize: '16px' }}
            />
            <Button
              type="primary"
              shape="round"
              size="large"
              style={{ padding: '0 32px' }}
              onClick={() => setShowFilters(true)}
              icon={<FilterOutlined />}
            >
              Lọc chi tiết
            </Button>
          </div>
        </div>
      </section>

      <div className="main-content" style={{ marginTop: '32px' }}>
        <div className="content-container">
          <main className="center-content">
            <section className="page-title animate-fade-in-up">
              <h1>Tin đăng nổi bật</h1>
              <p>Có {filteredListings.length} tin đăng phù hợp với tìm kiếm của bạn</p>
            </section>

            <div className="content-tabs animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="tab-list">
                <div
                  className={`tab-item ${activeTab === 'new' ? 'active' : ''}`}
                  onClick={() => setActiveTab('new')}
                >
                  Mới đăng gần đây
                </div>
                <div
                  className={`tab-item ${activeTab === 'suggest' ? 'active' : ''}`}
                  onClick={() => setActiveTab('suggest')}
                >
                  Đề xuất theo vị trí
                </div>
                <div
                  className={`tab-item ${activeTab === 'video' ? 'active' : ''}`}
                  onClick={() => setActiveTab('video')}
                >
                  Có video xem trước
                </div>
              </div>
            </div>

            <section className="listings-section">
              {activeTab === 'suggest' ? (
                loadingRecommendations ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>Đang tìm các phòng gần bạn nhất...</div>
                ) : recommendedListings.length > 0 ? (
                  recommendedListings.map((listing, index) => renderListingCard(listing, index))
                ) : (
                  <Empty description="Không có tin đăng nào phù hợp" />
                )
              ) : filteredListings.length > 0 ? (
                filteredListings.map((listing, index) => renderListingCard(listing, index))
              ) : (
                <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <Empty description="Không có tin đăng nào phù hợp với bộ lọc" />
                </div>
              )}
            </section>
          </main>

          <aside className="right-sidebar animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {newListings.length > 0 && (
              <Card className="new-listings-card" style={{ borderRadius: '12px' }}>
                <h3 className="filter-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Tin mới đăng</h3>
                {newListings.map((listing, idx) => (
                  <div key={idx}>
                    <div className="new-listing-item" style={{ cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => navigate(`/listings/${listing.id}`)}>
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="new-listing-thumb"
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <div className="new-listing-info" style={{ flex: 1 }}>
                        <div className="new-listing-title" style={{ fontWeight: 500, fontSize: '14px', marginBottom: '4px', lineHeight: '1.4' }}>
                          {listing.title.length > 40 ? `${listing.title.substring(0, 40)}...` : listing.title}
                        </div>
                        <div className="new-listing-meta">
                          <span className="new-price" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                            {formatPrice(listing.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {idx < newListings.length - 1 && <Divider style={{ margin: '16px 0', borderColor: '#e2e8f0' }} />}
                  </div>
                ))}
              </Card>
            )}
          </aside>
        </div>
      </div>

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

      <SharedFooter />

      {/* Advanced Filter Drawer */}
      <Drawer
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Bộ lọc nâng cao</span>}
        placement="right"
        onClose={() => setShowFilters(false)}
        open={showFilters}
        width={380}
        footer={
          <div style={{ padding: '12px 0', display: 'flex', gap: '12px' }}>
            <Button
              size="large"
              style={{ flex: 1, borderRadius: '8px' }}
              onClick={() => {
                setSearchKeyword('');
                setAddressData({});
                setSelectedPriceRange(null);
                setSelectedAreaRange(null);
              }}
            >
              Xóa bộ lọc
            </Button>
            <Button
              type="primary"
              size="large"
              style={{ flex: 2, borderRadius: '8px', fontWeight: 600 }}
              onClick={() => setShowFilters(false)}
            >
              Hiển thị {filteredListings.length} kết quả
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#1890ff' }} /> Khu vực
            </div>
            <LocationSelector
              selectedAddress={addressData}
              onChange={(data) => setAddressData(data)}
            />
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>Khoảng giá</div>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Chọn mức giá"
              value={selectedPriceRange}
              options={priceRanges}
              onChange={v => setSelectedPriceRange(v)}
              allowClear
            />
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>Diện tích</div>
            <Select
              size="large"
              style={{ width: '100%' }}
              placeholder="Chọn diện tích"
              value={selectedAreaRange}
              options={areaRanges}
              onChange={v => setSelectedAreaRange(v)}
              allowClear
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default HomePage;
