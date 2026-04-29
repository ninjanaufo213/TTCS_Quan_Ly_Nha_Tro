import React, { useMemo, useState } from 'react';
import { Card, Col, Descriptions, Divider, List, Row, Select, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

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

export default function MyRental() {
  // Demo UI only (chưa kết nối database/API)
  const demoHouse = useMemo(
    () => ({
      name: 'Nhà trọ Hoa Sữa',
      addressLine: '12 Nguyễn Trãi',
      ward: 'Phường 5',
      district: 'Quận 3',
    }),
    []
  );

  const demoContracts = useMemo(
    () => [
      {
        rr_id: 101,
        room_id: 12,
        room: {
          houseId: 3,
          name: 'Phòng 203',
          capacity: 2,
          description: 'Phòng có gác, WC riêng, cửa sổ thoáng.',
        },
        number_of_tenants: 2,
        start_date: dayjs().subtract(2, 'month').format('YYYY-MM-DD'),
        end_date: dayjs().add(10, 'month').format('YYYY-MM-DD'),
        monthly_rent: 2500000,
        deposit: 2500000,
        contract_url: 'https://example.com/contract.pdf',
        electricity_unit_price: 3500,
        initial_electricity_num: 1200,
        water_price: 80000,
        internet_price: 100000,
        general_price: 50000,
        is_active: true,
      },
    ],
    []
  );

  const demoAssets = useMemo(
    () => [
      { assetId: 1, name: 'Máy lạnh', imageUrl: null },
      { assetId: 2, name: 'Tủ lạnh mini', imageUrl: null },
      { assetId: 3, name: 'Giường + nệm', imageUrl: null },
    ],
    []
  );

  const demoInvoices = useMemo(
    () => [
      { invoiceId: 9901, title: 'Hóa đơn Tháng 3/2026', fromDate: '2026-03-01', toDate: '2026-03-31', totalAmount: 3120000, status: 'PENDING' },
      { invoiceId: 9877, title: 'Hóa đơn Tháng 2/2026', fromDate: '2026-02-01', toDate: '2026-02-29', totalAmount: 3050000, status: 'PAID' },
    ],
    []
  );

  const [selectedRrId, setSelectedRrId] = useState(demoContracts[0]?.rr_id ?? null);

  const selectedContract = useMemo(
    () => demoContracts.find((c) => c.rr_id === selectedRrId) || null,
    [demoContracts, selectedRrId]
  );

  return (
    <div>
      <Row gutter={[16, 16]} align="middle" justify="space-between">
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            Thông tin trọ của tôi
          </Title>
          <Text type="secondary">Xem lại thông tin phòng, hợp đồng và các dịch vụ đi kèm.</Text>
        </Col>
        <Col>
          <Select
            style={{ minWidth: 280 }}
            value={selectedRrId}
            onChange={setSelectedRrId}
            options={demoContracts.map((c) => ({
              value: c.rr_id,
              label: `${c.room?.name || `Phòng #${c.room_id}`} • ${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
            }))}
          />
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Thông tin phòng / trọ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Nhà trọ">{demoHouse?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {[demoHouse?.addressLine, demoHouse?.ward, demoHouse?.district].filter(Boolean).join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Phòng">{selectedContract?.room?.name || `#${selectedContract?.room_id}`}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">{selectedContract?.room?.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="Sức chứa">{selectedContract?.room?.capacity ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title="Thông tin hợp đồng"
            extra={<ContractStatusTag endDate={selectedContract?.end_date} isActive={selectedContract?.is_active} />}
            bordered
          >
            <Descriptions column={1} size="middle">
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

        <Col xs={24} lg={12}>
          <Card title="Tiền điện / nước / wifi / dịch vụ" bordered>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="Giá điện">
                {selectedContract?.electricity_unit_price ? `${formatMoney(selectedContract.electricity_unit_price)} đ/kWh` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện đầu">{selectedContract?.initial_electricity_num ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Giá nước">
                {selectedContract?.water_price ? `${formatMoney(selectedContract.water_price)} đ` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Wifi">
                {selectedContract?.internet_price ? `${formatMoney(selectedContract.internet_price)} đ` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Dịch vụ chung">
                {selectedContract?.general_price ? `${formatMoney(selectedContract.general_price)} đ` : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <Text type="secondary">
              Gợi ý: phần “Hóa đơn” (nếu có) sẽ thể hiện số điện/nước tiêu thụ theo từng tháng.
            </Text>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Tài sản trong phòng" bordered>
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

        <Col xs={24}>
          <Card title="Hóa đơn gần đây" bordered>
            <List
              dataSource={demoInvoices.slice(0, 5)}
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
