import React from 'react';
import { Card, Col, Descriptions, Divider, List, Row, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { demoContract, demoInvoices } from './demoTenantData';

const { Title, Text } = Typography;

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(value);
const formatDate = (value) => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

export default function TenantServicesInfo() {
  return (
    <div>
      <Row gutter={[16, 16]} align="middle">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Tiền điện / nước / wifi
          </Title>
          <Text type="secondary">Giá dịch vụ và hóa đơn gần đây (demo UI).</Text>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Bảng giá dịch vụ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Giá điện">{formatMoney(demoContract.electricity_unit_price)} đ/kWh</Descriptions.Item>
              <Descriptions.Item label="Số điện đầu">{demoContract.initial_electricity_num}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">{formatMoney(demoContract.water_price)} đ</Descriptions.Item>
              <Descriptions.Item label="Wifi">{formatMoney(demoContract.internet_price)} đ</Descriptions.Item>
              <Descriptions.Item label="Dịch vụ chung">{formatMoney(demoContract.general_price)} đ</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">Hóa đơn thể hiện chi tiết theo kỳ/tháng.</Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Hóa đơn gần đây" bordered>
            <List
              dataSource={demoInvoices}
              locale={{ emptyText: 'Chưa có hóa đơn (demo UI).' }}
              renderItem={(inv) => (
                <List.Item
                  extra={
                    <Tag color={inv?.status === 'PAID' ? 'green' : inv?.status === 'PENDING' ? 'orange' : 'default'}>
                      {inv?.status || 'UNKNOWN'}
                    </Tag>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{inv?.title || `Hóa đơn #${inv?.invoiceId ?? ''}`}</Text>
                    <Text type="secondary">
                      Kỳ: {formatDate(inv?.fromDate)} - {formatDate(inv?.toDate)} • Tổng: {formatMoney(inv?.totalAmount)} đ
                    </Text>
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

