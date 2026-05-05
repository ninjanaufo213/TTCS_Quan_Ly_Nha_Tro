import api from './api';

export const notificationService = {
  getMyNotifications: async () => {
    const response = await api.get('/notifications/me');
    return response.data;
  },

  markRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }
};

export default notificationService;

