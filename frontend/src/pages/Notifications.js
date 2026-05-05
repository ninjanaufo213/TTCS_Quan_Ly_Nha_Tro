import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Space, message } from 'antd';
import { notificationService } from '../services/notificationService';

const typeColorMap = {
  VIEWING_CREATED: 'blue',
  VIEWING_CANCELED: 'red',
  CONTRACT_REQUESTED: 'gold',
  CONTRACT_CONFIRMED: 'green',
  CONTRACT_CANCELED: 'orange',
  INVOICE_CREATED: 'blue',
  INVOICE_PROOF_SUBMITTED: 'gold',
  INVOICE_PROOF_APPROVED: 'green',
  INVOICE_PROOF_REJECTED: 'red'
};

const Notifications = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getMyNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      await loadNotifications();
    } catch (error) {
      message.error('Không thể cập nhật trạng thái thông báo');
    }
  };

  return (
    <Card title="Thông báo">
      <List
        loading={loading}
        dataSource={notifications}
        locale={{ emptyText: 'Chưa có thông báo' }}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.isRead ? null : (
                <Button size="small" onClick={() => handleMarkRead(item.notificationId)}>
                  Đánh dấu đã đọc
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span>{item.title}</span>
                  <Tag color={typeColorMap[item.type] || 'default'}>{item.type || 'INFO'}</Tag>
                  {!item.isRead && <Tag color="red">Chưa đọc</Tag>}
                </Space>
              }
              description={
                <div>
                  <div>{item.message}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default Notifications;
