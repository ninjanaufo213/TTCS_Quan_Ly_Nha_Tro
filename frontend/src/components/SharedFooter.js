import React from 'react';
import { Row, Col, Typography, Divider } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkedinOutlined,
} from '@ant-design/icons';

const { Text, Link } = Typography;

const SharedFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)',
      color: 'white',
      padding: '40px 24px 20px',
      marginTop: '60px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[32, 32]}>
          {/* About */}
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ color: '#e94560', fontWeight: 700, marginBottom: 12 }}>
                Về TTCS
              </h3>
              <Text style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>
                Nền tảng quản lý nhà trọ toàn diện, giúp chủ trọ quản lý phòng trọ hiệu quả và khách thuê tìm kiếm chỗ ở một cách dễ dàng.
              </Text>
            </div>
          </Col>

          {/* Quick Links */}
          <Col xs={24} sm={12} md={6}>
            <h3 style={{ color: '#e94560', fontWeight: 700, marginBottom: 12 }}>
              Liên kết nhanh
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link href="/" style={{ color: '#cbd5e1' }}>Trang chủ</Link>
              <Link href="/login" style={{ color: '#cbd5e1' }}>Đăng nhập</Link>
              <Link href="/register" style={{ color: '#cbd5e1' }}>Đăng ký</Link>
              <Link href="/register?role=landlord" style={{ color: '#cbd5e1' }}>Đăng tin</Link>
            </div>
          </Col>

          {/* Contact */}
          <Col xs={24} sm={12} md={6}>
            <h3 style={{ color: '#e94560', fontWeight: 700, marginBottom: 12 }}>
              Liên hệ
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PhoneOutlined style={{ color: '#f5a623' }} />
                <Text style={{ color: '#cbd5e1' }}>1900 1234</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MailOutlined style={{ color: '#f5a623' }} />
                <Text style={{ color: '#cbd5e1' }}>support@ttcs.vn</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <EnvironmentOutlined style={{ color: '#f5a623', marginTop: 2 }} />
                <Text style={{ color: '#cbd5e1' }}>Hà Nội, Việt Nam</Text>
              </div>
            </div>
          </Col>

          {/* Social */}
          <Col xs={24} sm={12} md={6}>
            <h3 style={{ color: '#e94560', fontWeight: 700, marginBottom: 12 }}>
              Theo dõi
            </h3>
            <div style={{ display: 'flex', gap: 16 }}>
              <FacebookOutlined
                style={{
                  fontSize: 20,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e94560'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
              />
              <InstagramOutlined
                style={{
                  fontSize: 20,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e94560'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
              />
              <LinkedinOutlined
                style={{
                  fontSize: 20,
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#e94560'}
                onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
              />
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: '#334155', margin: '24px 0' }} />

        {/* Copyright */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>
            © {currentYear} TTCS - Trung tâm Quản lý Nhà Trọ. Tất cả quyền được bảo lưu.
          </Text>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#94a3b8', fontSize: 12 }}>Điều khoản dịch vụ</Link>
            <Link href="/" style={{ color: '#94a3b8', fontSize: 12 }}>Chính sách bảo mật</Link>
            <Link href="/" style={{ color: '#94a3b8', fontSize: 12 }}>Liên hệ hỗ trợ</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SharedFooter;

