import api from './api';

const normalizeExtensionRequest = (item) => {
  if (!item) return item;
  return {
    extensionRequestId: item.extensionRequestId ?? item.extension_request_id,
    rentedRoomId: item.rentedRoomId ?? item.rented_room_id,
    roomId: item.roomId ?? item.room_id,
    roomName: item.roomName ?? item.room_name,
    houseName: item.houseName ?? item.house_name,
    tenantName: item.tenantName ?? item.tenant_name,
    tenantPhone: item.tenantPhone ?? item.tenant_phone,
    currentEndDate: item.currentEndDate ?? item.current_end_date,
    requestedEndDate: item.requestedEndDate ?? item.requested_end_date,
    status: item.status,
    createdAt: item.createdAt ?? item.created_at,
  };
};

const normalizeList = (data) => (Array.isArray(data) ? data.map(normalizeExtensionRequest) : data);

export const contractExtensionRequestService = {
  create: async (payload) => {
    const response = await api.post('/tenant/contract-extensions', {
      rented_room_id: payload.rentedRoomId ?? payload.rented_room_id,
      requested_end_date: payload.requestedEndDate ?? payload.requested_end_date,
    });
    return normalizeExtensionRequest(response.data);
  },

  getTenantRequests: async () => {
    const response = await api.get('/tenant/contract-extensions');
    return normalizeList(response.data);
  },

  getLandlordRequests: async () => {
    const response = await api.get('/landlord/contract-extensions');
    return normalizeList(response.data);
  },

  approve: async (id) => {
    const response = await api.patch(`/landlord/contract-extensions/${id}/approve`);
    return normalizeExtensionRequest(response.data);
  },

  reject: async (id) => {
    const response = await api.patch(`/landlord/contract-extensions/${id}/reject`);
    return normalizeExtensionRequest(response.data);
  },
};

export default contractExtensionRequestService;
