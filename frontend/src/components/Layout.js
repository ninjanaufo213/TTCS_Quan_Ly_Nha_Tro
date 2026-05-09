import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { 
  HomeOutlined, 
  BankOutlined,
  ShopOutlined,
  FileTextOutlined,
  DollarOutlined,
  NotificationOutlined,
  CalendarOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';
import SharedHeader from './SharedHeader';

const { Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserInfo(user);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
     fetchUserInfo();
   }, []);

   const isTenant = userInfo?.role?.authority?.toLowerCase() === 'tenant';

  // Landlord menu items
  const menuItems = [
    {
      key: '/app/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/app/houses',
      icon: <BankOutlined />,
      label: 'Quản lý nhà trọ',
    },
    {
      key: '/app/rooms',
      icon: <ShopOutlined />,
      label: 'Quản lý phòng trọ',
    },
    {
      key: '/app/listings',
      icon: <NotificationOutlined />,
      label: 'Quản lý bài đăng',
    },
    {
      key: '/app/viewings',
      icon: <CalendarOutlined />,
      label: 'Lịch xem phòng',
    },
    {
      key: '/app/contracts',
      icon: <FileTextOutlined />,
      label: 'Hợp đồng thuê',
    },
    {
      key: '/app/invoices',
      icon: <DollarOutlined />,
      label: 'Hóa đơn',
    },
    {
      key: '/app/reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo & AI',
    },
     {
       key: '/app/notifications',
       icon: <BellOutlined />,
       label: 'Thông báo',
     },
   ];

   return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {!isTenant && (
        <Sider trigger={null} collapsible collapsed={collapsed} style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}>
          <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'RT' : 'Room Management'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
        </Sider>
      )}
      <AntLayout>
        {/* Shared Header */}
        {isTenant ? (
          <SharedHeader
            showSearch={false}
            showDashboardButton={false}
            showNotifications
          />
        ) : (
          <SharedHeader 
            showSearch={false} 
            showDashboardButton={false}
            onMenuToggle={() => setCollapsed(!collapsed)}
            menuCollapsed={collapsed}
            showNotifications
          />
        )}
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
