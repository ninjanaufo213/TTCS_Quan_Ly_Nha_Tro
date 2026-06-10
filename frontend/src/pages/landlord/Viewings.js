import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import { viewingService } from '../../services/viewingService';
import { useNavigate } from 'react-router-dom';

const statusColorMap = {
  PENDING: 'orange',
  APPROVED: 'green',
  SCHEDULED: 'blue',
  CONTRACT_PENDING: 'gold',
  CONTRACTED: 'purple',
  CANCELED: 'red'
};

const statusLabelMap = {
  PENDING: 'Chờ xác nhận',
  APPROVED: 'Đã xác nhận',
  SCHEDULED: 'Đã lên lịch',
  CONTRACT_PENDING: 'Chờ hợp đồng',
  CONTRACTED: 'Đã ký hợp đồng',
  CANCELED: 'Đã hủy'
};

const Viewings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [viewings, setViewings] = useState([]);

  const loadViewings = async () => {
    setLoading(true);
    try {
      const data = await viewingService.getLandlordViewings();
      setViewings(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Không thể tải lịch xem phòng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadViewings();
  }, []);

  const handleCancel = async (id) => {
    try {
      await viewingService.cancelLandlordViewing(id);
      message.success('Đã hủy lịch xem');
      await loadViewings();
    } catch (error) {
      message.error('Không thể hủy lịch xem');
    }
  };

  const handleApprove = async (id) => {
    try {
      await viewingService.approveLandlordViewing(id);
      message.success('Xác nhận thành công!');
      await loadViewings();
    } catch (error) {
      message.error('Không thể xác nhận lịch xem');
    }
  };

  const handleReject = async (id) => {
    try {
      await viewingService.rejectLandlordViewing(id);
      message.success('Đã từ chối yêu cầu.');
      await loadViewings();
    } catch (error) {
      message.error('Không thể từ chối lịch xem');
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

  const columns = [
    {
      title: 'Phòng',
      dataIndex: 'roomName',
      key: 'roomName'
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'houseName',
      key: 'houseName'
    },
    {
      title: 'Người thuê',
      dataIndex: 'tenantName',
      key: 'tenantName'
    },
    {
      title: 'SĐT',
      dataIndex: 'tenantPhone',
      key: 'tenantPhone'
    },
    {
      title: 'Ngày',
      dataIndex: 'visitDate',
      key: 'visitDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '')
    },
    {
      title: 'Giờ',
      dataIndex: 'visitTime',
      key: 'visitTime',
      render: (value) => value || ''
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={statusColorMap[value] || 'default'}>
          {statusLabelMap[value] || value}
        </Tag>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'PENDING') {
          return (
            <Space>
              <Popconfirm
                title="Xác nhận yêu cầu xem phòng?"
                onConfirm={() => handleApprove(record.requestId)}
                okText="Xác nhận" cancelText="Hủy"
              >
                <Button size="small" type="primary">Xác nhận</Button>
              </Popconfirm>
              <Popconfirm
                title="Từ chối yêu cầu này?"
                onConfirm={() => handleReject(record.requestId)}
                okText="Từ chối" cancelText="Hủy" okButtonProps={{ danger: true }}
              >
                <Button size="small" danger>Từ chối</Button>
              </Popconfirm>
            </Space>
          );
        }

        const canCreateContract = record.status === 'APPROVED';
        const canCancel = ['APPROVED', 'CONTRACT_PENDING'].includes(record.status);
        return (
          <Space>
            <Button size="small" onClick={() => goToContractRequest(record)} disabled={!canCreateContract}>
              Tạo hợp đồng mới
            </Button>
            <Button size="small" danger onClick={() => handleCancel(record.requestId)} disabled={!canCancel}>
              Hủy lịch
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Card className="dash-animate-fade-in-up" title="Lịch đặt xem phòng">
      <Table className="dash-animate-fade-in-up"         rowKey="requestId"
        loading={loading}
        dataSource={viewings}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default Viewings;
