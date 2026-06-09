import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App, Radio, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, SearchOutlined, HomeOutlined, SafetyOutlined } from '@ant-design/icons';
import { authService } from '../../services/authService';
import SharedHeader from '../../components/SharedHeader';
import SharedFooter from '../../components/SharedFooter';
import '../../styles/AuthPage.css';

const { Title } = Typography;
const { Option } = Select;

const BANK_OPTIONS = [
  { label: 'MB Bank', code: '970422' },
  { label: 'Vietcombank', code: '970436' },
  { label: 'BIDV', code: '970418' },
  { label: 'VietinBank', code: '970415' },
  { label: 'Techcombank', code: '970407' },
  { label: 'ACB', code: '970416' },
  { label: 'Sacombank', code: '970403' },
  { label: 'VPBank', code: '970432' },
  { label: 'TPBank', code: '970423' },
  { label: 'SHB', code: '970443' },
  { label: 'Agribank', code: '970405' },
  { label: 'Eximbank', code: '970431' },
  { label: 'OCB', code: '970448' },
];

const Register = () => {
  const { message } = App.useApp(); // Use App context for message
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState('details');
  const [registrationDetails, setRegistrationDetails] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const initialRole = searchParams.get('role')?.toUpperCase() === 'TENANT' ? 'TENANT' : 'LANDLORD';

  const onFinish = async (values) => {
    const allValues = {
      ...registrationDetails,
      ...form.getFieldsValue(true),
      ...values,
    };
    const isLandlord = allValues.role === 'LANDLORD';
    if (isLandlord && registerStep === 'details') {
      setRegistrationDetails(allValues);
      setRegisterStep('bank');
      message.info('Vui lòng bổ sung thông tin ngân hàng cho chủ trọ.');
      return;
    }
    if (allValues.password !== allValues.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const {
        fullname,
        phone,
        email,
        password,
        role,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_code,
      } = allValues;
      await authService.register({
        fullname,
        phone,
        email,
        password,
        role,
        bank_name,
        bank_account_number,
        bank_account_name,
        bank_code,
      });
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const res = err?.response;
      const status = res?.status;
      const data = res?.data;

      // 422: Lỗi xác thực dữ liệu không hợp lệ
      if (status === 422 && Array.isArray(data?.detail)) {
        const msgs = data.detail.map((e) => e.msg).filter(Boolean);
        const combined = msgs.join('\n');
        message.error(combined || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (status === 400) {
        // 400: Lỗi bad request, thường là trùng lặp dữ liệu (email/phone)
        let detailText = '';
        if (typeof data?.detail === 'string') detailText = data.detail;
        else if (Array.isArray(data?.detail)) detailText = data.detail.map((e) => e.msg).join('\n');
        else if (typeof data === 'string') detailText = data; // e.g., HTML/text body

        const dupMap = {
          'Email already registered': 'Email đã được sử dụng.',
          'Phone already registered': 'Số điện thoại đã được sử dụng.',
          'Email or Phone already registered': 'Email hoặc số điện thoại đã tồn tại.'
        };

        if (detailText in dupMap) {
          const vi = dupMap[detailText];
          message.error(vi);
          // Inline errors on fields for better UX
          const fields = [];
          if (detailText.includes('Email')) fields.push({ name: 'email', errors: [vi] });
          if (detailText.includes('Phone')) fields.push({ name: 'phone', errors: [vi] });
          if (fields.length === 0) fields.push({ name: 'email', errors: [vi] }, { name: 'phone', errors: [vi] });
          form.setFields(fields);
        } else if (detailText) {
          message.error(detailText);
        } else {
          const vi = 'Dữ liệu đã tồn tại trong hệ thống hoặc không hợp lệ.';
          message.error(vi);
          form.setFields([
            { name: 'email', errors: [vi] },
            { name: 'phone', errors: [vi] }
          ]);
        }
      } else {
        // Other statuses or missing response
        const fallback = (typeof data?.detail === 'string' && data.detail) ||
                         (typeof data === 'string' && data) ||
                         err?.message ||
                         'Đăng ký thất bại. Vui lòng thử lại.';
        message.error(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  // Strong password helper validator
  const passwordRules = [
    { required: true, message: 'Vui lòng nhập mật khẩu' },
    { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value) return Promise.resolve();
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasDigit = /\d/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);
        if (hasUpper && hasLower && hasDigit && hasSpecial) return Promise.resolve();
        return Promise.reject(
          new Error('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt')
        );
      },
    }),
  ];

  const isBankStep = registerStep === 'bank';

  return (
    <div className="auth-page">
      <SharedHeader showSearch={false} showDashboardButton={false} showNotifications={false} />

      <main className="auth-hero">
        <div className="auth-hero__inner">
          <section className="auth-brand">
            <div className="auth-brand__header">
              <div className="auth-brand__logo">TT</div>
              <h1 className="auth-brand__title">Không Gian Sống Lý Tưởng</h1>
            </div>
            <p className="auth-brand__subtitle">
              Hàng ngàn phòng trọ, căn hộ, nhà nguyên căn cao cấp đang chờ bạn khám phá.
            </p>
            <div className="auth-brand__highlights">
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><SearchOutlined /></span>
                <span>Tìm kiếm và thuê phòng nhanh chóng</span>
              </div>
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><HomeOutlined /></span>
                <span>Quản lý nhà trọ và đăng bài cho thuê</span>
              </div>
              <div className="auth-brand__item">
                <span className="auth-brand__icon"><SafetyOutlined /></span>
                <span>Tin đăng xác thực, an toàn</span>
              </div>
            </div>
          </section>

          <Card className="auth-card" bordered={false}>
            <div className="auth-card__title">
              <Title level={3} style={{ margin: 0 }}>Đăng ký</Title>
              <span>Tạo tài khoản mới</span>
            </div>

            <style>
              {`
                .ant-form-vertical .ant-form-item-label {
                  padding-bottom: 2px;
                }
              `}
            </style>
            <Form layout="vertical" form={form} onFinish={onFinish} size="large" style={{ fontSize: '16px' }}>
              {!isBankStep && (
                <>
                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Họ và tên</span>}
                    name="fullname"
                    rules={[
                      { required: true, message: 'Vui lòng nhập họ và tên' },
                      { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự' }
                    ]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input
                      prefix={<UserOutlined style={{ fontSize: '18px' }} />}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      style={{
                        fontSize: '16px',
                        padding: '10px 14px',
                        height: '44px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Số điện thoại</span>}
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ (10-11 chữ số)' }
                    ]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input
                      prefix={<PhoneOutlined style={{ fontSize: '18px' }} />}
                      placeholder="Ví dụ: 0912345678"
                      style={{
                        fontSize: '16px',
                        padding: '10px 14px',
                        height: '44px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Email</span>}
                    name="email"
                    rules={[
                      { required: true, message: 'Vui lòng nhập email' },
                      { type: 'email', message: 'Email không hợp lệ' }
                    ]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input
                      prefix={<MailOutlined style={{ fontSize: '18px' }} />}
                      placeholder="you@example.com"
                      style={{
                        fontSize: '16px',
                        padding: '10px 14px',
                        height: '44px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Mật khẩu</span>}
                    name="password"
                    rules={passwordRules}
                    hasFeedback
                    style={{ marginBottom: '6px' }}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ fontSize: '18px' }} />}
                      placeholder="Nhập mật khẩu"
                      style={{
                        fontSize: '16px',
                        padding: '10px 14px',
                        height: '44px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Xác nhận mật khẩu</span>}
                    name="confirmPassword"
                    dependencies={['password']}
                    hasFeedback
                    rules={[
                      { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                        },
                      }),
                    ]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ fontSize: '18px' }} />}
                      placeholder="Nhập lại mật khẩu"
                      style={{
                        fontSize: '16px',
                        padding: '10px 14px',
                        height: '44px'
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Vai trò</span>}
                    name="role"
                    initialValue={initialRole}
                    style={{ marginBottom: '16px', textAlign: 'center' }}
                  >
                    <Radio.Group onChange={() => {
                      setRegisterStep('details');
                      setRegistrationDetails(null);
                    }}>
                      <Radio value="LANDLORD" style={{ fontSize: '15px', marginRight: '24px' }}>Tôi là Chủ trọ</Radio>
                      <Radio value="TENANT" style={{ fontSize: '15px' }}>Tôi là Khách thuê</Radio>
                    </Radio.Group>
                  </Form.Item>
                </>
              )}

              {isBankStep && (
                <>
                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Ngân hàng</span>}
                    name="bank_name"
                    rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Select
                      placeholder="Chọn ngân hàng"
                      allowClear
                      onChange={(value) => {
                        const matched = BANK_OPTIONS.find((item) => item.label === value);
                        form.setFieldsValue({ bank_code: matched ? matched.code : undefined });
                      }}
                    >
                      {BANK_OPTIONS.map((item) => (
                        <Option key={item.code} value={item.label}>
                          {item.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Số tài khoản</span>}
                    name="bank_account_number"
                    rules={[{ required: true, message: 'Vui lòng nhập số tài khoản' }]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input placeholder="Nhập số tài khoản" style={{ fontSize: '16px', padding: '10px 14px', height: '44px' }} />
                  </Form.Item>
                  <Form.Item
                    label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Chủ tài khoản</span>}
                    name="bank_account_name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên chủ tài khoản' }]}
                    style={{ marginBottom: '6px' }}
                  >
                    <Input placeholder="VD: NGUYEN VAN A" style={{ fontSize: '16px', padding: '10px 14px', height: '44px' }} />
                  </Form.Item>
                  <Form.Item name="bank_code" hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: '12px' }}>
                    <Button type="link" onClick={() => setRegisterStep('details')}>
                      Quay lại thông tin cơ bản
                    </Button>
                  </Form.Item>
                </>
              )}

              <Form.Item style={{ marginTop: '8px', marginBottom: '4px' }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    width: '100%',
                    height: '44px',
                    fontSize: '17px',
                    fontWeight: '600'
                  }}
                >
                  {isBankStep ? 'Hoàn tất đăng ký' : 'Đăng ký'}
                </Button>
              </Form.Item>
            </Form>

            <div className="auth-card__footer">
              <Button
                type="link"
                onClick={() => navigate('/login')}
                style={{ fontSize: '15px' }}
              >
                Đã có tài khoản? Đăng nhập
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <SharedFooter />
    </div>
  );
};

export default Register;
