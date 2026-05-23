import React, { useState } from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import {
  DashboardOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import SharedHeader from './SharedHeader';

const { Sider, Content } = AntLayout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  const selectedKey =
    menuItems.map((item) => item.key).find((key) => location.pathname.startsWith(key)) ||
    '/admin/dashboard';

  return (
    <AntLayout style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Shared Header */}
      <SharedHeader 
        showSearch={false} 
        showDashboardButton={false}
        onMenuToggle={() => setCollapsed(!collapsed)}
        menuCollapsed={collapsed}
        showNotifications
      />

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          style={{
            background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            boxShadow: '2px 0 8px rgba(0,0,0,0.3)',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
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

          {/* Menu */}
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            style={{
              background: 'transparent',
              border: 'none',
            }}
            theme="dark"
          />
        </Sider>

        {/* Main Content */}
        <AntLayout style={{ flex: 1 }}>
          <Content style={{
            margin: '24px 20px',
            padding: 24,
            background: '#fff',
            borderRadius: 12,
            minHeight: 'calc(100vh - 128px)',
          }}>
            <Outlet />
          </Content>
        </AntLayout>
      </div>
    </AntLayout>
  );
};

export default AdminLayout;
