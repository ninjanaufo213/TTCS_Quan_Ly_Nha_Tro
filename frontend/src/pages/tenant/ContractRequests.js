import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message } from 'antd';
import dayjs from 'dayjs';
import { contractRequestService } from '../../services/contractRequestService';

const statusColorMap = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELED: 'red'
};

const ContractRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await contractRequestService.getTenantRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Không thể tải yêu cầu hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleConfirm = async (id) => {
    try {
      await contractRequestService.confirm(id);
      message.success('Đã xác nhận hợp đồng');
      await loadRequests();
    } catch (error) {
      message.error('Không thể xác nhận hợp đồng');
    }
  };

  const handleCancel = async (id) => {
    try {
      await contractRequestService.cancel(id);
      message.success('Đã hủy yêu cầu hợp đồng');
      await loadRequests();
    } catch (error) {
      message.error('Không thể hủy yêu cầu hợp đồng');
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
      title: 'Số người',
      dataIndex: 'numberOfTenants',
      key: 'numberOfTenants'
    },
    {
      title: 'Từ ngày',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '')
    },
    {
      title: 'Đến ngày',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '')
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
        const disabled = record.status !== 'PENDING';
        return (
          <Space>
            <Button type="primary" size="small" onClick={() => handleConfirm(record.contractRequestId)} disabled={disabled}>
              Xác nhận
            </Button>
            <Button size="small" danger onClick={() => handleCancel(record.contractRequestId)} disabled={disabled}>
              Hủy
            </Button>
          </Space>
        );
      }
    }
  ];

  return (
    <Card title="Yêu cầu hợp đồng">
      <Table
        rowKey="contractRequestId"
        loading={loading}
        dataSource={requests}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default ContractRequests;

