import api from './api';

const normalizeViewing = (item) => {
  if (!item) return item;
  return {
    requestId: item.requestId ?? item.request_id,
    roomId: item.roomId ?? item.room_id,
    roomName: item.roomName ?? item.room_name,
    houseName: item.houseName ?? item.house_name,
    addressLine: item.addressLine ?? item.address_line,
    tenantName: item.tenantName ?? item.tenant_name,
    tenantPhone: item.tenantPhone ?? item.tenant_phone,
    landlordName: item.landlordName ?? item.landlord_name,
    landlordPhone: item.landlordPhone ?? item.landlord_phone,
    visitDate: item.visitDate ?? item.visit_date,
    visitTime: item.visitTime ?? item.visit_time,
    status: item.status,
    createdAt: item.createdAt ?? item.created_at,
  };
};

const normalizeList = (data) => (Array.isArray(data) ? data.map(normalizeViewing) : data);

export const viewingService = {
  createViewing: async (payload) => {
    const normalized = {
      room_id: payload?.room_id ?? payload?.roomId,
      visit_date: payload?.visit_date ?? payload?.visitDate,
      visit_time: payload?.visit_time ?? payload?.visitTime
    };
    const response = await api.post('/viewings', normalized);
    return normalizeViewing(response.data);
  },

  getMyViewings: async () => {
    const response = await api.get('/viewings/me');
    return normalizeList(response.data);
  },

  cancelMyViewing: async (id) => {
    const response = await api.patch(`/viewings/${id}/cancel`);
    return normalizeViewing(response.data);
  },

  getLandlordViewings: async () => {
    const response = await api.get('/landlord/viewings');
    return normalizeList(response.data);
  },

  approveLandlordViewing: async (id) => {
    const response = await api.patch(`/landlord/viewings/${id}/approve`);
    return normalizeViewing(response.data);
  },

  rejectLandlordViewing: async (id) => {
    const response = await api.patch(`/landlord/viewings/${id}/reject`);
    return normalizeViewing(response.data);
  },

  cancelLandlordViewing: async (id) => {
    const response = await api.patch(`/landlord/viewings/${id}/cancel`);
    return normalizeViewing(response.data);
  }
};

export default viewingService;
