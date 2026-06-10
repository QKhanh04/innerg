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

  async bulkUpdateCompanyStatus(companyIds, isActive) {
    await api.patch('/admin/companies/bulk-status', { companyIds, isActive });
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

  async createSubscriptionPlan(payload) {
    const response = await api.post('/admin/subscription-plans', payload);
    return response.data;
  },

  async updateSubscriptionPlan(planId, payload) {
    const response = await api.patch(`/admin/subscription-plans/${planId}`, payload);
    return response.data;
  },

  async deleteSubscriptionPlan(planId) {
    await api.delete(`/admin/subscription-plans/${planId}`);
  },

  async assignSubscription(companyId, payload) {
    await api.post(`/admin/companies/${companyId}/subscription`, payload);
  },

  async getBillingRecords(companyId = null) {
    const response = await api.get('/admin/billing-records', { params: companyId ? { companyId } : {} });
    return response.data;
  },

  async createBillingRecord(companyId, payload = {}) {
    const response = await api.post(`/admin/companies/${companyId}/billing-records`, payload);
    return response.data;
  },

  async updateBillingRecordStatus(billingRecordId, payload) {
    await api.patch(`/admin/billing-records/${billingRecordId}/status`, payload);
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

  async warnUser(userId, reason) {
    await api.post(`/admin/moderation/users/${userId}/warn`, { reason });
  },

  async deleteModerationResource(resourceId, reason) {
    await api.delete(`/admin/moderation/resources/${resourceId}`, { data: { reason } });
  },

  async deleteModerationEvent(eventId, reason) {
    await api.delete(`/admin/moderation/events/${eventId}`, { data: { reason } });
  },

  async dismissModerationReport(reportId, reason) {
    await api.post(`/admin/moderation/reports/${reportId}/dismiss`, { reason });
  },

  async updatePlatformSettings(payload) {
    const response = await api.patch('/admin/platform-settings', payload);
    return response.data;
  },
};

export default adminService;
