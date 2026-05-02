import api from './api';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const listingService = {
  getPublicListings: async () => {
    const response = await axios.get(`${BASE_URL}/listings`);
    return response.data;
  },

  searchPublicListings: async (params) => {
    const response = await axios.get(`${BASE_URL}/listings/search`, { params });
    return response.data;
  },

  createListing: async (data) => {
    const response = await api.post('/landlord/listings', data);
    return response.data;
  },

  getMyListings: async () => {
    const response = await api.get('/landlord/listings');
    return response.data;
  },

  deleteListing: async (id) => {
    const response = await api.delete(`/landlord/listings/${id}`);
    return response.data;
  }
};
