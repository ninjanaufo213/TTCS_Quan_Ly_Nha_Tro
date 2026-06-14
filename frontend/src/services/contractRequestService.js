import api from './api';

const normalizeContractRequest = (item) => {
  if (!item) return item;
  return {
    contractRequestId: item.contractRequestId ?? item.contract_request_id,
    requestId: item.requestId ?? item.request_id,
    roomId: item.roomId ?? item.room_id,
    roomName: item.roomName ?? item.room_name,
    houseName: item.houseName ?? item.house_name,
    tenantName: item.tenantName ?? item.tenant_name,
    tenantPhone: item.tenantPhone ?? item.tenant_phone,
    numberOfTenants: item.numberOfTenants ?? item.number_of_tenants,
    startDate: item.startDate ?? item.start_date,
    endDate: item.endDate ?? item.end_date,
    monthlyRent: item.monthlyRent ?? item.monthly_rent,
    deposit: item.deposit,
    waterPrice: item.waterPrice ?? item.water_price,
    internetPrice: item.internetPrice ?? item.internet_price,
    generalPrice: item.generalPrice ?? item.general_price,
    initialElectricityNum: item.initialElectricityNum ?? item.initial_electricity_num,
    electricityUnitPrice: item.electricityUnitPrice ?? item.electricity_unit_price,
    contractUrl: item.contractUrl ?? item.contract_url,
    landlordSignature: item.landlordSignature ?? item.landlord_signature,
    tenantSignature: item.tenantSignature ?? item.tenant_signature,
    landlordSignedAt: item.landlordSignedAt ?? item.landlord_signed_at,
    tenantSignedAt: item.tenantSignedAt ?? item.tenant_signed_at,
    status: item.status,
    createdAt: item.createdAt ?? item.created_at,
  };
};

const normalizeList = (data) => (Array.isArray(data) ? data.map(normalizeContractRequest) : data);

export const contractRequestService = {
  createForViewing: async (viewingId, payload) => {
    const response = await api.post(`/landlord/viewings/${viewingId}/contract-request`, payload);
    return normalizeContractRequest(response.data);
  },

  getLandlordRequests: async () => {
    const response = await api.get('/landlord/contract-requests');
    return normalizeList(response.data);
  },

  getTenantRequests: async () => {
    const response = await api.get('/tenant/contract-requests');
    return normalizeList(response.data);
  },

  confirm: async (id, signRequest = null) => {
    const response = await api.patch(`/tenant/contract-requests/${id}/confirm`, signRequest);
    return normalizeContractRequest(response.data);
  },

  cancel: async (id) => {
    const response = await api.patch(`/tenant/contract-requests/${id}/cancel`);
    return normalizeContractRequest(response.data);
  }
};

export default contractRequestService;

