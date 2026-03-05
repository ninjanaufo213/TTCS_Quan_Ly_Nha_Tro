import '@testing-library/jest-dom';
// Fix lỗi Ant Design v5 CSS-in-JS trong Jest
import { createCache, StyleProvider } from '@ant-design/cssinjs';

// Mock hệ thống lưu trữ style của Antd
global.antdCache = createCache();

// Giả lập thêm các hàm còn thiếu của trình duyệt
window.scrollTo = jest.fn();
// Mock matchMedia (Antd cần)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 2. Fix ResizeObserver (Antd v5 cần cái này để tính toán layout)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// 3. Fix computedStyle (Đôi khi JSDOM tính toán sai style của Antd)
const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

// 4. Mock các hàm animation frame (Để tránh lỗi act() khi Antd đóng/mở thông báo)
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);