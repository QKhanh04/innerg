import React, { createContext, useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { useCallback } from 'react';
import { buildAuthUser } from '../utils/auth';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Store access token in memory only (NOT localStorage)
  const accessTokenRef = useRef(null);
  // Prevent double initialization in React.StrictMode (development only)
  const isInitialized = useRef(false);

  // Provide token to authService when needed
  const getAccessToken = useCallback(() => accessTokenRef.current, []);
  const setAccessToken = useCallback((token) => {
    accessTokenRef.current = token;
  }, []);
  const setAuthenticatedUser = useCallback((data) => {
    setAccessToken(data?.token ?? null);
    setUser(data?.token ? buildAuthUser(data) : null);
  }, [setAccessToken]);

  // Initialize auth state on mount
  useEffect(() => {
    // Prevent double call in StrictMode (development mode)
    if (isInitialized.current) {
      return;
    }
    isInitialized.current = true;

    const initAuth = async () => {
  

      try {
        console.log('🔄 Attempting to refresh token...');
        // Try to get new token from refresh token cookie
        const data = await authService.refreshToken();
        
        if (data && data.token) {
          setAuthenticatedUser(data);
        }
      } catch {
        // No valid refresh token - user needs to login
        // This is normal for first visit or expired session
        console.log(' No valid refresh token - user not authenticated');
        setAuthenticatedUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuthenticatedUser]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    
    setAuthenticatedUser(data);
    
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const data = await authService.loginWithGoogle(idToken);
    setAuthenticatedUser(data);
    return data;
  };

  const register = async (userData) => {
    return await authService.register(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      // Clear token from memory
      setAuthenticatedUser(null);
    }
  };

  const verifyEmail = async (userId, token) => {
    return await authService.verifyEmail(userId, token);
  };

  const resendVerificationEmail = async (email) => {
    return await authService.resendVerificationEmail(email);
  };

  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  const resetPassword = async (data) => {
    return await authService.resetPassword(data);
  };

  const refreshAccessToken = async () => {

    try {
      const data = await authService.refreshToken();
      setAuthenticatedUser(data);
      return data.token;
    } catch (error) {
      // Refresh failed - logout user
      setAuthenticatedUser(null);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    getAccessToken,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
