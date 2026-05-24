import React, { useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { useCallback } from 'react';
import { buildAuthUser } from '../utils/auth';
import { AuthContext } from './AuthContextBase';

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
    if (!data) {
      setAccessToken(null);
      setUser(null);
      return false;
    }

    if (!data?.token || data.requiresWorkspaceSelection || data.requiresTwoFactor) {
      return false;
    }

    setAccessToken(data.token);
    setUser(buildAuthUser(data));
    return true;
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
        
        setAuthenticatedUser(data);
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

  const loginWithGoogle = async (idToken, companyId = null) => {
    const data = await authService.loginWithGoogle(idToken, companyId);
    setAuthenticatedUser(data);
    return data;
  };

  const acceptInvite = async (userData) => {
    const data = await authService.acceptInvite(userData);
    setAuthenticatedUser(data);
    return data;
  };

  const getInvite = async (token) => {
    return await authService.getInvite(token);
  };

  const createInvite = async (inviteData) => {
    return await authService.createInvite(inviteData);
  };

  const createBulkInvites = async (bulkInviteData) => {
    return await authService.createBulkInvites(bulkInviteData);
  };

  const resendInvite = async (inviteId) => {
    return await authService.resendInvite(inviteId);
  };

  const revokeInvite = async (inviteId) => {
    return await authService.revokeInvite(inviteId);
  };

  const createCompany = async (companyData) => {
    return await authService.createCompany(companyData);
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

  const sendTwoFactorEnableCode = async () => {
    return await authService.sendTwoFactorEnableCode();
  };

  const enableTwoFactor = async (data) => {
    return await authService.enableTwoFactor(data);
  };

  const disableTwoFactor = async (data) => {
    return await authService.disableTwoFactor(data);
  };

  const getSessions = async () => {
    return await authService.getSessions();
  };

  const revokeSession = async (sessionId) => {
    return await authService.revokeSession(sessionId);
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
    acceptInvite,
    getInvite,
    createInvite,
    createBulkInvites,
    resendInvite,
    revokeInvite,
    createCompany,
    logout,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    sendTwoFactorEnableCode,
    enableTwoFactor,
    disableTwoFactor,
    getSessions,
    revokeSession,
    isAuthenticated: !!user,
    getAccessToken,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
