import api from './axios';

export const exploreApi = {
  // Get all active/published classes for the marketplace
  getExploreClasses: async () => {
    const response = await api.get('/explore');
    return response.data;
  },

  // Register for a class
  registerClass: async (eventId) => {
    const response = await api.post(`/explore/${eventId}/register`);
    return response.data;
  },

  // Unregister/cancel registration for a class
  unregisterClass: async (eventId) => {
    const response = await api.delete(`/explore/${eventId}/unregister`);
    return response.data;
  },

  // Get details for a specific class/workshop
  getClassDetail: async (eventId) => {
    const response = await api.get(`/explore/${eventId}`);
    return response.data;
  },

  // Get mentee dashboard aggregated data
  getMenteeDashboard: async () => {
    const response = await api.get('/explore/mentee-dashboard');
    return response.data;
  },

  // Get personal schedule (timeline/calendar events)
  getPersonalSchedule: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get('/schedule', { params });
    return response.data;
  }
};
