import React, { useCallback, useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Rate,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import { reviewService } from '../../services/reviewService';

const { Text, Title } = Typography;

const Reviews = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewService.getLandlordReviews();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      const detail = error?.response?.data?.message || 'Không tải được danh sách đánh giá.';
      message.error(detail);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const getValue = (record, snakeKey, camelKey) => record?.[snakeKey] ?? record?.[camelKey];

  const formatDateTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openReplyModal = (review) => {
    setSelectedReview(review);
    form.setFieldsValue({
      reply: getValue(review, 'landlord_reply', 'landlordReply') || '',
    });
    setReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setSelectedReview(null);
    form.resetFields();
  };

  const submitReply = async (values) => {
    const reviewId = getValue(selectedReview, 'review_id', 'reviewId');
    if (!reviewId) {
      message.error('Không xác định được đánh giá cần phản hồi.');
      return;
    }

    setReplyLoading(true);
    try {
      await reviewService.replyToReview(reviewId, { reply: values.reply });
      message.success('Đã lưu phản hồi đánh giá.');
      closeReplyModal();
      loadReviews();
    } catch (error) {
      const detail = error?.response?.data?.message || 'Lưu phản hồi thất bại.';
      message.error(detail);
    } finally {
      setReplyLoading(false);
    }
  };

  const columns = [
    {
      title: 'Phòng',
      key: 'room',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{getValue(record, 'room_name', 'roomName') || 'Phòng trọ'}</Text>
          <Text type="secondary">{getValue(record, 'house_name', 'houseName') || 'Nhà trọ'}</Text>
        </Space>
      ),
    },
    {
      title: 'Khách thuê',
      key: 'tenant',
      width: 180,
      render: (_, record) => getValue(record, 'tenant_name', 'tenantName') || 'Khách thuê',
    },
    {
      title: 'Đánh giá',
      key: 'rating',
      width: 150,
      render: (_, record) => <Rate disabled value={record.rating || 0} style={{ fontSize: 16 }} />,
    },
    {
      title: 'Nội dung',
      key: 'comment',
      render: (_, record) => record.comment || <Text type="secondary">Không có bình luận</Text>,
    },
    {
      title: 'Ngày đánh giá',
      key: 'created_at',
      width: 170,
      render: (_, record) => formatDateTime(getValue(record, 'created_at', 'createdAt')),
    },
    {
      title: 'Phản hồi',
      key: 'reply',
      width: 260,
      render: (_, record) => {
        const reply = getValue(record, 'landlord_reply', 'landlordReply');
        const repliedAt = getValue(record, 'landlord_replied_at', 'landlordRepliedAt');

        if (!reply) {
          return <Tag color="orange">Chưa phản hồi</Tag>;
        }

        return (
          <Space direction="vertical" size={4}>
            <Tag color="green">Đã phản hồi</Tag>
            <Text>{reply}</Text>
            {repliedAt && <Text type="secondary">{formatDateTime(repliedAt)}</Text>}
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const hasReply = Boolean(getValue(record, 'landlord_reply', 'landlordReply'));
        return (
          <Button icon={<MessageOutlined />} onClick={() => openReplyModal(record)}>
            {hasReply ? 'Sửa' : 'Phản hồi'}
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Card
        title={
          <Space direction="vertical" size={0}>
            <Title level={3} style={{ margin: 0 }}>Đánh giá phòng trọ</Title>
            <Text type="secondary">Xem và phản hồi đánh giá của khách thuê cho các phòng thuộc nhà trọ của bạn.</Text>
          </Space>
        }
        extra={<Button icon={<ReloadOutlined />} onClick={loadReviews}>Tải lại</Button>}
      >
        <Table
          rowKey={(record) => getValue(record, 'review_id', 'reviewId')}
          columns={columns}
          dataSource={reviews}
          loading={loading}
          locale={{ emptyText: <Empty description="Chưa có đánh giá nào" /> }}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 1180 }}
        />
      </Card>

      <Modal
        title="Phản hồi đánh giá"
        open={replyModalOpen}
        onCancel={closeReplyModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submitReply}>
          <Form.Item
            name="reply"
            label="Nội dung phản hồi"
            rules={[
              { required: true, message: 'Vui lòng nhập nội dung phản hồi.' },
              { max: 1000, message: 'Phản hồi tối đa 1000 ký tự.' },
            ]}
          >
            <Input.TextArea rows={5} maxLength={1000} showCount placeholder="Nhập phản hồi của chủ trọ..." />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button onClick={closeReplyModal} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={replyLoading}>
              Lưu phản hồi
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Reviews;
