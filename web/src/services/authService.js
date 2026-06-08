import api from '../api/axios';

const authService = {
  async acceptInvite(data) {
    const response = await api.post('/auth/accept-invite', data);
    return response.data;
  },

  async getInvite(token) {
    const response = await api.get(`/auth/invites/${encodeURIComponent(token)}`);
    return response.data;
  },

  async createInvite(data) {
    const response = await api.post('/auth/invites', data);
    return response.data;
  },

  async createBulkInvites(data) {
    const response = await api.post('/auth/invites/bulk', data);
    return response.data;
  },

  async resendInvite(inviteId) {
    const response = await api.post(`/auth/invites/${inviteId}/resend`);
    return response.data;
  },

  async revokeInvite(inviteId) {
    await api.post(`/auth/invites/${inviteId}/revoke`);
  },

  async bootstrapCompany(data) {
    const response = await api.post('/auth/bootstrap-company', data);
    return response.data;
  },

  async createCompany(data) {
    const response = await api.post('/auth/companies', data);
    return response.data;
  },

  // Login user
  async login({ emailOrUsername, password, companyId = null, twoFactorCode = null }) {
    const response = await api.post('/auth/login', {
      emailOrUsername,
      password,
      companyId,
      twoFactorCode,
    });

    // Return token and user info (will be stored in memory by AuthContext)
    return response.data;
  },

  // Login with Google
  async loginWithGoogle(idToken, companyId = null) {
    const response = await api.post('/auth/google-login', { idToken, companyId });
    return response.data;
  },

  // Logout user
  async logout() {
    await api.post('/auth/logout');
    // Token cleanup handled by AuthContext
  },

  // Refresh access token
  async refreshToken() {
    const response = await api.post('/auth/refresh-token');
    // Return new token and user info
    return response.data;
  },

  // Verify email
  async verifyEmail(userId, token) {
    const response = await api.get('/auth/verify-email', {
      params: { userId, token },
    });
    return response.data;
  },

  async forgotPassword(data) {
    const response = await api.post('/auth/forgot-password', typeof data === 'string' ? { email: data } : data);
    return response.data;
  },

  async resetPassword(data) {
    await api.post('/auth/reset-password', data);
  },

  async sendTwoFactorEnableCode() {
    await api.post('/auth/2fa/send-enable-code');
  },

  async enableTwoFactor(data) {
    await api.post('/auth/2fa/enable', data);
  },

  async disableTwoFactor(data) {
    await api.post('/auth/2fa/disable', data);
  },

  async getSessions() {
    const response = await api.get('/auth/sessions');
    return response.data;
  },

  async revokeSession(sessionId) {
    await api.post(`/auth/sessions/${sessionId}/revoke`);
  },

  // Resend verification email
  async resendVerificationEmail(email) {
    const response = await api.post('/auth/resend-verification-email',
      JSON.stringify(email)
    );
    return response.data;
  },

  // Get current user info
  async getUserInfo(userId) {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },

  // Update current user profile
  async updateProfile(userId, profileData) {
    const response = await api.patch(`/auth/users/${userId}`, profileData);
    return response.data;
  },

  // Change password for current user
  async changePassword(passwordData) {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },
};

export default authService;
