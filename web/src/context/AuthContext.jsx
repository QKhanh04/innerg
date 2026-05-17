import React, { createContext, useState, useEffect, useRef } from 'react';
import authService from '../services/authService';
import { useCallback } from 'react';

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
          setAccessToken(data.token);
          setUser({
            userName: data.userName,
            email: data.email,
          });
        }
      } catch (error) {
        // No valid refresh token - user needs to login
        // This is normal for first visit or expired session
        console.log(' No valid refresh token - user not authenticated');
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    
    // Store token in memory
    setAccessToken(data.token);
    setUser({
      userName: data.userName,
      email: data.email,
    });
    
    return data;
  };

  const loginWithGoogle = async (idToken) => {
    const data = await authService.loginWithGoogle(idToken);
    setAccessToken(data.token);
    setUser({
      userName: data.userName,
      email: data.email,
    });
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
      setAccessToken(null);
      setUser(null);
    }
  };

  const verifyEmail = async (userId, token) => {
    return await authService.verifyEmail(userId, token);
  };

  const resendVerificationEmail = async (email) => {
    return await authService.resendVerificationEmail(email);
  };

  const refreshAccessToken = async () => {

    try {
      const data = await authService.refreshToken();
      setAccessToken(data.token);
      setUser({
        userName: data.userName,
        email: data.email,
      });
      return data.token;
    } catch (error) {
      // Refresh failed - logout user
      setAccessToken(null);
      setUser(null);
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
    isAuthenticated: !!user,
    getAccessToken,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
