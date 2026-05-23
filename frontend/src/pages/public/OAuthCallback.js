import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { App, Spin } from 'antd';
import { authService } from '../../services/authService';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const success = params.get('success') === 'true';
    const userId = params.get('userId');
    const email = params.get('email');
    const role = params.get('role');
    const errorMessage = params.get('message');

    if (!success || !userId || !email || !role) {
      message.error(errorMessage || 'Đăng nhập mạng xã hội thất bại.');
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('access_token', `dummy-token-${userId}`);
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_info', JSON.stringify({
      userId: Number(userId),
      email,
      role: { authority: role.toLowerCase() },
    }));

    message.success('Đăng nhập thành công!');
    const checkRole = authService.getUserRole();
    if (checkRole === 'admin' || checkRole === 'ADMIN') {
      navigate('/admin/dashboard', { replace: true });
    } else if (checkRole === 'tenant' || checkRole === 'TENANT') {
      navigate('/', { replace: true });
    } else {
      navigate('/app/dashboard', { replace: true });
    }
  }, [location.search, message, navigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" tip="Đang đăng nhập..." />
    </div>
  );
};

export default OAuthCallback;

