import api from './api';

export const assetService = {
  getByRoom: async (roomId) => {
    const response = await api.get(`/assets/room/${roomId}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },

  create: async (roomId, assetData) => {
    const formData = new FormData();
    formData.append('name', assetData.name);
    if (assetData.image) {
      formData.append('image', assetData.image);
    }
    const response = await api.post(`/assets/${roomId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id, assetData) => {
    const formData = new FormData();
    formData.append('name', assetData.name);
    if (assetData.image) {
      formData.append('image', assetData.image);
    }
    const response = await api.put(`/assets/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/assets/${id}`);
    return response.data;
  }
};
