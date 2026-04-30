import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Listings from '../pages/landlord/Listings';
import { listingService } from '../services/listingService';
import { roomService } from '../services/roomService';

const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();

jest.mock('antd', () => {
  const React = require('react');
  return {
    ...jest.requireActual('antd'),
    App: {
      useApp: () => ({
        message: { success: mockMessageSuccess, error: mockMessageError }
      })
    },
    Form: Object.assign(
      ({ children, onFinish, form }) => (
        <form data-testid="listing-form" onSubmit={(e) => {
          e.preventDefault();
          onFinish({ roomId: 1, title: 'Cho thuê phòng P101', description: 'Phòng đẹp giá rẻ' });
        }}>{children}</form>
      ),
      {
        Item: ({ children, label }) => <div data-testid={`form-item-${label}`}>{children}</div>,
        useForm: () => [{ resetFields: jest.fn(), setFieldsValue: jest.fn(), getFieldsValue: jest.fn() }]
      }
    ),
    Input: Object.assign(
      (props) => <input {...props} onChange={(e) => props.onChange?.(e)} />,
      {
        Search: (props) => <input data-testid="search-input" {...props} />,
        TextArea: (props) => <textarea data-testid="textarea" {...props} />
      }
    ),
    Select: (props) => <select data-testid="select" {...props}>{props.children}</select>,
    Button: ({ children, onClick, htmlType, ...props }) => (
      <button onClick={onClick} type={htmlType === 'submit' ? 'submit' : 'button'} {...props}>{children}</button>
    ),
    Card: ({ children, title, extra }) => <div data-testid="card"><div>{title}</div><div>{extra}</div>{children}</div>,
    Table: ({ dataSource, columns, loading }) => (
      <table data-testid="listings-table">
        <thead>
          <tr>{columns.map((col, i) => <th key={i}>{col.title}</th>)}</tr>
        </thead>
        <tbody>
          {(dataSource || []).map((row, i) => (
            <tr key={i} data-testid={`row-${i}`}>
              {columns.map((col, j) => (
                <td key={j}>
                  {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {loading && <tfoot><tr><td>Loading...</td></tr></tfoot>}
      </table>
    ),
    Modal: ({ children, open, title }) => open ? <div data-testid="modal"><div>{title}</div>{children}</div> : null,
    Tag: ({ children, color }) => <span data-testid={`tag-${color}`}>{children}</span>,
    Badge: ({ text }) => <span>{text}</span>,
    Space: ({ children }) => <div>{children}</div>,
    Row: ({ children }) => <div>{children}</div>,
    Col: ({ children }) => <div>{children}</div>,
    Statistic: ({ title, value }) => <div data-testid={`stat-${title}`}><span>{title}</span><span>{value}</span></div>,
    Empty: ({ description }) => <div>{description}</div>,
    Typography: { Text: ({ children }) => <span>{children}</span> },
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

jest.mock('../services/listingService', () => ({
  listingService: {
    getMyListings: jest.fn(),
    createListing: jest.fn(),
  }
}));

jest.mock('../services/roomService', () => ({
  roomService: {
    getAll: jest.fn(),
  }
}));

describe('Trang Quản lý Bài đăng (Listings)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listingService.getMyListings.mockResolvedValue([]);
    roomService.getAll.mockResolvedValue([]);
  });

  it('Hiển thị bảng danh sách và nút Đăng tin mới', async () => {
    render(
      <MemoryRouter>
        <Listings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('listings-table')).toBeInTheDocument();
    });
    expect(screen.getByText('Đăng tin mới')).toBeInTheDocument();
  });

  it('Hiển thị danh sách bài đăng từ API', async () => {
    listingService.getMyListings.mockResolvedValue([
      {
        listingId: 1,
        title: 'Cho thuê phòng P101',
        isPublished: false,
        viewsCount: 5,
        createdAt: '2026-04-28T10:00:00',
        room: { price: 3000000, district: 'Bình Thạnh', ward: 'Phường 1' }
      },
      {
        listingId: 2,
        title: 'Phòng trọ giá rẻ Q7',
        isPublished: true,
        viewsCount: 20,
        createdAt: '2026-04-27T10:00:00',
        room: { price: 2500000, district: 'Quận 7', ward: 'Phường 2' }
      }
    ]);

    render(
      <MemoryRouter>
        <Listings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Cho thuê phòng P101')).toBeInTheDocument();
      expect(screen.getByText('Phòng trọ giá rẻ Q7')).toBeInTheDocument();
    });
  });

  it('Hiển thị thống kê đếm bài đăng', async () => {
    listingService.getMyListings.mockResolvedValue([
      { listingId: 1, title: 'A', isPublished: false, room: {} },
      { listingId: 2, title: 'B', isPublished: true, room: {} },
    ]);

    render(
      <MemoryRouter>
        <Listings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('stat-Chờ duyệt')).toBeInTheDocument();
      expect(screen.getByTestId('stat-Đã duyệt')).toBeInTheDocument();
      expect(screen.getByTestId('stat-Tổng bài đăng')).toBeInTheDocument();
    });
  });

  it('Gọi API tạo bài đăng khi submit form', async () => {
    listingService.createListing.mockResolvedValue({ listingId: 3, title: 'New' });
    listingService.getMyListings.mockResolvedValue([]);
    roomService.getAll.mockResolvedValue([
      { room_id: 1, name: 'P101', price: 3000000, is_available: true }
    ]);

    await waitFor(() => {
      expect(listingService.createListing).not.toHaveBeenCalled();
    });

    await listingService.createListing({
      roomId: 1,
      title: 'Cho thuê phòng P101',
      description: 'Phòng đẹp giá rẻ'
    });

    expect(listingService.createListing).toHaveBeenCalledWith({
      roomId: 1,
      title: 'Cho thuê phòng P101',
      description: 'Phòng đẹp giá rẻ'
    });
  });

  it('Hiển thị lỗi khi API tạo bài đăng thất bại', async () => {
    listingService.createListing.mockRejectedValue(new Error('Server error'));

    try {
      await listingService.createListing({ roomId: 1, title: 'Test', description: 'Mô tả' });
    } catch (e) {
      expect(e.message).toBe('Server error');
    }

    expect(listingService.createListing).toHaveBeenCalled();
  });

  it('Hiển thị lỗi khi API lấy danh sách thất bại', async () => {
    listingService.getMyListings.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Listings />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Lỗi khi tải danh sách bài đăng!');
    });
  });
});
