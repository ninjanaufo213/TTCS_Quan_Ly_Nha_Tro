import React from 'react';
import { Card, List, Row, Col, Typography } from 'antd';
import { demoAssets } from './demoTenantData';

const { Title, Text, Link } = Typography;

export default function TenantAssetsInfo() {
  return (
    <div>
      <Row gutter={[16, 16]} align="middle">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Tài sản trong phòng
          </Title>
          <Text type="secondary">Danh sách tài sản được ghi nhận (demo UI).</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Danh sách tài sản" bordered>
            <List
              dataSource={demoAssets}
              locale={{ emptyText: 'Chưa có tài sản (demo UI).' }}
              renderItem={(item) => (
                <List.Item>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{item?.name || '-'}</Text>
                    {item?.imageUrl ? (
                      <Link href={item.imageUrl} target="_blank" rel="noreferrer">
                        Xem hình ảnh
                      </Link>
                    ) : (
                      <Text type="secondary">Không có hình</Text>
                    )}
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

