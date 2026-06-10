import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { viewingService } from '../../services/viewingService';

const statusColorMap = {
  PENDING: 'orange',
  APPROVED: 'green',
  SCHEDULED: 'blue',
  CONTRACT_PENDING: 'gold',
  CONTRACTED: 'purple',
  CANCELED: 'red'
};

const MyViewings = () => {
  const [loading, setLoading] = useState(true);
  const [viewings, setViewings] = useState([]);

  const loadViewings = async () => {
    setLoading(true);
    try {
      const data = await viewingService.getMyViewings();
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
      await viewingService.cancelMyViewing(id);
      message.success('Đã hủy lịch xem');
      await loadViewings();
    } catch (error) {
      message.error('Không thể hủy lịch xem');
    }
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
      render: (value) => <Tag color={statusColorMap[value] || 'default'}>{value}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const disabled = ['CANCELED', 'CONTRACTED'].includes(record.status);
        return (
          <Button size="small" danger onClick={() => handleCancel(record.requestId)} disabled={disabled}>
            Hủy lịch
          </Button>
        );
      }
    }
  ];

  return (
    <Card className="dash-animate-fade-in-up" title="Lịch xem phòng của tôi">
      <Table className="dash-animate-fade-in-up"         rowKey="requestId"
        loading={loading}
        dataSource={viewings}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default MyViewings;
