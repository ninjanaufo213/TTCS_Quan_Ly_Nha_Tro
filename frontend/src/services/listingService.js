import api from './api';

export const listingService = {
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
