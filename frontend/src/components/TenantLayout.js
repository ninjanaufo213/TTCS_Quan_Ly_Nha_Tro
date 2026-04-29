import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Tag } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const { Header, Sider, Content } = AntLayout;

export default function TenantLayout() {
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
        // ignore: trang vẫn render được với info cache
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

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
      key: '/tenant/assets',
      icon: <AppstoreOutlined />,
      label: 'Tài sản trong phòng',
    },
  ];

  const userMenuItems = [
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true },
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
          background: 'linear-gradient(180deg, #0b1220 0%, #0f172a 50%, #111827 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.25)',
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
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 48, height: 48 }}
            />
            <Tag color="blue" style={{ fontSize: 13 }}>
              Người thuê trọ
            </Tag>
          </div>

          <Dropdown menu={{ items: userMenuItems, onClick: onUserMenuClick }} placement="bottomRight" arrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <Avatar style={{ background: 'linear-gradient(135deg, #1890ff, #0f172a)' }} icon={<UserOutlined />} />
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{userInfo?.fullname || userInfo?.email || 'User'}</div>
                <div style={{ fontSize: 12, color: '#1890ff' }}>TENANT</div>
              </div>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ margin: '24px 20px', padding: 0, minHeight: 'calc(100vh - 112px)' }}>
          <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
