import React, { useEffect, useState } from 'react';
import { Popover, Badge, List, Typography, Spin, Button, Modal, Divider, Tag } from 'antd';
import { BellOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { notificationService } from '../services/notificationService';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Text } = Typography;

export default function NotificationPopover() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      // Ensure data is array and sort by latest first
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
    
    // Lắng nghe sự kiện từ trang Notifications hoặc các nơi khác
    const handleSync = () => fetchNotifications();
    window.addEventListener('notificationMarkedRead', handleSync);

    return () => {
      window.removeEventListener('notificationMarkedRead', handleSync);
    };
  }, []);

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id, isRead, e) => {
    // Hiển thị chi tiết trong Modal
    setSelectedNotification(notifications.find(n => getId(n) === id));
    setIsModalOpen(true);
    setOpen(false); // Đóng popover khi mở modal cho đỡ rối

    if (isRead) return; // already read

    try {
      await notificationService.markRead(id);
      window.dispatchEvent(new CustomEvent('notificationMarkedRead', { detail: { id } }));
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          (notif.notificationId === id || notif.notification_id === id) 
            ? { ...notif, isRead: true, is_read: true } 
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Support both camelCase and snake_case depending on API mapping
  const getIsRead = (item) => item.isRead !== undefined ? item.isRead : item.is_read;
  const getId = (item) => item.notificationId || item.notification_id;

  const unreadCount = notifications.filter(n => !getIsRead(n)).length;

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
                style={{
                  padding: '12px 16px',
                  background: isRead ? '#fff' : '#f0f5ff',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onClick={() => handleMarkAsRead(getId(item), isRead)}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text strong={!isRead} style={{ color: isRead ? '#8c8c8c' : '#262626' }}>
                        {item.title}
                      </Text>
                      {!isRead && (
                        <Badge dot color="blue" />
                      )}
                    </div>
                  }
                  description={
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Text type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, color: isRead ? '#bfbfbf' : '#595959' }}>
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
      <Popover
        content={content}
        title={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '4px 0'
          }}>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 700, 
              color: '#1e293b',
              letterSpacing: '-0.02em'
            }}>
              Thông báo
            </span>
            <Button 
              type="text" 
              size="small" 
              icon={<ReloadOutlined style={{ fontSize: 12 }} />}
              onClick={fetchNotifications} 
              loading={loading}
              style={{ 
                color: '#3b82f6', 
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 500,
                borderRadius: '6px',
                padding: '0 8px'
              }}
              className="hover-bright"
            >
              Làm mới
            </Button>
          </div>
        }
        trigger="click"
        open={open}
        onOpenChange={handleOpenChange}
        placement="bottomRight"
        overlayInnerStyle={{ padding: 0 }}
      >
        <Badge count={unreadCount} overflowCount={99} size="small" offset={[-4, 4]}>
          <Button 
            type="text" 
            icon={<BellOutlined style={{ fontSize: 20 }} />} 
            style={{ width: 40, height: 40, borderRadius: '50%' }}
          />
        </Badge>
      </Popover>

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
          </Button>
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
