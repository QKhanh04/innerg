import api from './axios';

export const wishlistApi = {
  // Get all wishlist items for the tenant
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  // Create a new learning wishlist request
  createRequest: async (requestData) => {
    const response = await api.post('/wishlist', requestData);
    return response.data;
  },

  // Toggle upvote on a wishlist proposal
  toggleVote: async (wishlistId) => {
    const response = await api.post(`/wishlist/${wishlistId}/vote`);
    return response.data;
  }
};
