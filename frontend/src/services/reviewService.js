import api from './api';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

export const reviewService = {
  getRoomReviews: async (roomId) => {
    const response = await axios.get(`${BASE_URL}/rooms/${roomId}/reviews`);
    return response.data;
  },

  getMyReview: async (roomId) => {
    const response = await api.get(`/tenant/rooms/${roomId}/review`);
    return response.data;
  },

  saveMyReview: async (roomId, data) => {
    const response = await api.post(`/tenant/rooms/${roomId}/review`, data);
    return response.data;
  },

  getLandlordReviews: async () => {
    const response = await api.get('/landlord/reviews');
    return response.data;
  },

  replyToReview: async (reviewId, data) => {
    const response = await api.patch(`/landlord/reviews/${reviewId}/reply`, data);
    return response.data;
  },
};
