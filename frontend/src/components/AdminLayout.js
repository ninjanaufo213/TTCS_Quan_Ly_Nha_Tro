import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Badge, Tag } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

const { Header, Sider, Content } = AntLayout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = authService.getUserInfo();
    setUserInfo(user);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/room-approval',
      icon: <CheckCircleOutlined />,
      label: 'Duyệt phòng trọ',
    },
    {
      key: '/admin/users',
      icon: <TeamOutlined />,
      label: 'Quản lý người dùng',
    },
    {
      key: '/admin/area-stats',
      icon: <BarChartOutlined />,
      label: 'Thống kê khu vực',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  const onUserMenuClick = ({ key }) => {
    if (key === 'logout') handleLogout();
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          margin: '16px 12px',
          background: 'linear-gradient(135deg, #e94560 0%, #0f3460 100%)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: collapsed ? 0 : 8,
          overflow: 'hidden',
        }}>
          <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 20 }} />
          {!collapsed && (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>
              Admin Panel
            </span>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
          }}
          theme="dark"
        />
      </Sider>

      <AntLayout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <Tag color="volcano" icon={<SafetyCertificateOutlined />} style={{ fontSize: 13 }}>
              Quản trị viên
            </Tag>
          </div>

          <Dropdown
            menu={{ items: userMenuItems, onClick: onUserMenuClick }}
            placement="bottomRight"
            arrow
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar
                style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }}
                icon={<UserOutlined />}
              />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {userInfo?.email || 'Admin'}
                </div>
                <div style={{ fontSize: 12, color: '#e94560' }}>ADMIN</div>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{
          margin: '24px 20px',
          padding: 0,
          minHeight: 'calc(100vh - 112px)',
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AdminLayout;
