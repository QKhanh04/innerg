import api from './axios';

export const membersApi = {
  getList: async (filters = {}) => {
    const response = await api.get('/hr/members', { params: filters });
    return response.data;
  },
  
  getDetail: async (userId) => {
    const response = await api.get(`/hr/members/${userId}`);
    return response.data;
  },
  
  update: async (userId, data) => {
    const response = await api.patch(`/hr/members/${userId}`, data);
    return response.data;
  },
  
  assignMentor: async (userId) => {
    const response = await api.post(`/hr/members/${userId}/roles/mentor`);
    return response.data;
  },
  
  revokeMentor: async (userId) => {
    const response = await api.delete(`/hr/members/${userId}/roles/mentor`);
    return response.data;
  },
  
  updateStatus: async (userId, status) => {
    const response = await api.patch(`/hr/members/${userId}/status`, { status });
    return response.data;
  },
  
  delete: async (userId) => {
    const response = await api.delete(`/hr/members/${userId}`);
    return response.data;
  }
};
