import dayjs from 'dayjs';

export const demoHouse = {
  name: 'Nhà trọ Hoa Sữa',
  addressLine: '12 Nguyễn Trãi',
  ward: 'Phường 5',
  district: 'Quận 3',
};

export const demoContract = {
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
};

export const demoAssets = [
  { assetId: 1, name: 'Máy lạnh', imageUrl: null },
  { assetId: 2, name: 'Tủ lạnh mini', imageUrl: null },
  { assetId: 3, name: 'Giường + nệm', imageUrl: null },
];

export const demoInvoices = [
  { invoiceId: 9901, title: 'Hóa đơn Tháng 3/2026', fromDate: '2026-03-01', toDate: '2026-03-31', totalAmount: 3120000, status: 'PENDING' },
  { invoiceId: 9877, title: 'Hóa đơn Tháng 2/2026', fromDate: '2026-02-01', toDate: '2026-02-29', totalAmount: 3050000, status: 'PAID' },
];

