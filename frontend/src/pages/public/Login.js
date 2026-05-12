import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined, SearchOutlined, HomeOutlined, SafetyOutlined, GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import SharedHeader from '../../components/SharedHeader';
import SharedFooter from '../../components/SharedFooter';
import '../../styles/AuthPage.css';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp(); // Dùng message từ App context để hiển thị thông báo

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.email, values.password);
      message.success('Đăng nhập thành công!');
      const checkRole = authService.getUserRole();
      if (checkRole === 'admin' || checkRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (checkRole === 'tenant' || checkRole === 'TENANT') {
        navigate('/');
      } else {
        navigate('/app/dashboard');
      }
    } catch (error) {
      message.error('Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <SharedHeader showSearch={false} showDashboardButton={false} showNotifications={false} />

      <main className="auth-hero">
        <div className="auth-hero__inner">
          <section className="auth-brand">
            <div className="auth-brand__header">
              <div className="auth-brand__logo">TT</div>
              <h1 className="auth-brand__title">Không Gian Sống Lý Tưởng</h1>
            </div>
            <p className="auth-brand__subtitle">
              Hàng ngàn phòng trọ, căn hộ, nhà nguyên căn cao cấp đang chờ bạn khám phá.
            </p>
            <div className="auth-brand__highlights">
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><SearchOutlined /></span>
                <span>Tìm kiếm và thuê phòng nhanh chóng</span>
              </div>
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><HomeOutlined /></span>
                <span>Quản lý nhà trọ và đăng bài cho thuê</span>
              </div>
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><SafetyOutlined /></span>
                <span>Tin đăng xác thực, an toàn</span>
              </div>
            </div>
          </section>

          <Card className="auth-card" bordered={false}>
            <div className="auth-card__title">
              <Title level={3} style={{ margin: 0 }}>Đăng nhập</Title>
              <span>Chào mừng bạn quay lại</span>
            </div>

            <Form name="login" onFinish={onFinish} autoComplete="off" size="large" layout="vertical">
              <Form.Item
                label={<span className="auth-label">Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Email"
                  className="auth-input"
                />
              </Form.Item>

              <Form.Item
                label={<span className="auth-label">Mật khẩu</span>}
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                  className="auth-input"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="auth-submit"
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <div className="auth-divider">
              <span>Hoặc</span>
            </div>

            <div className="auth-social">
              <Button
                className="auth-social__btn"
                icon={<GoogleOutlined />}
                onClick={() => authService.loginWithProvider('google')}
              >
                Đăng nhập với Google
              </Button>
            </div>

            <div className="auth-card__footer">
              <Button type="link" onClick={() => navigate('/register')}>
                Chưa có tài khoản? Đăng ký
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
};

export default Login;
