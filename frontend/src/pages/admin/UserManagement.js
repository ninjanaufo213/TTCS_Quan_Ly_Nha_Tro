import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Tag, Space, Modal, Form, Input,
  Select, App, Popconfirm, Avatar, Badge, Row, Col, Statistic, Typography, Tooltip
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  CrownOutlined,
  HomeOutlined,
  FilterOutlined,
  EditOutlined,
} from '@ant-design/icons';
import adminService from '../../services/adminService';

const { Text } = Typography;
const { Search } = Input;

const roleConfig = {
  ADMIN: { color: 'volcano', icon: <CrownOutlined />, label: 'Admin' },
  LANDLORD: { color: 'blue', icon: <HomeOutlined />, label: 'Chủ trọ' },
  TENANT: { color: 'green', icon: <UserOutlined />, label: 'Người thuê' },
};

const avatarColor = { ADMIN: '#e94560', LANDLORD: '#0f3460', TENANT: '#52c41a' };

const UserManagement = () => {
  const { message } = App.useApp();
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [editModal, setEditModal] = useState({ open: false, record: null });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters(users, roleFilter, searchText);
  }, [users, roleFilter, searchText]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (e) {
      setUsers([]);
      message.error(e?.response?.data?.detail || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (data, role, search) => {
    let result = [...data];
    if (role !== 'ALL') result = result.filter(u => u.role === role);
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(u =>
        u.email?.toLowerCase().includes(lower) ||
        u.phone?.includes(lower)
      );
    }
    setFiltered(result);
  };

  const handleToggleStatus = async (record) => {
    try {
      const updated = await adminService.toggleUserStatus(record.userId);
      setUsers(prev => prev.map(u => (u.userId === updated.userId ? updated : u)));
      message.success(updated.isActive ? `✅ Đã mở khóa ${updated.email}` : `🔒 Đã khóa tài khoản ${updated.email}`);
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Lỗi khi thay đổi trạng thái!');
    }
  };

  const openEdit = (record) => {
    setEditModal({ open: true, record });
    form.setFieldsValue({ email: record.email, phone: record.phone, role: record.role });
  };

  const handleEditSubmit = async (values) => {
    try {
      const updated = await adminService.updateUser(editModal.record.userId, values);
      setUsers(prev => prev.map(u => (u.userId === updated.userId ? updated : u)));
      message.success('Cập nhật người dùng thành công!');
      setEditModal({ open: false, record: null });
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Lỗi khi cập nhật!');
    }
  };

  const stats = {
    total: users.length,
    admin: users.filter(u => u.role === 'ADMIN').length,
    landlord: users.filter(u => u.role === 'LANDLORD').length,
    tenant: users.filter(u => u.role === 'TENANT').length,
    active: users.filter(u => u.isActive).length,
    locked: users.filter(u => !u.isActive).length,
  };

  const columns = [
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={40}
            icon={<UserOutlined />}
            style={{ background: record.isActive ? avatarColor[record.role] : '#bbb', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{record.email}</div>
            <div style={{ fontSize: 12, color: '#888' }}>📞 {record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (role) => {
        const cfg = roleConfig[role] || {};
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label || role}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (active) =>
        active
          ? <Badge status="success" text={<Tag color="success">Hoạt động</Tag>} />
          : <Badge status="error" text={<Tag color="error">Bị khóa</Tag>} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Khóa tài khoản' : 'Mở khóa'}>
            <Popconfirm
              title={record.isActive
                ? `Khóa tài khoản ${record.email}?`
                : `Mở khóa tài khoản ${record.email}?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Xác nhận"
              cancelText="Hủy"
              okButtonProps={{ danger: record.isActive }}
            >
              <Button
                size="small"
                danger={record.isActive}
                type={record.isActive ? 'default' : 'primary'}
                icon={record.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                style={!record.isActive ? { background: '#52c41a', border: 'none' } : {}}
              >
                {record.isActive ? 'Khóa' : 'Mở khóa'}
              </Button>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng người dùng', value: stats.total, color: '#0f3460', icon: <TeamOutlined /> },
          { label: 'Chủ trọ', value: stats.landlord, color: '#1677ff', icon: <HomeOutlined /> },
          { label: 'Người thuê', value: stats.tenant, color: '#52c41a', icon: <UserOutlined /> },
          { label: 'Đang khóa', value: stats.locked, color: '#e94560', icon: <StopOutlined /> },
        ].map((s) => (
          <Col span={6} key={s.label}>
            <Card
              bodyStyle={{ padding: '16px 20px' }}
              style={{
                borderRadius: 12,
                background: `${s.color}10`,
                border: `1px solid ${s.color}30`,
              }}
            >
              <Statistic
                title={<span style={{ color: '#555', fontWeight: 500 }}>{s.label}</span>}
                value={s.value}
                prefix={React.cloneElement(s.icon, { style: { color: s.color } })}
                valueStyle={{ color: s.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#0f3460' }} />
            <span>Quản lý người dùng</span>
          </div>
        }
        style={{ borderRadius: 16 }}
        extra={
          <Space>
            <Search
              placeholder="Tìm email, SĐT..."
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
              onChange={e => setSearchText(e.target.value)}
            />
            <Select
              defaultValue="ALL"
              style={{ width: 140 }}
              suffixIcon={<FilterOutlined />}
              onChange={setRoleFilter}
              options={[
                { label: 'Tất cả', value: 'ALL' },
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Chủ trọ', value: 'LANDLORD' },
                { label: 'Người thuê', value: 'TENANT' },
              ]}
            />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="userId"
          loading={loading}
          pagination={{ pageSize: 8, showTotal: (t) => `Tổng ${t} người dùng` }}
          rowClassName={(record) => !record.isActive ? 'locked-row' : ''}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        open={editModal.open}
        onCancel={() => setEditModal({ open: false, record: null })}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined />
            <span>Chỉnh sửa người dùng</span>
          </div>
        }
        footer={null}
        width={480}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="email" label="Email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập SĐT!' }]}>
            <Input prefix="📞" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò"
            rules={[{ required: true, message: 'Chọn vai trò!' }]}>
            <Select options={[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Chủ trọ', value: 'LANDLORD' },
              { label: 'Người thuê', value: 'TENANT' },
            ]} />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setEditModal({ open: false, record: null })}>Hủy</Button>
              <Button type="primary" htmlType="submit">Lưu thay đổi</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .locked-row { opacity: 0.6; background: #fafafa !important; }
        .locked-row:hover td { background: #f0f0f0 !important; }
      `}</style>
    </div>
  );
};

export default UserManagement;
