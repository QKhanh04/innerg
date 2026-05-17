import api from '../api/axios';

const authService = {
  // Register new user
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  // Login user
  async login({ emailOrUsername, password }) {
    const response = await api.post('/auth/login', {
      emailOrUsername,
      password,
    });

    // Return token and user info (will be stored in memory by AuthContext)
    return response.data;
  },

  // Login with Google
  async loginWithGoogle(idToken) {
    const response = await api.post('/auth/google-login', { idToken });
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

  // Resend verification email
  async resendVerificationEmail(email) {
    const response = await api.post('/auth/resend-verification-email',
      { email }
    );
    return response.data;
  },

  // Get current user info
  async getUserInfo(userId) {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data;
  },
};

export default authService;