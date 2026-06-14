import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Tag, Space, message, Modal, Descriptions, Checkbox, Divider, Alert } from 'antd';
import { CheckCircleFilled, CloseCircleFilled, EyeOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractRequestService } from '../../services/contractRequestService';
import SignaturePad from '../../components/SignaturePad';

const statusColorMap = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELED: 'red'
};

const statusLabelMap = {
  PENDING: 'Đang chờ',
  CONFIRMED: 'Đã xác nhận',
  CANCELED: 'Đã hủy'
};

const formatMoney = (value) => {
  if (value === null || value === undefined) return '-';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat('vi-VN').format(num);
};

const ContractRequests = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [signingOpen, setSigningOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tenantSignature, setTenantSignature] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

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

  const handleOpenSigning = (record) => {
    setSelectedRequest(record);
    setTenantSignature(null);
    setAgreedTerms(false);
    setSigningOpen(true);
  };

  const handleConfirmWithSignature = async () => {
    if (!selectedRequest || !tenantSignature) return;
    setConfirmLoading(true);
    try {
      const signMetadata = JSON.stringify({
        signed_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      await contractRequestService.confirm(selectedRequest.contractRequestId, {
        signature: tenantSignature,
        sign_metadata: signMetadata,
      });
      message.success('Đã ký và xác nhận hợp đồng thành công!');
      setSigningOpen(false);
      setSelectedRequest(null);
      setTenantSignature(null);
      setAgreedTerms(false);
      await loadRequests();
    } catch (error) {
      message.error(error?.response?.data?.detail || 'Không thể xác nhận hợp đồng');
    } finally {
      setConfirmLoading(false);
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
      title: 'Tiền thuê',
      dataIndex: 'monthlyRent',
      key: 'monthlyRent',
      render: (value) => value ? `${formatMoney(value)} đ` : '-'
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
      title: 'Chữ ký',
      key: 'signatures',
      render: (_, record) => (
        <Space size={4}>
          <Tag color={record.landlordSignature ? 'green' : 'default'} style={{ fontSize: 11 }}>
            {record.landlordSignature ? '✓' : '✗'} Chủ trọ
          </Tag>
          <Tag color={record.tenantSignature ? 'green' : 'default'} style={{ fontSize: 11 }}>
            {record.tenantSignature ? '✓' : '✗'} Người thuê
          </Tag>
        </Space>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => <Tag color={statusColorMap[value] || 'default'}>{statusLabelMap[value] || value}</Tag>
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => {
        const isPending = record.status === 'PENDING';
        return (
          <Space>
            <Button size="small" icon={<EyeOutlined />} onClick={() => handleOpenDetail(record)}>
              Xem
            </Button>
            {isPending && (
              <>
                <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleOpenSigning(record)}>
                  Ký & Xác nhận
                </Button>
                <Button size="small" danger onClick={() => handleCancel(record.contractRequestId)}>
                  Hủy
                </Button>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  // Contract details component (reused in both modals)
  const ContractDetails = ({ request }) => (
    <Descriptions column={1} size="middle">
      <Descriptions.Item label="Phòng">{request?.roomName || '-'}</Descriptions.Item>
      <Descriptions.Item label="Nhà trọ">{request?.houseName || '-'}</Descriptions.Item>
      <Descriptions.Item label="Số người">{request?.numberOfTenants ?? '-'}</Descriptions.Item>
      <Descriptions.Item label="Từ ngày">{request?.startDate ? dayjs(request.startDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
      <Descriptions.Item label="Đến ngày">{request?.endDate ? dayjs(request.endDate).format('DD/MM/YYYY') : '-'}</Descriptions.Item>
      <Descriptions.Item label="Tiền thuê/tháng">{formatMoney(request?.monthlyRent)} đ</Descriptions.Item>
      <Descriptions.Item label="Tiền cọc">{formatMoney(request?.deposit)} đ</Descriptions.Item>
      <Descriptions.Item label="Giá điện">{formatMoney(request?.electricityUnitPrice)} đ/kWh</Descriptions.Item>
      <Descriptions.Item label="Số điện ban đầu">{request?.initialElectricityNum ?? '-'}</Descriptions.Item>
      <Descriptions.Item label="Giá nước">{formatMoney(request?.waterPrice)} đ</Descriptions.Item>
      <Descriptions.Item label="Giá wifi">{formatMoney(request?.internetPrice)} đ</Descriptions.Item>
      <Descriptions.Item label="Giá dịch vụ chung">{formatMoney(request?.generalPrice)} đ</Descriptions.Item>
    </Descriptions>
  );

  return (
    <Card className="dash-animate-fade-in-up" title="Yêu cầu hợp đồng">
      <Table
        className="dash-animate-fade-in-up"
        rowKey="contractRequestId"
        loading={loading}
        dataSource={requests}
        columns={columns}
        pagination={{ pageSize: 8 }}
      />

      {/* Detail View Modal */}
      <Modal
        title="Chi tiết yêu cầu hợp đồng"
        open={detailOpen}
        onCancel={handleCloseDetail}
        footer={<Button onClick={handleCloseDetail}>Đóng</Button>}
        width={600}
      >
        <ContractDetails request={selectedRequest} />

        {/* Show signatures if they exist */}
        {(selectedRequest?.landlordSignature || selectedRequest?.tenantSignature) && (
          <>
            <Divider>Chữ ký</Divider>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <SignaturePad
                label="Chữ ký chủ trọ (Bên A)"
                value={selectedRequest?.landlordSignature}
                disabled={true}
                width={250}
                height={120}
              />
              <SignaturePad
                label="Chữ ký người thuê (Bên B)"
                value={selectedRequest?.tenantSignature}
                disabled={true}
                width={250}
                height={120}
              />
            </div>
          </>
        )}

        <Descriptions column={1} size="middle" style={{ marginTop: 16 }}>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusColorMap[selectedRequest?.status] || 'default'}>
              {statusLabelMap[selectedRequest?.status] || selectedRequest?.status || '-'}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      {/* Signing Modal */}
      <Modal
        title="Ký & Xác nhận hợp đồng"
        open={signingOpen}
        onCancel={() => {
          setSigningOpen(false);
          setSelectedRequest(null);
          setTenantSignature(null);
          setAgreedTerms(false);
        }}
        width={700}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setSigningOpen(false);
              setSelectedRequest(null);
              setTenantSignature(null);
              setAgreedTerms(false);
            }}
          >
            Hủy
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={confirmLoading}
            disabled={!tenantSignature || !agreedTerms}
            onClick={handleConfirmWithSignature}
            icon={<CheckCircleFilled />}
          >
            Ký & Xác nhận hợp đồng
          </Button>
        ]}
      >
        <Alert
          message="Vui lòng đọc kỹ các điều khoản hợp đồng trước khi ký"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <ContractDetails request={selectedRequest} />

        <Divider>Chữ ký</Divider>

        {/* Landlord signature (read-only) */}
        <SignaturePad
          label="Chữ ký chủ trọ (Bên A)"
          value={selectedRequest?.landlordSignature}
          disabled={true}
          width={400}
          height={150}
        />

        {/* Tenant signature (editable) */}
        <SignaturePad
          label="Chữ ký của bạn (Bên B)"
          onSignatureChange={setTenantSignature}
          width={400}
          height={150}
        />

        <Checkbox
          checked={agreedTerms}
          onChange={(e) => setAgreedTerms(e.target.checked)}
          style={{ marginTop: 16 }}
        >
          <span style={{ fontSize: 13 }}>
            Tôi đồng ý rằng hợp đồng này được giao kết bằng phương thức điện tử theo
            <strong> Luật Giao dịch điện tử 2023</strong> và có giá trị pháp lý tương đương hợp đồng văn bản.
          </span>
        </Checkbox>
      </Modal>
    </Card>
  );
};

export default ContractRequests;
