import React, { useState, useEffect, useRef } from 'react';
import {
  Button, Tag, Skeleton, Empty, Breadcrumb,
  Row, Col, Divider, Image, Modal, Form, DatePicker, TimePicker, message as antdMessage, Rate, List
} from 'antd';
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  HeartOutlined,
  HeartFilled,
  HomeOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  EyeOutlined,
  ExpandOutlined,
  TeamOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  DashboardOutlined,
  WifiOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../../services/authService';
import { viewingService } from '../../services/viewingService';
import { reviewService } from '../../services/reviewService';
import MapView from '../../components/MapView';
import '../../styles/ListingDetail.css';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const ListingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({ average_rating: null, total_reviews: 0, reviews: [] });
  const [requestForm] = Form.useForm();
  const lastFetchedIdRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (lastFetchedIdRef.current === id) {
      return;
    }
    lastFetchedIdRef.current = id;
    const fetchListing = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${BASE_URL}/listings/${id}`);
        setListing(response.data);
      } catch (err) {
        console.error('Lỗi tải chi tiết bài đăng:', err);
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    const roomId = listing?.room?.roomId || listing?.room?.room_id;
    if (!roomId) {
      setReviewSummary({ average_rating: null, total_reviews: 0, reviews: [] });
      return;
    }

    const fetchReviews = async () => {
      try {
        const data = await reviewService.getRoomReviews(roomId);
        setReviewSummary(data || { average_rating: null, total_reviews: 0, reviews: [] });
      } catch (err) {
        console.error('Lỗi tải đánh giá phòng:', err);
        setReviewSummary({ average_rating: null, total_reviews: 0, reviews: [] });
      }
    };
    fetchReviews();
  }, [listing]);

  const formatPrice = (price) => {
    if (!price) return 'Thỏa thuận';
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)} triệu/tháng`;
    return `${Number(price).toLocaleString('vi-VN')} VNĐ/tháng`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const formatReviewDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const handleSendRequest = async (values) => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    const role = authService.getUserRole();
    if (role !== 'tenant' && role !== 'TENANT') {
      antdMessage.warning('Chỉ tài khoản khách thuê mới có thể gửi yêu cầu xem phòng.');
      return;
    }
    setRequestLoading(true);
    try {
      const roomId = listing?.room?.roomId || listing?.room?.room_id;
      if (!roomId) throw new Error('Không xác định được phòng');
      await viewingService.createViewing({
        room_id: roomId,
        visit_date: values.visit_date ? values.visit_date.format('YYYY-MM-DD') : null,
        visit_time: values.visit_time ? values.visit_time.format('HH:mm') : null,
      });
      antdMessage.success('Đã gửi yêu cầu xem phòng thành công! Chủ trọ sẽ xác nhận lịch của bạn.');
      setRequestModalOpen(false);
      requestForm.resetFields();
    } catch (err) {
      console.error("Full Error Object:", err);
      const detail = err?.response?.data?.detail || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      antdMessage.error(detail);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleRequestButtonClick = () => {
    if (!authService.isAuthenticated()) {
      navigate('/login', { state: { from: `/listings/${id}` } });
      return;
    }
    const role = authService.getUserRole();
    if (role !== 'tenant' && role !== 'TENANT') {
      antdMessage.warning('Chỉ tài khoản khách thuê mới có thể gửi yêu cầu xem phòng.');
      return;
    }
    setRequestModalOpen(true);
  };

  const images = listing
    ? (listing.room?.image_urls?.length > 0
      ? listing.room.image_urls
      : listing.room?.imageUrls?.length > 0
        ? listing.room.imageUrls
        : ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'])
    : [];

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-navbar">
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
        <div className="detail-container">
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="detail-page">
        <div className="detail-navbar">
          <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
        <div className="detail-container" style={{ textAlign: 'center', paddingTop: 80 }}>
          <Empty description="Không tìm thấy bài đăng này" />
          <Button type="primary" style={{ marginTop: 24 }} onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const price = listing.room?.price;
  const area = listing.room?.area;
  const district = listing.room?.district || '';
  const ward = listing.room?.ward || '';
  const address = listing.room?.address || '';
  const views = listing.views_count || listing.viewsCount || 0;
  const createdAt = listing.created_at || listing.createdAt;

  // Google Maps URL — dùng tọa độ nếu có, fallback sang tìm kiếm địa chỉ
  const lat = listing.room?.latitude;
  const lng = listing.room?.longitude;
  const hasCoords = lat != null && lng != null;
  const fullAddress = [address, ward, district, 'Việt Nam'].filter(Boolean).join(', ');
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <>
      <div className="detail-page">
        {/* Navbar */}
        <header className="detail-navbar">
          <div className="detail-navbar-inner">
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              className="back-btn"
              onClick={() => navigate(-1)}
            >
              Quay lại trang chủ
            </Button>
            <Breadcrumb
              items={[
                { title: <Link to="/"><HomeOutlined /> Trang chủ</Link> },
                { title: 'Chi tiết bài đăng' },
              ]}
            />
          </div>
        </header>

        <div className="detail-container">
          <Row gutter={[32, 0]}>
            {/* LEFT COLUMN */}
            <Col xs={24} lg={16}>
              {/* Gallery */}
              <div className="gallery-section">
                <div className="main-gallery-image">
                  <Image.PreviewGroup
                    items={images}
                    preview={{
                      current: selectedImage,
                      onChange: (current) => setSelectedImage(current),
                    }}
                  >
                    <Image
                      src={images[selectedImage]}
                      alt="Ảnh phòng trọ"
                      preview={{ mask: <><ExpandOutlined /> Phóng to</> }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Image.PreviewGroup>
                  <div className="image-overlay-badge">
                    📷 {images.length} ảnh
                  </div>
                </div>
                {images.length > 1 && (
                  <div className="thumbnail-strip">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`thumbnail-item ${idx === selectedImage ? 'active' : ''}`}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img src={img} alt={`thumb-${idx}`} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Main Info */}
              <div className="detail-card">
                <div className="detail-header">
                  <Tag color="blue" className="listing-tag">Cho thuê phòng trọ</Tag>
                  <div className="view-count">
                    <EyeOutlined /> {views} lượt xem
                  </div>
                </div>

                <h1 className="detail-title">{listing.room?.name && listing.room?.houseName ? `${listing.room.name} - ${listing.room.houseName}` : listing.title}</h1>

                <div className="detail-location">
                  <EnvironmentOutlined className="location-icon" />
                  <span>{[address, ward, district].filter(Boolean).join(', ') || 'Chưa có địa chỉ'}</span>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <DollarOutlined className="stat-icon price-icon" />
                    <div>
                      <div className="stat-label">Giá thuê</div>
                      <div className="stat-value price-value">{formatPrice(price)}</div>
                    </div>
                  </div>
                  {area && (
                    <div className="stat-item">
                      <ExpandOutlined className="stat-icon" />
                      <div>
                        <div className="stat-label">Diện tích</div>
                        <div className="stat-value">{area} m²</div>
                      </div>
                    </div>
                  )}
                  <div className="stat-item">
                    <CalendarOutlined className="stat-icon" />
                    <div>
                      <div className="stat-label">Ngày đăng</div>
                      <div className="stat-value">{formatDate(createdAt)}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <CheckCircleOutlined className="stat-icon green-icon" />
                    <div>
                      <div className="stat-label">Trạng thái</div>
                      <div className="stat-value green-value">Còn trống</div>
                    </div>
                  </div>
                </div>

                <Divider />

                <div className="description-section">
                  <h2 className="section-heading">Thông tin mô tả</h2>
                  <p className="description-text">{listing.room?.description || listing.description || 'Không có mô tả.'}</p>
                </div>
              </div>

              {/* Chi phí dịch vụ */}
              <div className="detail-card">
                <h2 className="section-heading">Chi phí dịch vụ</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <ThunderboltOutlined className="stat-icon" style={{ color: '#eab308' }} />
                    <div>
                      <div className="stat-label">Giá điện</div>
                      <div className="stat-value">{listing.room?.electricity_price != null ? `${Number(listing.room.electricity_price).toLocaleString()} VNĐ/kWh` : 'Theo giá nhà nước'}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <DashboardOutlined className="stat-icon" style={{ color: '#3b82f6' }} />
                    <div>
                      <div className="stat-label">Giá nước</div>
                      <div className="stat-value">{listing.room?.water_price != null ? `${Number(listing.room.water_price).toLocaleString()} VNĐ/người/tháng` : 'Miễn phí'}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <WifiOutlined className="stat-icon" style={{ color: '#22c55e' }} />
                    <div>
                      <div className="stat-label">Giá wifi</div>
                      <div className="stat-value">{listing.room?.internet_price != null ? `${Number(listing.room.internet_price).toLocaleString()} VNĐ/phòng/tháng` : 'Miễn phí'}</div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <AppstoreOutlined className="stat-icon" style={{ color: '#8b5cf6' }} />
                    <div>
                      <div className="stat-label">Dịch vụ chung</div>
                      <div className="stat-value">{listing.room?.general_price != null ? `${Number(listing.room.general_price).toLocaleString()} VNĐ/người/tháng` : 'Miễn phí'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="detail-card">
                <h2 className="section-heading">Tiện ích phòng trọ</h2>
                <div className="amenities-grid">
                  {listing.room?.amenities && listing.room.amenities.length > 0 ? (
                    listing.room.amenities.map((item) => (
                      <div key={item} className="amenity-item">
                        <CheckCircleOutlined className="amenity-icon" />
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: '#94a3b8' }}>Phòng này chưa cập nhật tiện ích.</span>
                  )}
                </div>
              </div>

              <div className="detail-card">
                <h2 className="section-heading">Đánh giá phòng</h2>
                {(reviewSummary.total_reviews || reviewSummary.totalReviews || 0) > 0 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <Rate disabled allowHalf value={Number(reviewSummary.average_rating ?? reviewSummary.averageRating ?? 0)} />
                      <span style={{ color: '#475569', fontWeight: 600 }}>
                        {Number(reviewSummary.average_rating ?? reviewSummary.averageRating ?? 0).toFixed(1)}
                      </span>
                      <span style={{ color: '#64748b' }}>
                        ({reviewSummary.total_reviews ?? reviewSummary.totalReviews} đánh giá)
                      </span>
                    </div>
                    <List
                      itemLayout="vertical"
                      dataSource={reviewSummary.reviews || []}
                      renderItem={(review) => (
                        <List.Item key={review.review_id || review.reviewId}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                            <strong>{review.tenant_name || review.tenantName || 'Khách thuê'}</strong>
                            <span style={{ color: '#94a3b8' }}>{formatReviewDate(review.created_at || review.createdAt)}</span>
                          </div>
                          <Rate disabled value={review.rating || 0} style={{ fontSize: 16, marginTop: 4 }} />
                          {review.comment && (
                            <p style={{ margin: '8px 0 0', color: '#475569' }}>{review.comment}</p>
                          )}
                          {(review.landlord_reply || review.landlordReply) && (
                            <div style={{
                              marginTop: 10,
                              padding: '10px 12px',
                              background: '#f8fafc',
                              borderLeft: '3px solid #2563eb',
                              borderRadius: 8,
                              color: '#334155'
                            }}>
                              <strong>Phản hồi chủ trọ: </strong>
                              <span>{review.landlord_reply || review.landlordReply}</span>
                            </div>
                          )}
                        </List.Item>
                      )}
                    />
                  </>
                ) : (
                  <Empty description="Chưa có đánh giá cho phòng này" />
                )}
              </div>
            </Col>

            {/* RIGHT COLUMN — Sticky contact card */}
            <Col xs={24} lg={8}>
              <div className="contact-sticky-wrapper">
                <div className="contact-card">
                  <div className="price-highlight">
                    <span className="price-big">{formatPrice(price)}</span>
                    {area && <span className="price-area"> · {area} m²</span>}
                  </div>

                  <Divider style={{ margin: '16px 0' }} />

                  <div className="contact-info">
                    <div className="contact-row">
                      <TeamOutlined className="contact-icon" />
                      <div>
                        <div className="contact-label">Liên hệ chủ phòng</div>
                        <div className="contact-value">Nhà trọ TTCS</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="primary"
                    size="large"
                    block
                    className="call-button"
                    icon={<PhoneOutlined />}
                    onClick={() => setShowPhone(!showPhone)}
                  >
                    {showPhone ? '0901 234 567' : 'Hiện số điện thoại'}
                  </Button>

                  <Button
                    size="large"
                    block
                    className="save-button"
                    icon={saved ? <HeartFilled style={{ color: '#ef4444' }} /> : <HeartOutlined />}
                    onClick={() => setSaved(!saved)}
                    style={{ marginTop: 12 }}
                  >
                    {saved ? 'Đã lưu bài đăng' : 'Lưu bài đăng'}
                  </Button>

                  <Button
                    size="large"
                    block
                    className="request-view-button"
                    icon={<CalendarOutlined />}
                    onClick={handleRequestButtonClick}
                    style={{ marginTop: 12 }}
                  >
                    Yêu cầu xem phòng
                  </Button>

                  <div className="contact-note">
                    <CheckCircleOutlined style={{ color: '#22c55e' }} />
                    <span>Tin đăng đã được kiểm duyệt</span>
                  </div>
                </div>

                {/* Vị trí */}
                <div className="map-card">
                  <h3 className="map-title">
                    <EnvironmentOutlined />Vị trí
                    {/* {hasCoords && (
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="map-open-hint"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Mở Google Maps ↗
                      </a>
                    )} */}
                  </h3>

                  {hasCoords ? (
                    <MapView
                      lat={lat}
                      lng={lng}
                      label={[address, ward, district].filter(Boolean).join(', ')}
                      googleMapsUrl={googleMapsUrl}
                      height={200}
                    />
                  ) : (
                    <div className="map-placeholder">
                      <EnvironmentOutlined style={{ fontSize: 36, color: '#94a3b8' }} />
                      <p>{[ward, district].filter(Boolean).join(', ') || 'Chưa xác định'}</p>
                    </div>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Modal yêu cầu xem phòng */}
      <Modal
        title={<><CalendarOutlined style={{ color: '#2563eb', marginRight: 8 }} />Yêu cầu xem phòng</>}
        open={requestModalOpen}
        onCancel={() => { setRequestModalOpen(false); requestForm.resetFields(); }}
        footer={null}
        width={440}
      >
        <p style={{ color: '#64748b', marginBottom: 20 }}>
          Chọn ngày và giờ bạn muốn đến xem phòng. Chủ trọ sẽ xác nhận lịch và liên hệ với bạn qua SĐT đã đăng ký.
        </p>
        <Form form={requestForm} layout="vertical" onFinish={handleSendRequest}>
          <Form.Item
            name="visit_date"
            label="Ngày muốn xem phòng"
            rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
              disabledDate={(d) => d && d.valueOf() < Date.now() - 86400000}
            />
          </Form.Item>
          <Form.Item
            name="visit_time"
            label="Giờ muốn xem phòng"
            rules={[{ required: true, message: 'Vui lòng chọn giờ!' }]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              placeholder="Chọn giờ"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => { setRequestModalOpen(false); requestForm.resetFields(); }} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={requestLoading}>
              Gửi yêu cầu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ListingDetail;
