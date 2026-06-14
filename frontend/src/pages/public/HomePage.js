import React, { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Badge,
  Empty,
  Select,
  Drawer,
  Slider,
  Modal,
  message
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  HeartOutlined,
  HeartFilled,
  StarFilled,
  MessageOutlined,
  ArrowUpOutlined,
  EnvironmentOutlined,
  CheckCircleFilled,
  CloseCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { listingService } from '../../services/listingService';
import SharedHeader from '../../components/SharedHeader';
import SharedFooter from '../../components/SharedFooter';
import LocationSelector from '../../components/LocationSelector';
import MapPicker from '../../components/MapPicker';
import HomePageMapModal from '../../components/HomePageMapModal';
import '../../styles/HomePage.css';

const AMENITIES_OPTIONS = [
  'Điều hòa',
  'Nóng lạnh',
  'Máy giặt',
  'Tủ lạnh',
  'Giường',
  'Tủ quần áo',
  'Ban công',
  'Bếp riêng',
  'Giờ giấc tự do',
  'Vệ sinh riêng',
  'Chỗ để xe',
  'Wifi miễn phí',
  'An ninh 24/7'
];

const HomePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('new');
  const [savedListings, setSavedListings] = useState(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Search States
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('search') || '');
  const [addressData, setAddressData] = useState({});
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedAreaRange, setSelectedAreaRange] = useState(null);
  const [mapLocation, setMapLocation] = useState(null);
  const [searchRadius, setSearchRadius] = useState(2); // 2 km default
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  // Listings data
  const [filteredListings, setFilteredListings] = useState([]);

  // Recommendations data
  const [recommendedListings, setRecommendedListings] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Compare State
  const [compareListings, setCompareListings] = useState([]);
  const [isCompareModalVisible, setIsCompareModalVisible] = useState(false);

  // Map View State
  const [isMapModalVisible, setIsMapModalVisible] = useState(false);

  const toggleCompare = (listing) => {
    setCompareListings(prev => {
      const isExist = prev.find(item => item.id === listing.id);
      if (isExist) {
        return prev.filter(item => item.id !== listing.id);
      }
      if (prev.length >= 2) {
        message.warning('Chỉ được so sánh tối đa 2 phòng cùng lúc!');
        return prev;
      }
      return [...prev, listing];
    });
  };

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


  useEffect(() => {
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
            description: room.description || l.description || '',
            images,
            totalImages: images.length,
            distance: l.distance,
            averageRating: l.average_rating ?? l.averageRating ?? null,
            totalReviews: l.total_reviews ?? l.totalReviews ?? 0,
            electricityPrice: room.electricityPrice || room.electricity_price,
            waterPrice: room.waterPrice || room.water_price,
            amenities: room.amenities || [],
            latitude: room.latitude,
            longitude: room.longitude,
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
        latitude: mapLocation ? mapLocation.lat : undefined,
        longitude: mapLocation ? mapLocation.lng : undefined,
        radius: mapLocation ? searchRadius : undefined,
        amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
        sortBy: sortBy !== 'newest' ? sortBy : undefined,
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
            description: room.description || l.description || '',
            images,
            totalImages: images.length,
            averageRating: l.average_rating ?? l.averageRating ?? null,
            totalReviews: l.total_reviews ?? l.totalReviews ?? 0,
            electricityPrice: room.electricityPrice || room.electricity_price,
            waterPrice: room.waterPrice || room.water_price,
            amenities: room.amenities || [],
            latitude: room.latitude,
            longitude: room.longitude,
            createdAt: l.created_at || l.createdAt
              ? new Date(l.created_at || l.createdAt).toLocaleDateString('vi-VN')
              : '',
          };
        });
        setFilteredListings(mapped);
      } catch (err) {
        console.error('Lỗi tải bài đăng:', err);
        setFilteredListings([]);
      }
    };

    const timeoutId = setTimeout(fetchSearchResults, 350);
    return () => clearTimeout(timeoutId);
  }, [searchKeyword, addressData, selectedPriceRange, selectedAreaRange, mapLocation, searchRadius, selectedAmenities, sortBy]);

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
      className="listing-card-grid animate-fade-in-up"
      style={{ '--i': index % 8, cursor: 'pointer', padding: 0, overflow: 'hidden' }}
      onClick={() => navigate(`/listings/${listing.id}`)}
      bodyStyle={{ padding: 0 }}
    >
      <div className="grid-image-container">
        <img src={listing.images[0]} alt={listing.title} className="grid-main-image" />
        <Badge count={`${listing.totalImages}`} className="grid-image-count" />
        <div className="grid-actions-top">
          <Button
            type="text"
            shape="circle"
            className={`grid-heart-btn ${savedListings.has(listing.id) ? 'is-active' : ''}`}
            icon={
              savedListings.has(listing.id) ? (
                <HeartFilled style={{ color: '#ef4444', fontSize: '20px' }} />
              ) : (
                <HeartOutlined style={{ fontSize: '20px', color: 'white' }} />
              )
            }
            onClick={(e) => {
              e.stopPropagation();
              toggleSavedListing(listing.id);
            }}
          />
        </div>
        {listing.distance !== undefined && listing.distance !== null && (
          <div className="grid-distance-badge">
            Cách {listing.distance.toFixed(1)} km
          </div>
        )}
      </div>

      <div className="grid-content">
        <div className="grid-price-row">
          <span className="grid-price">{formatPrice(listing.price)}<span className="grid-price-unit">/tháng</span></span>
          <span className="grid-area">{listing.area || '-'} m²</span>
        </div>

        <div className="grid-title" title={listing.title}>
          {listing.title}
        </div>

        <div className="grid-address">
          <EnvironmentOutlined style={{ marginRight: '6px', color: '#94a3b8' }} />
          <span className="address-text">{listing.addressLine || 'Chưa có địa chỉ'}</span>
        </div>

        <div className="grid-footer">
          {(listing.totalReviews || 0) > 0 ? (
            <div className="grid-rating">
              <StarFilled style={{ color: '#f59e0b', fontSize: '14px' }} />
              <span className="rating-score">{Number(listing.averageRating || 0).toFixed(1)}</span>
              <span className="rating-count">({listing.totalReviews})</span>
            </div>
          ) : (
            <span className="grid-no-rating">Mới</span>
          )}

          <Button
            type="default"
            size="small"
            shape="round"
            className={`grid-compare-btn ${compareListings.find(c => c.id === listing.id) ? 'active' : ''}`}
            icon={compareListings.find(c => c.id === listing.id) ? <CheckCircleFilled style={{ color: '#10b981' }} /> : <PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(listing);
            }}
          >
            So sánh
          </Button>
        </div>
      </div>
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


      {/* Premium Hero Banner Section */}
      <section className="hero-banner-section animate-fade-in">
        <div className="hero-content">
          <h1 className="hero-banner-title">
            Tìm Nơi An Cư Lý Tưởng Của Bạn
          </h1>
          <p className="hero-banner-subtitle">
            Hàng ngàn phòng trọ, căn hộ, nhà nguyên căn cao cấp đang chờ bạn khám phá.
          </p>
          <div className="hero-search-wrapper glassmorphism">
            <div className="search-input-group">
              <SearchOutlined className="search-icon" />
              <input
                className="search-input-transparent"
                placeholder="Nhập tên nhà trọ, tên đường, hoặc khu vực..."
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </div>
            <div className="search-divider"></div>
            <Button
              type="primary"
              shape="round"
              size="large"
              className="hero-search-btn"
              onClick={() => {
                document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Tìm kiếm
            </Button>
            <Button
              type="default"
              shape="circle"
              size="large"
              className="hero-filter-btn"
              onClick={() => setShowFilters(true)}
              icon={<FilterOutlined />}
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="section-container">
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon"><CheckCircleFilled /></div>
              <h3>Thông tin xác thực</h3>
              <p>100% phòng trọ được kiểm duyệt thông tin minh bạch.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><StarFilled /></div>
              <h3>Chủ trọ uy tín</h3>
              <p>Đánh giá khách quan từ cộng đồng người thuê trước đó.</p>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon"><EnvironmentOutlined /></div>
              <h3>Tìm kiếm thông minh</h3>
              <p>Đề xuất chính xác theo nhu cầu và vị trí của bạn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Locations Section */}
      <section className="popular-locations-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Khám phá khu vực nổi bật</h2>
            <p className="section-subtitle">Những địa điểm được tìm kiếm nhiều nhất</p>
          </div>
          <div className="locations-grid">
            <div className="location-card location-large" onClick={() => { setSearchKeyword('Hà Nội'); document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <img src="https://dntt.mediacdn.vn/197608888129458176/2022/9/21/ho-guom-du-lich-ha-noi-ivivu-16637590508811726461079.jpg" alt="Hà Nội" />
              <div className="location-overlay">
                <h3>Hà Nội</h3>
                <p>Khám phá phòng trọ Thủ Đô</p>
              </div>
            </div>
            <div className="location-card location-small" onClick={() => { setSearchKeyword('Hồ Chí Minh'); document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <img src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=800&auto=format&fit=crop" alt="TP.HCM" />
              <div className="location-overlay">
                <h3>TP. Hồ Chí Minh</h3>
                <p>Trung tâm kinh tế sầm uất</p>
              </div>
            </div>
            <div className="location-card location-small" onClick={() => { setSearchKeyword('Đà Nẵng'); document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <img src="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800&auto=format&fit=crop" alt="Đà Nẵng" />
              <div className="location-overlay">
                <h3>Đà Nẵng</h3>
                <p>Thành phố đáng sống</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="search-results" className="main-content" style={{ marginTop: '0', paddingTop: '64px' }}>
        <div className="section-container content-container">
          <main className="center-content">
            <section className="page-title animate-fade-in-up">
              <h1>Tin đăng nổi bật</h1>
              <p>Có {filteredListings.length} tin đăng phù hợp với tìm kiếm của bạn</p>
            </section>

            <div className="content-tabs animate-fade-in-up" style={{ animationDelay: '200ms', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 16 }}>
                <Button
                  type="primary"
                  icon={<EnvironmentOutlined />}
                  onClick={() => setIsMapModalVisible(true)}
                  style={{ borderRadius: '8px', fontWeight: 600 }}
                >
                  Xem Bản đồ
                </Button>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 180 }}
                  options={[
                    { value: 'newest', label: 'Mới đăng gần đây' },
                    { value: 'priceAsc', label: 'Giá: Thấp đến cao' },
                    { value: 'priceDesc', label: 'Giá: Cao đến thấp' },
                    { value: 'distance', label: 'Gần vị trí của tôi', disabled: !mapLocation }
                  ]}
                />
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


        </div>
      </div>

      <div className="floating-actions">
        <Button
          type="primary"
          shape="circle"
          icon={<MessageOutlined />}
          size="large"
          className="float-button chat-button"
          style={{ '--i': 0 }}
          title="Chat với chúng tôi"
        />
        {showBackToTop && (
          <Button
            type="primary"
            shape="circle"
            icon={<ArrowUpOutlined />}
            size="large"
            className="float-button back-to-top-button"
            style={{ '--i': 1 }}
            onClick={scrollToTop}
            title="Lên đầu trang"
          />
        )}
      </div>

      <SharedFooter />

      {/* Map View Modal */}
      <HomePageMapModal
        visible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        filteredListings={filteredListings}
        formatPrice={formatPrice}
      />

      {/* Compare Floating Bar */}
      <div className={`compare-floating-bar ${compareListings.length > 0 ? 'visible' : ''}`}>
        <div className="compare-items">
          {compareListings.map(listing => (
            <div key={listing.id} className="compare-item">
              <img src={listing.images[0]} alt={listing.title} />
              <div className="compare-item-info">
                <div className="compare-item-title">{listing.title}</div>
                <div className="compare-item-price">{formatPrice(listing.price)}</div>
              </div>
              <Button
                shape="circle"
                size="small"
                icon={<CloseCircleOutlined />}
                className="remove-compare-btn"
                onClick={() => toggleCompare(listing)}
              />
            </div>
          ))}
        </div>
        <div className="compare-actions">
          <Button danger onClick={() => setCompareListings([])}>Xóa tất cả</Button>
          <Button type="primary" disabled={compareListings.length < 2} onClick={() => setIsCompareModalVisible(true)}>So sánh ngay</Button>
        </div>
      </div>

      {/* Compare Modal */}
      <Modal
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>So sánh phòng</span>}
        open={isCompareModalVisible}
        onCancel={() => setIsCompareModalVisible(false)}
        footer={null}
        width={900}
      >
        {compareListings.length === 2 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="compare-table">
              <tbody>
                <tr>
                  <th>Hình ảnh</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      <img src={listing.images[0]} alt={listing.title} className="compare-table-img" />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Tên phòng</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{listing.title}</div>
                      <div><EnvironmentOutlined /> {listing.addressLine}</div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Giá thuê</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                        {formatPrice(listing.price)}/tháng
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Diện tích</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>{listing.area ? `${listing.area} m²` : 'Không xác định'}</td>
                  ))}
                </tr>
                <tr>
                  <th>Tiền điện</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>{listing.electricityPrice != null ? `${Number(listing.electricityPrice).toLocaleString()} VNĐ/kWh` : 'Theo giá nhà nước'}</td>
                  ))}
                </tr>
                <tr>
                  <th>Tiền nước</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>{listing.waterPrice != null ? `${Number(listing.waterPrice).toLocaleString()} VNĐ/người` : 'Miễn phí'}</td>
                  ))}
                </tr>
                <tr>
                  <th>Tiện ích</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      {listing.amenities && listing.amenities.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {listing.amenities.map((am, idx) => (
                            <Badge key={idx} count={am} style={{ backgroundColor: '#f0f9ff', color: '#0369a1', borderColor: '#bae6fd' }} />
                          ))}
                        </div>
                      ) : 'Chưa cập nhật'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th>Đánh giá</th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      {listing.totalReviews > 0 ? (
                        <div>
                          <StarFilled style={{ color: '#f59e0b', marginRight: 4 }} />
                          <span style={{ fontWeight: 600 }}>{Number(listing.averageRating).toFixed(1)}</span>
                          <span style={{ color: '#64748b', marginLeft: 4 }}>({listing.totalReviews} đánh giá)</span>
                        </div>
                      ) : 'Chưa có đánh giá'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th></th>
                  {compareListings.map(listing => (
                    <td key={listing.id}>
                      <Button type="primary" style={{ width: '100%' }} onClick={() => { setIsCompareModalVisible(false); navigate(`/listings/${listing.id}`); }}>
                        Xem chi tiết
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>

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
                setMapLocation(null);
                setSearchRadius(2);
                setSelectedAmenities([]);
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

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500 }}>Tiện ích</div>
            <Select
              mode="multiple"
              size="large"
              style={{ width: '100%' }}
              placeholder="Chọn tiện ích"
              value={selectedAmenities}
              onChange={v => setSelectedAmenities(v)}
              options={AMENITIES_OPTIONS.map(a => ({ label: a, value: a }))}
              allowClear
            />
          </div>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <EnvironmentOutlined style={{ color: '#1890ff' }} /> Tìm quanh vị trí
            </div>
            <MapPicker
              initialPosition={mapLocation || undefined}
              onChange={(pos) => setMapLocation(pos)}
            />
            {mapLocation && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Bán kính tìm kiếm:</span>
                  <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{searchRadius} km</span>
                </div>
                <Slider
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={searchRadius}
                  onChange={(val) => setSearchRadius(val)}
                />
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default HomePage;
