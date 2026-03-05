import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // FIX LỖI: toBeInTheDocument
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { authService } from '../services/authService';

// Tạo các hàm mock sẵn để có thể kiểm tra (expect)
const mockMessageSuccess = jest.fn();
const mockMessageError = jest.fn();
const mockNavigate = jest.fn();

// 1. MOCK ANTD TRUNG THỰC HƠN
jest.mock('antd', () => {
  const React = require('react');
  return {
    ...jest.requireActual('antd'),
    App: {
      useApp: () => ({
        message: { success: mockMessageSuccess, error: mockMessageError }
      })
    },
    // Mock Form để nó chạy onFinish khi submit
    Form: Object.assign(
      ({ children, onFinish }) => (
        <form data-testid="form" onSubmit={(e) => {
          e.preventDefault();
          // Giả lập giá trị email và pass vì chúng ta dùng mock input thuần
          onFinish({ email: 'test@gmail.com', password: 'password123' });
        }}>{children}</form>
      ),
      { Item: ({ children }) => <div>{children}</div> }
    ),
    Input: Object.assign(
      (props) => <input {...props} onChange={(e) => props.onChange?.(e)} />,
      { Password: (props) => <input type="password" {...props} onChange={(e) => props.onChange?.(e)} /> }
    ),
    Button: ({ children, loading, ...props }) => (
      <button {...props} type={props.htmlType === 'submit' ? 'submit' : 'button'}>{children}</button>
    ),
    Typography: { Title: ({ children }) => <h2>{children}</h2> },
    Card: ({ children }) => <div>{children}</div>,
  };
});

// 2. MOCK ROUTER & SERVICE
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/authService', () => ({
  authService: { login: jest.fn() },
}));

describe('Trang Đăng nhập (Login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Hiển thị đầy đủ các trường nhập liệu và nút bấm', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
  });

  it('Đăng nhập thành công và điều hướng tới Dashboard', async () => {
    authService.login.mockResolvedValue({ status: 200 });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // Điền thông tin
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { target: { value: 'test@gmail.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Mật khẩu/i), { target: { value: 'password123' } });
    
    // Click nút submit
    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@gmail.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(mockMessageSuccess).toHaveBeenCalledWith('Đăng nhập thành công!');
    });
  });

  it('Hiển thị lỗi khi thông tin đăng nhập sai', async () => {
    authService.login.mockRejectedValue(new Error('Unauthorized'));

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }));

    await waitFor(() => {
      expect(mockMessageError).toHaveBeenCalledWith('Email hoặc mật khẩu không đúng!');
    });
  });
});