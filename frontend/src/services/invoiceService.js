import api from './api';

export const invoiceService = {
  getAll: async (filters = {}) => {
    const response = await api.get('/invoices/', { params: filters });
    return response.data;
  },

  getByRentedRoom: async (rrId) => {
    const response = await api.get(`/invoices/rented-room/${rrId}`);
    return response.data;
  },

  getPending: async () => {
    const response = await api.get('/invoices/pending');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  getMy: async () => {
    const response = await api.get('/invoices/my');
    return response.data;
  },

  create: async (invoiceData) => {
    const response = await api.post('/invoices/', invoiceData);
    return response.data;
  },

  update: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  pay: async (id) => {
    const response = await api.post(`/invoices/${id}/pay`);
    return response.data;
  },

  submitProof: async (id, file, note) => {
    const formData = new FormData();
    formData.append('file', file);
    if (note) formData.append('note', note);
    const response = await api.post(`/invoices/${id}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  approveProof: async (id, note) => {
    const formData = new FormData();
    if (note) formData.append('note', note);
    const response = await api.post(`/invoices/${id}/proof/approve`, formData);
    return response.data;
  },

  declineProof: async (id, note) => {
    const formData = new FormData();
    if (note) formData.append('note', note);
    const response = await api.post(`/invoices/${id}/proof/decline`, formData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  }
};
