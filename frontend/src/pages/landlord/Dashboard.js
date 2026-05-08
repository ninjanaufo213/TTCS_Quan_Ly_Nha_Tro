import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Tag, Modal, Descriptions, Image, Spin, App, Popconfirm } from 'antd';
import {
  BankOutlined,
  ShopOutlined,
  UserOutlined,
  DollarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { houseService } from '../../services/houseService';
import { roomService } from '../../services/roomService';
import { rentedRoomService } from '../../services/rentedRoomService';
import { invoiceService } from '../../services/invoiceService';
import { viewingService } from '../../services/viewingService';
import DashboardLayout from '../../components/DashboardLayout';

const Dashboard = () => {
  const { message } = App.useApp();
  const [stats, setStats] = useState({
    totalHouses: 0,
    totalRooms: 0,
    totalRentedRooms: 0,
    totalPendingInvoices: 0,
  });
  const [recentData, setRecentData] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [viewingRequests, setViewingRequests] = useState([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [houseDetailOpen, setHouseDetailOpen] = useState(false);
  const [houseDetailLoading, setHouseDetailLoading] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const navigate = useNavigate();

  const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
  const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
  const resolveImageUrl = (url) => {
    if (!url) return url;
    if (url.startsWith('data:') || url.startsWith('blob:')) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (!apiOrigin) return url;
    const normalized = url.startsWith('/') ? url : `/${url}`;
    return `${apiOrigin}${normalized}`;
  };

  useEffect(() => {
    fetchDashboardData();
    fetchViewingRequests();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [houses, rooms, rentedRooms, invoices] = await Promise.all([
        houseService.getAll(),
        roomService.getAll(),
        rentedRoomService.getAll(),
        invoiceService.getPending(),
      ]);

      setStats({
        totalHouses: houses.length,
        totalRooms: rooms.length,
        totalRentedRooms: rentedRooms.length,
        totalPendingInvoices: invoices.length,
      });

      setRecentData(houses.slice(0, 5));
      setPendingInvoices(invoices.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHouseDetail = async (houseId) => {
    setHouseDetailOpen(true);
    setHouseDetailLoading(true);
    try {
      const data = await houseService.getById(houseId);
      setSelectedHouse(data);
    } catch (error) {
      console.error('Error fetching house detail:', error);
      message.error('Lỗi khi tải chi tiết nhà trọ!');
    } finally {
      setHouseDetailLoading(false);
    }
  };

  const fetchViewingRequests = async () => {
    setRequestLoading(true);
    try {
      const data = await viewingService.getLandlordViewings();
      setViewingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải yêu cầu xem phòng:', err);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      if (status === 'APPROVED') {
        await viewingService.approveLandlordViewing(id);
        message.success('Xác nhận thành công!');
      } else {
        await viewingService.rejectLandlordViewing(id);
        message.success('Đã từ chối yêu cầu.');
      }
      fetchViewingRequests();
    } catch (err) {
      message.error('Không thể cập nhật trạng thái.');
    }
  };

  const handleCancelViewing = async (id) => {
    try {
      await viewingService.cancelLandlordViewing(id);
      message.success('Đã hủy lịch xem');
      fetchViewingRequests();
    } catch (err) {
      message.error('Không thể hủy lịch xem.');
    }
  };

  const goToContractRequest = (record) => {
    const params = new URLSearchParams({
      action: 'request',
      viewingId: String(record.requestId),
      room: String(record.roomId),
      tenantName: record.tenantName || '',
      tenantPhone: record.tenantPhone || ''
    });
    navigate(`/app/contracts?${params.toString()}`);
  };

  const houseColumns = [
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address_line',
      key: 'address_line',
      ellipsis: true,
    },
    {
      title: 'Số tầng',
      dataIndex: 'floor_count',
      key: 'floor_count',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 240,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleOpenHouseDetail(record.house_id)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<ShopOutlined />}
            onClick={() => navigate(`/app/rooms?house=${record.house_id}`)}
          >
            Xem phòng
          </Button>
        </div>
      ),
    },
  ];

  const calcTotal = (inv) => (
    Number(inv?.price || 0) +
    Number(inv?.water_price || 0) +
    Number(inv?.internet_price || 0) +
    Number(inv?.general_price || 0) +
    Number(inv?.electricity_price || 0)
  );

  const invoiceColumns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'price',
      key: 'price',
      render: (_, record) => `${calcTotal(record).toLocaleString()} VNĐ`,
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: () => <Tag color="red">Chưa thanh toán</Tag>,
    },
  ];

  const statusTag = (status) => {
    if (status === 'APPROVED') return <Tag color="green" icon={<CheckCircleOutlined />}>Đã xác nhận</Tag>;
    if (status === 'CONTRACT_PENDING') return <Tag color="gold" icon={<ClockCircleOutlined />}>Chờ hợp đồng</Tag>;
    if (status === 'CONTRACTED') return <Tag color="purple" icon={<CheckCircleOutlined />}>Đã ký hợp đồng</Tag>;
    if (status === 'CANCELED') return <Tag color="red" icon={<CloseCircleOutlined />}>Đã hủy</Tag>;
    return <Tag color="orange" icon={<ClockCircleOutlined />}>Chờ xác nhận</Tag>;
  };

  const viewingColumns = [
    { title: 'Khách thuê', dataIndex: 'tenantName', key: 'tenantName', render: v => v || 'N/A' },
    { title: 'Số điện thoại', dataIndex: 'tenantPhone', key: 'tenantPhone', render: v => v || 'N/A' },
    { title: 'Phòng', dataIndex: 'roomName', key: 'roomName' },
    { title: 'Nhà trọ', dataIndex: 'houseName', key: 'houseName' },
    {
      title: 'Ngày muốn xem',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'Chưa chọn',
    },
    {
      title: 'Giờ',
      dataIndex: 'visitTime',
      key: 'visitTime',
      render: (t) => t || 'Chưa chọn',
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => statusTag(s),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 260,
      render: (_, record) => record.status === 'PENDING' ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Popconfirm
            title="Xác nhận yêu cầu xem phòng?"
            onConfirm={() => handleUpdateStatus(record.requestId, 'APPROVED')}
            okText="Xác nhận" cancelText="Hủy"
          >
            <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Xác nhận</Button>
          </Popconfirm>
          <Popconfirm
            title="Từ chối yêu cầu này?"
            onConfirm={() => handleUpdateStatus(record.requestId, 'CANCELED')}
            okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<CloseCircleOutlined />}>Từ chối</Button>
          </Popconfirm>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button
            size="small"
            onClick={() => goToContractRequest(record)}
            disabled={record.status !== 'APPROVED'}
          >
            Tạo hợp đồng mới
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleCancelViewing(record.requestId)}
            disabled={!['APPROVED', 'CONTRACT_PENDING'].includes(record.status)}
          >
            Hủy lịch
          </Button>
        </div>
      ),
    },
  ];

  const activeRequests = viewingRequests.filter(r => !['CANCELED', 'CONTRACTED'].includes(r.status));

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle="Quản lý nhà trọ, phòng trọ và hóa đơn"
      showHeader={false}
      showFooter={false}
    >
      {/* Stats Row */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số nhà trọ"
              value={stats.totalHouses}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng số phòng"
              value={stats.totalRooms}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Phòng đang thuê"
              value={stats.totalRentedRooms}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hóa đơn chưa thanh toán"
              value={stats.totalPendingInvoices}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Content Rows */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Nhà trọ gần đây" style={{ height: 400 }}>
            <Table
              columns={houseColumns}
              dataSource={recentData}
              rowKey="house_id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Hóa đơn chưa thanh toán" style={{ height: 400 }}>
            <Table
              columns={invoiceColumns}
              dataSource={pendingInvoices}
              rowKey="invoice_id"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title={
              <span>
                <ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
                Yêu cầu xem phòng
                {activeRequests.filter(r => r.status === 'PENDING').length > 0 && (
                  <Tag color="orange" style={{ marginLeft: 12 }}>
                    {activeRequests.filter(r => r.status === 'PENDING').length} chờ xác nhận
                  </Tag>
                )}
              </span>
            }
          >
            <Table
              columns={viewingColumns}
              dataSource={activeRequests}
              rowKey="requestId"
              pagination={{ pageSize: 5, showTotal: (t) => `Tổng ${t} yêu cầu` }}
              loading={requestLoading}
              size="small"
              locale={{ emptyText: 'Chưa có yêu cầu xem phòng nào.' }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedHouse?.name ? `Chi tiết nhà trọ - ${selectedHouse.name}` : 'Chi tiết nhà trọ'}
        open={houseDetailOpen}
        onCancel={() => {
          setHouseDetailOpen(false);
          setSelectedHouse(null);
        }}
        footer={null}
        width={800}
      >
        {houseDetailLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin />
          </div>
        ) : (
          <>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Tên nhà trọ">
                {selectedHouse?.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {selectedHouse?.address_line || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Phường/Xã">
                {selectedHouse?.ward || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Quận/Huyện">
                {selectedHouse?.district || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Số tầng">
                {selectedHouse?.floor_count ?? 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {selectedHouse?.created_at ? new Date(selectedHouse.created_at).toLocaleDateString('vi-VN') : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 16 }}>
              <strong>Hình ảnh</strong>
              <div style={{ marginTop: 8 }}>
                {(selectedHouse?.images || []).length === 0 ? (
                  <div>Chưa có ảnh</div>
                ) : (
                  <Image.PreviewGroup>
                    {(selectedHouse?.images || []).map((img, index) => {
                      const url = resolveImageUrl(img.image_url || img.imageUrl);
                      return (
                        <Image
                          key={img.image_id || img.imageId || index}
                          src={url}
                          width={120}
                          height={90}
                          style={{ objectFit: 'cover', marginRight: 8, marginBottom: 8 }}
                        />
                      );
                    })}
                  </Image.PreviewGroup>
                )}
              </div>
            </div>

            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => {
                  if (selectedHouse?.house_id) {
                    navigate(`/app/rooms?house=${selectedHouse.house_id}`);
                  }
                }}
              >
                Xem phòng
              </Button>
            </div>
          </>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Dashboard;
