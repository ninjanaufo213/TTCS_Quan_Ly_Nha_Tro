const createMockApiClient = () => ({
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
});

const axios = {
  create: jest.fn(() => createMockApiClient()),
};

module.exports = axios;
