import React, { useState, useEffect, useRef } from 'react';
import { Button, Avatar, Input } from 'antd';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        navigate('/tenant/profile');
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
          fontSize: 14,
        }}>
          TTCS
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
          <div
            ref={userMenuRef}
            style={{ position: 'relative' }}
            onMouseEnter={() => setUserMenuOpen(true)}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              className="user-dropdown-trigger"
              onClick={() => setUserMenuOpen((current) => !current)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 8,
                border: 0,
                background: userMenuOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              <Avatar
                style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                icon={<UserOutlined />}
              />
              <span style={{ color: 'white', fontSize: 14, fontWeight: 500 }}>
                {resolveDisplayName(userInfo)}
              </span>
            </button>

            {userMenuOpen && (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  zIndex: 1300,
                  minWidth: 190,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
                  padding: 4,
                }}
              >
                {userMenuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      onUserMenuClick({ key: item.key });
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      border: 0,
                      borderRadius: 6,
                      background: 'transparent',
                      color: item.danger ? '#dc2626' : '#111827',
                      cursor: 'pointer',
                      fontSize: 14,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
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
