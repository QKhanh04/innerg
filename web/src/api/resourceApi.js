import api from './axios';

export const resourceApi = {
  // Fetch all accessible resources for the current company workspace
  getResources: async () => {
    const response = await api.get('/resource-hub');
    return response.data;
  }
};
