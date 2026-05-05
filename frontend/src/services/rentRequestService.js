import api from './api';

export const rentRequestService = {
  // Tenant gửi yêu cầu xem phòng
  create: async (data) => {
    const response = await api.post('/tenant/rent-requests', data);
    return response.data;
  },

  // Landlord lấy danh sách yêu cầu
  getLandlordRequests: async () => {
    const response = await api.get('/landlord/rent-requests');
    return response.data;
  },

  // Landlord cập nhật trạng thái
  updateStatus: async (id, status) => {
    const response = await api.patch(`/landlord/rent-requests/${id}/status`, { status });
    return response.data;
  },
};
