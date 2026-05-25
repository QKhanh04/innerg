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

  async getAuditLogs(take = 50) {
    const response = await api.get('/admin/audit-logs', { params: { take } });
    return response.data;
  },
};

export default adminService;
