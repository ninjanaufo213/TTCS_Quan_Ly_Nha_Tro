import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Descriptions } from 'antd';
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const handleOpenDetail = (record) => {
    setSelectedRequest(record);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedRequest(null);
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
            <Button size="small" onClick={() => handleOpenDetail(record)}>
              Xem
            </Button>
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
    <Card className="dash-animate-fade-in-up" title="Yêu cầu hợp đồng">
      <Table className="dash-animate-fade-in-up"         rowKey="contractRequestId"
        loading={loading}
        dataSource={requests}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />

      <Modal
        title="Chi tiết yêu cầu hợp đồng"
        open={detailOpen}
        onCancel={handleCloseDetail}
        footer={null}
        width={520}
      >
        <Descriptions column={1} size="middle">
          <Descriptions.Item label="Phòng">{selectedRequest?.roomName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Nhà trọ">{selectedRequest?.houseName || '-'}</Descriptions.Item>
          <Descriptions.Item label="Số người">{selectedRequest?.numberOfTenants ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Từ ngày">{selectedRequest?.startDate ? dayjs(selectedRequest.startDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Đến ngày">{selectedRequest?.endDate ? dayjs(selectedRequest.endDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Tiền thuê/tháng">{selectedRequest?.monthlyRent ? Number(selectedRequest.monthlyRent).toLocaleString('vi-VN') : '-'} đ</Descriptions.Item>
          <Descriptions.Item label="Tiền cọc">{selectedRequest?.deposit ? Number(selectedRequest.deposit).toLocaleString('vi-VN') : '-'} đ</Descriptions.Item>
          <Descriptions.Item label="Giá điện">{selectedRequest?.electricityUnitPrice ? Number(selectedRequest.electricityUnitPrice).toLocaleString('vi-VN') : '-'} đ/kWh</Descriptions.Item>
          <Descriptions.Item label="Số điện ban đầu">{selectedRequest?.initialElectricityNum ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Giá nước">{selectedRequest?.waterPrice ? Number(selectedRequest.waterPrice).toLocaleString('vi-VN') : '-'} đ</Descriptions.Item>
          <Descriptions.Item label="Giá wifi">{selectedRequest?.internetPrice ? Number(selectedRequest.internetPrice).toLocaleString('vi-VN') : '-'} đ</Descriptions.Item>
          <Descriptions.Item label="Giá dịch vụ chung">{selectedRequest?.generalPrice ? Number(selectedRequest.generalPrice).toLocaleString('vi-VN') : '-'} đ</Descriptions.Item>
          <Descriptions.Item label="Link hợp đồng">
            {selectedRequest?.contractUrl ? (
              <a href={selectedRequest.contractUrl} target="_blank" rel="noreferrer">
                Xem hợp đồng
              </a>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusColorMap[selectedRequest?.status] || 'default'}>
              {selectedRequest?.status || '-'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <Button onClick={handleCloseDetail}>Đóng</Button>
          <Button
            type="primary"
            onClick={() => selectedRequest && handleConfirm(selectedRequest.contractRequestId)}
            disabled={selectedRequest?.status !== 'PENDING'}
          >
            Xác nhận
          </Button>
          <Button
            danger
            onClick={() => selectedRequest && handleCancel(selectedRequest.contractRequestId)}
            disabled={selectedRequest?.status !== 'PENDING'}
          >
            Hủy
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default ContractRequests;

