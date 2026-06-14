import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Descriptions, Form, Modal, Row, Select, Spin, Tag, Typography, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { rentedRoomService } from '../../services/rentedRoomService';
import { houseService } from '../../services/houseService';
import { contractExtensionRequestService } from '../../services/contractExtensionRequestService';
import { generateContractPdf } from '../../services/contractPdfExport';

const { Title, Text, Link } = Typography;

const formatMoney = (value) => {
  if (value === null || value === undefined) return '-';
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numberValue)) return String(value);
  return new Intl.NumberFormat('vi-VN').format(numberValue);
};
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

const ContractStatusTag = ({ endDate, isActive }) => {
  if (!isActive) return <Tag color="default">Đã kết thúc</Tag>;
  if (!endDate) return <Tag color="blue">Đang hiệu lực</Tag>;

  const today = dayjs().startOf('day');
  const end = dayjs(endDate).startOf('day');
  const daysLeft = end.diff(today, 'day');

  if (daysLeft < 0) return <Tag color="default">Đã hết hạn</Tag>;
  if (daysLeft <= 7) return <Tag color="red">Sắp hết hạn ({daysLeft} ngày)</Tag>;
  if (daysLeft <= 30) return <Tag color="orange">Còn {daysLeft} ngày</Tag>;
  return <Tag color="green">Còn {daysLeft} ngày</Tag>;
};

export default function TenantContractInfo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionLoading, setExtensionLoading] = useState(false);
  const [extensionForm] = Form.useForm();

  const [contracts, setContracts] = useState([]);
  const [selectedRrId, setSelectedRrId] = useState(null);

  const selectedContract = useMemo(
    () => contracts.find((c) => c.rr_id === selectedRrId) || null,
    [contracts, selectedRrId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rentedRooms = await rentedRoomService.getMyActive();
        const list = Array.isArray(rentedRooms) ? rentedRooms : [];
        setContracts(list);
        setSelectedRrId(list[0]?.rr_id ?? null);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || 'Không thể tải thông tin hợp đồng.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenExtension = () => {
    if (!selectedContract) return;
    extensionForm.resetFields();
    setExtensionModalOpen(true);
  };

  const handleExportPdf = async () => {
    if (!selectedContract) return;
    try {
      // Get house info
      const houseId = selectedContract.room?.house_id;
      let houseInfo = null;
      if (houseId) {
        try {
          houseInfo = await houseService.getById(houseId);
        } catch (_) {}
      }

      // Get landlord info from houseInfo
      const landlordInfo = { 
        name: houseInfo?.landlord_name || houseInfo?.landlordName || '', 
        phone: houseInfo?.landlord_phone || houseInfo?.landlordPhone || '' 
      };

      generateContractPdf(selectedContract, houseInfo || {}, landlordInfo);
      message.success('Đã xuất file PDF hợp đồng!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      message.error('Lỗi khi xuất file PDF hợp đồng!');
    }
  };

  const handleSubmitExtension = async (values) => {
    if (!selectedContract?.rr_id) return;
    setExtensionLoading(true);
    try {
      await contractExtensionRequestService.create({
        rentedRoomId: selectedContract.rr_id,
        requestedEndDate: values.requested_end_date.format('YYYY-MM-DD'),
      });
      message.success('Đã gửi yêu cầu gia hạn hợp đồng');
      setExtensionModalOpen(false);
      extensionForm.resetFields();
    } catch (e) {
      message.error(e?.response?.data?.detail || 'Không thể gửi yêu cầu gia hạn');
    } finally {
      setExtensionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" showIcon message="Có lỗi xảy ra" description={error} />;
  }

  if (!contracts.length) {
    return (
      <Alert
        type="info"
        showIcon
        message="Bạn chưa có hợp đồng thuê còn hiệu lực"
        description="Vui lòng liên hệ chủ trọ để kiểm tra hợp đồng thuê."
      />
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} align="middle">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Thông tin hợp đồng
          </Title>
          <Text type="secondary">Thời hạn hợp đồng, tiền thuê, tiền cọc.</Text>
        </Col>
        <Col flex="auto" />
        <Col>
          <Select
            style={{ minWidth: 260 }}
            value={selectedRrId}
            onChange={setSelectedRrId}
            options={contracts.map((c) => ({
              value: c.rr_id,
              label: c.room?.name || `Phòng #${c.room_id}`,
            }))}
          />
        </Col>
        <Col>
          <Button
            type="default"
            icon={<FilePdfOutlined />}
            onClick={handleExportPdf}
            disabled={!selectedContract}
            style={{ color: '#cf1322', borderColor: '#cf1322' }}
          >
            Xuất PDF hợp đồng
          </Button>
        </Col>
        <Col>
          <Button type="primary" onClick={handleOpenExtension} disabled={!selectedContract}>
            Yêu cầu gia hạn
          </Button>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card className="dash-animate-fade-in-up"             title="Hợp đồng thuê phòng"
            bordered
            extra={<ContractStatusTag endDate={selectedContract?.end_date} isActive={selectedContract?.is_active} />}
          >
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Phòng">{selectedContract?.room?.name || `#${selectedContract?.room_id}`}</Descriptions.Item>
              <Descriptions.Item label="Ngày bắt đầu">{formatDate(selectedContract?.start_date)}</Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">{formatDate(selectedContract?.end_date)}</Descriptions.Item>
              <Descriptions.Item label="Số người ở">{selectedContract?.number_of_tenants ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Tiền thuê/tháng">{formatMoney(selectedContract?.monthly_rent)} đ</Descriptions.Item>
              <Descriptions.Item label="Tiền cọc">{formatMoney(selectedContract?.deposit)} đ</Descriptions.Item>
              <Descriptions.Item label="File hợp đồng">
                {selectedContract?.contract_url ? (
                  <Link href={selectedContract.contract_url} target="_blank" rel="noreferrer">
                    Xem hợp đồng
                  </Link>
                ) : (
                  '-'
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Yêu cầu gia hạn hợp đồng"
        open={extensionModalOpen}
        onCancel={() => {
          setExtensionModalOpen(false);
          extensionForm.resetFields();
        }}
        footer={null}
        width={420}
      >
        <Form form={extensionForm} layout="vertical" onFinish={handleSubmitExtension}>
          <Form.Item
            name="requested_end_date"
            label="Ngày kết thúc mới"
            rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc mới' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => {
                const currentEnd = selectedContract?.end_date ? dayjs(selectedContract.end_date) : null;
                if (!d) return false;
                if (!currentEnd) return d.isBefore(dayjs().startOf('day'));
                return d.isBefore(currentEnd.add(1, 'day').startOf('day'));
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={() => {
              setExtensionModalOpen(false);
              extensionForm.resetFields();
            }} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={extensionLoading}>
              Gửi yêu cầu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
