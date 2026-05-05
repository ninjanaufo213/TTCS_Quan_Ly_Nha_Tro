import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token and user email to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  const storedEmail = localStorage.getItem('user_email');
  let userEmail = storedEmail;

  if (!userEmail) {
    try {
      const userInfo = JSON.parse(localStorage.getItem('user_info') || 'null');
      userEmail = userInfo?.email || null;
    } catch (e) {
      userEmail = null;
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (userEmail) config.headers['X-User-Email'] = userEmail;

  return config;
});

// Handle 401 errors (auto logout except login page)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && !error?.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

