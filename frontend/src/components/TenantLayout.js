import React, { useState } from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  BellOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SharedHeader from './SharedHeader';

const { Sider, Content } = AntLayout;

export default function TenantLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/tenant/room-info',
      icon: <HomeOutlined />,
      label: 'Thông tin phòng trọ',
    },
    {
      key: '/tenant/contract',
      icon: <FileTextOutlined />,
      label: 'Thông tin hợp đồng',
    },
    {
      key: '/tenant/services',
      icon: <ThunderboltOutlined />,
      label: 'Điện / nước / wifi',
    },
    {
      key: '/tenant/invoices',
      icon: <FileTextOutlined />,
      label: 'Hóa đơn & thanh toán',
    },
    {
      key: '/tenant/viewings',
      icon: <CalendarOutlined />,
      label: 'Lịch xem phòng',
    },
    {
      key: '/tenant/contract-requests',
      icon: <FileTextOutlined />,
      label: 'Xác nhận hợp đồng',
    },
    {
      key: '/tenant/notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
    },
    {
      key: '/tenant/profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: 'linear-gradient(180deg, #0b1220 0%, #0f172a 50%, #111827 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.25)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: 64,
            margin: '16px 12px',
            background: 'linear-gradient(135deg, #1890ff 0%, #0f172a 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: collapsed ? 0 : 8,
            overflow: 'hidden',
            color: '#fff',
            fontWeight: 700,
          }}
        >
          {collapsed ? 'TR' : 'Tenant Room'}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', border: 'none' }}
          theme="dark"
        />
      </Sider>

      <AntLayout>
        <SharedHeader
          showSearch={false}
          showDashboardButton={false}
          onMenuToggle={() => setCollapsed(!collapsed)}
          menuCollapsed={collapsed}
          showProfileItem={true}
          showNotifications
        />

        <Content style={{ margin: '24px 20px', padding: 0, minHeight: 'calc(100vh - 112px)' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
            <div className="dash-animate-fade-in-up"><Outlet /></div>
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
