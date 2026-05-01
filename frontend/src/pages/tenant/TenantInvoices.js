import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import { UploadOutlined, QrcodeOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { invoiceService } from '../../services/invoiceService';

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

const BANK_CODE_MAP = {
  'mb bank': '970422',
  'mbbank': '970422',
  'mb': '970422',
  'vietcombank': '970436',
  'vcb': '970436',
  'bidv': '970418',
  'vietinbank': '970415',
  'techcombank': '970407',
  'acb': '970416',
  'sacombank': '970403',
  'vpbank': '970432',
  'tpbank': '970423',
  'shb': '970443',
  'agribank': '970405',
  'eximbank': '970431',
  'ocb': '970448',
};

const normalizeBankName = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const resolveBankCode = (bankCode, bankName) => {
  if (bankCode) return bankCode;
  const normalized = normalizeBankName(bankName);
  if (!normalized) return null;
  if (BANK_CODE_MAP[normalized]) return BANK_CODE_MAP[normalized];
  const key = Object.keys(BANK_CODE_MAP).find((item) => normalized.includes(item));
  return key ? BANK_CODE_MAP[key] : null;
};

const buildVietQrUrl = ({ bankCode, bankName, accountNumber, amount, addInfo, accountName }) => {
  const resolvedBankCode = resolveBankCode(bankCode, bankName);
  if (!resolvedBankCode || !accountNumber) return null;
  const params = new URLSearchParams();
  if (amount) params.append('amount', String(amount));
  if (addInfo) params.append('addInfo', addInfo);
  if (accountName) params.append('accountName', accountName);
  return `https://img.vietqr.io/image/${resolvedBankCode}-${accountNumber}-compact2.png?${params.toString()}`;
};

const proofStatusLabel = (status) => {
  switch ((status || 'NONE').toUpperCase()) {
    case 'PENDING':
      return <Tag color="orange">Chờ duyệt</Tag>;
    case 'APPROVED':
      return <Tag color="green">Đã duyệt</Tag>;
    case 'REJECTED':
      return <Tag color="red">Bị từ chối</Tag>;
    default:
      return <Tag>Chưa gửi</Tag>;
  }
};

export default function TenantInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getMy();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Không thể tải hóa đơn của bạn.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const openPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPayModalOpen(true);
    setFileList([]);
    form.resetFields();
  };

  const closePayModal = () => {
    setPayModalOpen(false);
    setSelectedInvoice(null);
    setFileList([]);
    form.resetFields();
  };

  const handleSubmitProof = async () => {
    if (!selectedInvoice) return;
    if (!fileList.length) {
      message.warning('Vui lòng chọn ảnh/chứng từ để gửi.');
      return;
    }
    setSubmitting(true);
    try {
      const note = form.getFieldValue('note');
      const file = fileList[0].originFileObj;
      const updated = await invoiceService.submitProof(selectedInvoice.invoice_id || selectedInvoice.invoiceId, file, note);
      setInvoices((prev) => prev.map((inv) => (inv.invoice_id === updated.invoice_id ? updated : inv)));
      message.success('Đã gửi minh chứng thanh toán.');
      closePayModal();
    } catch (error) {
      message.error(error?.response?.data?.detail || 'Gửi minh chứng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: 'Kỳ hóa đơn',
        dataIndex: 'due_date',
        key: 'due_date',
        render: (value, record) => (
          <div>
            <div><strong>{record?.rented_room?.room?.name || `Phòng #${record?.rented_room?.room?.room_id || record?.rented_room?.room_id || ''}`}</strong></div>
            <div>Đến hạn: {formatDate(value)}</div>
          </div>
        ),
      },
      {
        title: 'Tổng tiền',
        dataIndex: 'total_amount',
        key: 'total_amount',
        render: (value) => `${formatMoney(value)} đ`,
      },
      {
        title: 'Thanh toán',
        dataIndex: 'is_paid',
        key: 'is_paid',
        render: (value) => (value ? <Tag color="green">Đã thanh toán</Tag> : <Tag color="red">Chưa thanh toán</Tag>),
      },
      {
        title: 'Minh chứng',
        dataIndex: 'proof_status',
        key: 'proof_status',
        render: (value) => proofStatusLabel(value),
      },
      {
        title: 'Hành động',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              icon={<QrcodeOutlined />}
              onClick={() => openPayModal(record)}
              disabled={record?.proof_status?.toUpperCase?.() === 'APPROVED'}
            >
              Thanh toán
            </Button>
            {record?.proof_url && (
              <Button type="link" href={record.proof_url} target="_blank" rel="noreferrer">
                Xem minh chứng
              </Button>
            )}
          </Space>
        ),
      },
    ],
    []
  );

  const qrUrl = useMemo(() => {
    if (!selectedInvoice) return null;
    return buildVietQrUrl({
      bankCode: selectedInvoice.bank_code || selectedInvoice.bankCode,
      bankName: selectedInvoice.bank_name || selectedInvoice.bankName,
      accountNumber: selectedInvoice.bank_account_number || selectedInvoice.bankAccountNumber,
      amount: selectedInvoice.total_amount,
      addInfo: `Thanh toan hoa don ${selectedInvoice.invoice_id || ''}`,
      accountName: selectedInvoice.bank_account_name || selectedInvoice.bankAccountName,
    });
  }, [selectedInvoice]);

  return (
    <div>
      <Card
        title="Hóa đơn & thanh toán"
        extra={(
          <Button icon={<ReloadOutlined />} onClick={loadInvoices} loading={loading}>
            Làm mới
          </Button>
        )}
      >
        <Table
          rowKey={(record) => record.invoice_id || record.invoiceId}
          columns={columns}
          dataSource={invoices}
          loading={loading}
          pagination={{ pageSize: 6 }}
          locale={{ emptyText: 'Chưa có hóa đơn.' }}
        />
      </Card>

      <Modal
        open={payModalOpen}
        onCancel={closePayModal}
        onOk={handleSubmitProof}
        confirmLoading={submitting}
        okText="Gửi minh chứng"
        cancelText="Đóng"
        title="Thanh toán hóa đơn"
        destroyOnClose
      >
        {selectedInvoice ? (
          <div>
            <p><strong>Tổng tiền:</strong> {formatMoney(selectedInvoice.total_amount)} đ</p>
            <p><strong>Đến hạn:</strong> {formatDate(selectedInvoice.due_date)}</p>

            {(selectedInvoice.bank_account_number || selectedInvoice.bankAccountNumber) ? (
              <div style={{ marginBottom: 16 }}>
                <Alert
                  type="info"
                  showIcon
                  message="Thông tin chuyển khoản"
                  description={
                    <div>
                      <div><strong>Ngân hàng:</strong> {selectedInvoice.bank_name || selectedInvoice.bankName || '-'}</div>
                      <div><strong>Số tài khoản:</strong> {selectedInvoice.bank_account_number || selectedInvoice.bankAccountNumber}</div>
                      <div><strong>Chủ tài khoản:</strong> {selectedInvoice.bank_account_name || selectedInvoice.bankAccountName || '-'}</div>
                    </div>
                  }
                />
                {qrUrl && (
                  <div style={{ marginTop: 12, textAlign: 'center' }}>
                    <img src={qrUrl} alt="VietQR" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  </div>
                )}
              </div>
            ) : (
              <Alert type="warning" showIcon message="Chủ trọ chưa cập nhật thông tin ngân hàng." />
            )}

            {selectedInvoice.proof_status === 'REJECTED' && (
              <Alert
                type="error"
                showIcon
                message="Minh chứng bị từ chối"
                description={selectedInvoice.proof_review_note || 'Vui lòng gửi lại minh chứng mới.'}
                style={{ marginBottom: 12 }}
              />
            )}

            <Form layout="vertical" form={form}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={3} placeholder="VD: Thanh toán qua MB, nội dung chuyển khoản..." />
              </Form.Item>
              <Form.Item label="Minh chứng thanh toán">
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  fileList={fileList}
                  onChange={({ fileList: nextList }) => setFileList(nextList)}
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                </Upload>
              </Form.Item>
            </Form>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
