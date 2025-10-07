import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services';
import { createLogger } from '../lib/logger';

const AuthContext = createContext(null);
const logger = createLogger('Auth');

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    logger.debug('Checking authentication status');
    const token = Cookies.get('auth_token');
    if (token) {
      try {
        logger.debug('Token found, fetching user profile');
        const response = await authService.getProfile();
        if (response.success) {
          logger.info('User authenticated successfully');
          setUser(response.data);
        }
      } catch (error) {
        logger.warn('Auth token invalid, removing', error);
        Cookies.remove('auth_token');
      }
    } else {
      logger.debug('No auth token found');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      logger.info('Login attempt', { email });
      const response = await authService.login(email, password);
      if (response.success) {
        logger.info('Login successful', { userId: response.data.user.id, role: response.data.user.role });
        Cookies.set('auth_token', response.data.access_token, { expires: 7 });
        setUser(response.data.user);
        return response.data;
      }
      logger.warn('Login failed with valid response but success=false');
      throw new Error('Login failed');
    } catch (error) {
      logger.error('Login error', error);
      throw error;
    }
  };

  const signup = async (email, password, full_name, role) => {
    try {
      logger.info('Signup attempt', { email, role });
      const response = await authService.signup(email, password, full_name, role);
      if (response.success) {
        logger.info('Signup successful', { userId: response.data.user.id, role: response.data.user.role });
        Cookies.set('auth_token', response.data.access_token, { expires: 7 });
        setUser(response.data.user);
        return response.data;
      }
      logger.warn('Signup failed with valid response but success=false');
      throw new Error('Signup failed');
    } catch (error) {
      logger.error('Signup error', error);
      throw error;
    }
  };

  const logout = () => {
    logger.info('User logged out', user ? { userId: user.id, role: user.role } : {});
    Cookies.remove('auth_token');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
