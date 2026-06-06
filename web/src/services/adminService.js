import api from '../api/axios';

const adminService = {
  async getOverview() {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  async getCompanies() {
    const response = await api.get('/admin/companies');
    return response.data;
  },

  async getCompanyDetail(companyId) {
    const response = await api.get(`/admin/companies/${companyId}`);
    return response.data;
  },

  async updateCompanyStatus(companyId, isActive) {
    await api.patch(`/admin/companies/${companyId}/status`, { isActive });
  },

  async updateCompany(companyId, payload) {
    await api.patch(`/admin/companies/${companyId}`, payload);
  },

  async deleteCompany(companyId) {
    await api.delete(`/admin/companies/${companyId}`);
  },

  async getSubscriptionPlans() {
    const response = await api.get('/admin/subscription-plans');
    return response.data;
  },

  async assignSubscription(companyId, payload) {
    await api.post(`/admin/companies/${companyId}/subscription`, payload);
  },

  async getAuditLogs(params = 50) {
    const query = typeof params === 'number' ? { take: params } : params;
    const response = await api.get('/admin/audit-logs', { params: query });
    return response.data;
  },

  async exportAuditLogs(params = {}) {
    const response = await api.get('/admin/audit-logs/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async getModerationQueue() {
    const response = await api.get('/admin/moderation');
    return response.data;
  },

  async lockUser(userId, reason) {
    await api.post(`/admin/moderation/users/${userId}/lock`, { reason });
  },

  async deleteModerationResource(resourceId, reason) {
    await api.delete(`/admin/moderation/resources/${resourceId}`, { data: { reason } });
  },

  async deleteModerationEvent(eventId, reason) {
    await api.delete(`/admin/moderation/events/${eventId}`, { data: { reason } });
  },

  async updatePlatformSettings(payload) {
    const response = await api.patch('/admin/platform-settings', payload);
    return response.data;
  },
};

export default adminService;
