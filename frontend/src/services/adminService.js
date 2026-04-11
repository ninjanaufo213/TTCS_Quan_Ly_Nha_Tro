import api from './api';

export const adminService = {
  // ===== USER MANAGEMENT =====
  getAllUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  toggleUserVerification: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-verification`);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ===== LISTING APPROVAL =====
  getPendingListings: async () => {
    const response = await api.get('/admin/listings/pending');
    return response.data;
  },

  getAllListings: async () => {
    const response = await api.get('/admin/listings');
    return response.data;
  },

  approveListing: async (listingId) => {
    const response = await api.patch(`/admin/listings/${listingId}/approve`);
    return response.data;
  },

  rejectListing: async (listingId) => {
    const response = await api.patch(`/admin/listings/${listingId}/reject`);
    return response.data;
  },

  // ===== DASHBOARD STATS =====
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  getAreaDemandStats: async () => {
    const response = await api.get('/admin/stats/area-demand');
    return response.data;
  },
};

export default adminService;
