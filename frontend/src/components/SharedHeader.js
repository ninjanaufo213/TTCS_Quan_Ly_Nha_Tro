import React, { useState, useEffect } from 'react';
import { Button, Dropdown, Avatar, Input } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  DashboardOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import NotificationPopover from './NotificationPopover';

const SharedHeader = ({
  showSearch = true,
  showDashboardButton = true,
  onMenuToggle = null,
  menuCollapsed = false,
  showProfileItem = true,
  showNotifications = false,
  rightExtra = null,
}) => {
  const [userInfo, setUserInfo] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const resolveDisplayName = (user) => (
    user?.fullname ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    user?.email ||
    'User'
  );

  const loadUserInfo = async () => {
    if (!authService.isAuthenticated()) return;
    try {
      if (typeof authService.getCurrentUser === 'function') {
        const user = await authService.getCurrentUser();
        if (user) {
          setUserInfo(user);
          return;
        }
      }
    } catch {
      // fall back to cached user info
    }

    const cachedUser = authService.getUserInfo?.();
    if (cachedUser) setUserInfo(cachedUser);
  };

  useEffect(() => {
    loadUserInfo();
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!authService.isAuthenticated()) return '/login';
    const role = authService.getUserRole();
    if (role === 'admin' || role === 'ADMIN') return '/admin/dashboard';
    if (role === 'tenant' || role === 'TENANT') return '/tenant/room-info';
    return '/app/dashboard';
  };

  const userMenuItems = [
    showProfileItem && {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ].filter(Boolean);

  const onUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      const role = authService.getUserRole();
      if (role === 'admin' || role === 'ADMIN') {
        navigate('/admin/profile');
      } else if (role === 'tenant' || role === 'TENANT') {
        navigate('/tenant/room-info');
      } else {
        navigate('/app/profile');
      }
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchKeyword.trim()) {
      navigate(`/?search=${encodeURIComponent(searchKeyword)}`);
    }
  };

  return (
    <header style={{
      background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #1a1a2e 100%)',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
        onClick={() => navigate('/')}
      >
        <div style={{
          width: 40,
          height: 40,
          background: 'linear-gradient(135deg, #e94560, #f5a623)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: 18,
        }}>
          TT
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 16, display: { xs: 'none', sm: 'block' } }}>
          TTCS Quản Lý Nhà Trọ
        </span>
      </div>

      {/* Search Bar */}
      {showSearch && location.pathname === '/' && (
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
          style={{
            width: 300,
            borderRadius: 24,
            border: 'none',
            padding: '8px 16px',
          }}
          size="large"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={handleSearch}
          allowClear
        />
      )}

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Menu Toggle Button (for Dashboard layouts) */}
        {onMenuToggle && (
          <Button
            type="text"
            icon={menuCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={onMenuToggle}
            style={{ fontSize: '16px', color: 'white' }}
          />
        )}

        {showNotifications && authService.isAuthenticated() && <NotificationPopover variant="dark" />}

        {rightExtra}

        {/* Dashboard Button */}
        {showDashboardButton && authService.isAuthenticated() && (
          <Button
            type="default"
            icon={<DashboardOutlined />}
            onClick={() => navigate(getDashboardLink())}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
            }}
          >
            Dashboard
          </Button>
        )}

        {/* Home Button */}
        {location.pathname !== '/' && (
          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate('/')}
            style={{ color: 'white' }}
          >
            Trang chủ
          </Button>
        )}

        {/* User Menu */}
        {authService.isAuthenticated() ? (
          <Dropdown
            menu={{ items: userMenuItems, onClick: onUserMenuClick }}
            placement="bottomRight"
            arrow
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar
                style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                icon={<UserOutlined />}
              />
              <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                {resolveDisplayName(userInfo)}
              </span>
            </div>
          </Dropdown>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="link" onClick={() => navigate('/login')} style={{ color: 'white' }}>
              Đăng nhập
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #e94560, #f5a623)',
                border: 'none',
              }}
            >
              Đăng ký
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default SharedHeader;
