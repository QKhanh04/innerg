import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:7027/api';
const PUBLIC_ENDPOINTS = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh-token',
    '/auth/verify-email',
  ];

  const isPublicEndpoint = (url) =>
    PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Store reference to getAccessToken and refreshAccessToken functions
let getAccessToken = null;
let refreshAccessToken = null;

// Queue to store failed requests while refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Setup token handlers (called from AuthContext)
export const setupInterceptors = (getTokenFn, refreshTokenFn) => {
  
  getAccessToken = getTokenFn;
  refreshAccessToken = refreshTokenFn;
};

// Request interceptor - add token to headers
api.interceptors.request.use(
  (config) => {
    if (getAccessToken) {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (isPublicEndpoint(originalRequest.url)) {
      return Promise.reject(error);
    }
    // If error is not 401 or is a refresh-token request, reject immediately
    if (error.response?.status !== 401 || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // If we already retried this request, give up
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    // No refresh function available - fail immediately
    if (!refreshAccessToken) {
      processQueue(error, null);
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();

      // Process all queued requests with new token
      processQueue(null, newToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed - process queue with error
      processQueue(refreshError, null);

      // Let AuthContext handle logout/redirect
      // (avoid direct window.location manipulation in interceptor)

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;