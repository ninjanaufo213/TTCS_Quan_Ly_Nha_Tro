import api from './api';

export const tenantService = {
  lookup: async (search = '') => {
    const response = await api.get('/tenants/lookup', {
      params: search ? { search } : {}
    });
    return response.data;
  }
};

