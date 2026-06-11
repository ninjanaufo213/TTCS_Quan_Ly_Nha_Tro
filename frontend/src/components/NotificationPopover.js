import React, { useEffect, useRef, useState } from 'react';
import { Badge, Button, Divider, List, Modal, Spin, Tag, Typography } from 'antd';
import { BellOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { notificationService } from '../services/notificationService';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

export default function NotificationPopover({ variant = 'light' }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const popoverRef = useRef(null);

  const isDark = variant === 'dark';

  const getIsRead = (item) => (item.isRead !== undefined ? item.isRead : item.is_read);
  const getId = (item) => item.notificationId || item.notification_id;

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleSync = () => fetchNotifications();
    window.addEventListener('notificationMarkedRead', handleSync);

    return () => {
      window.removeEventListener('notificationMarkedRead', handleSync);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) fetchNotifications();
  };

  const handleMarkAsRead = async (id, isRead) => {
    setSelectedNotification(notifications.find((item) => getId(item) === id));
    setIsModalOpen(true);
    setOpen(false);

    if (isRead) return;

    try {
      await notificationService.markRead(id);
      window.dispatchEvent(new CustomEvent('notificationMarkedRead', { detail: { id } }));
      setNotifications((prev) =>
        prev.map((item) =>
          getId(item) === id ? { ...item, isRead: true, is_read: true } : item
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      window.dispatchEvent(new CustomEvent('notificationMarkedRead'));
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const unreadCount = notifications.filter((item) => !getIsRead(item)).length;

  const content = (
    <div style={{ width: 320, maxHeight: 400, overflowY: 'auto' }}>
      {loading && notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications}
          locale={{ emptyText: 'Không có thông báo nào.' }}
          renderItem={(item) => {
            const isRead = getIsRead(item);

            return (
              <List.Item
                className={`notification-item ${isRead ? 'is-read' : 'is-unread'}`}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                onClick={() => handleMarkAsRead(getId(item), isRead)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!isRead} style={{ color: isRead ? '#8c8c8c' : '#262626' }}>
                        {item.title}
                      </Text>
                      {!isRead && <Badge dot color="blue" />}
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Text
                        type="secondary"
                        ellipsis={{ rows: 2 }}
                        style={{ fontSize: 13, color: isRead ? '#bfbfbf' : '#595959' }}
                      >
                        {item.message}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12, color: '#bfbfbf' }}>
                        {dayjs(item.createdAt || item.created_at).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );

  return (
    <>
      <div ref={popoverRef} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          type="button"
          aria-label="Mở thông báo"
          aria-expanded={open}
          onClick={toggleOpen}
          style={{
            width: 40,
            height: 40,
            border: 0,
            borderRadius: '50%',
            color: isDark ? '#fff' : '#111827',
            background: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <Badge count={unreadCount} overflowCount={99} size="small" offset={[-4, 4]}>
            <BellOutlined style={{ fontSize: 20, color: isDark ? '#fff' : '#111827' }} />
          </Badge>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Thông báo"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 1300,
              width: 340,
              maxWidth: 'calc(100vw - 24px)',
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.18)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#1e293b',
                  letterSpacing: '-0.02em',
                }}
              >
                Thông báo
              </span>
              <div>
                <Button
                  type="text"
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  style={{
                    color: unreadCount === 0 ? '#94a3b8' : '#16a34a',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    padding: '0 8px',
                  }}
                >
                  Đánh dấu tất cả đã đọc
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                  onClick={fetchNotifications}
                  loading={loading}
                  style={{
                    color: '#3b82f6',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    padding: '0 8px',
                  }}
                >
                  Làm mới
                </Button>
              </div>
            </div>
            {content}
          </div>
        )}
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>Chi tiết thông báo</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
            Đóng
          </Button>,
        ]}
        centered
        width={400}
      >
        {selectedNotification && (
          <div style={{ padding: '10px 0' }}>
            <Typography.Title level={4} style={{ marginBottom: 12 }}>
              {selectedNotification.title}
            </Typography.Title>
            <Typography.Paragraph style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.6 }}>
              {selectedNotification.message}
            </Typography.Paragraph>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="blue">{selectedNotification.type || 'INFO'}</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(selectedNotification.createdAt || selectedNotification.created_at).format('HH:mm DD/MM/YYYY')}
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
