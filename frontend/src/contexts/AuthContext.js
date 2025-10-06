import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authService } from '../services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get('auth_token');
    if (token) {
      try {
        const response = await authService.getProfile();
        if (response.success) {
          setUser(response.data);
        }
      } catch (error) {
        Cookies.remove('auth_token');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    if (response.success) {
      Cookies.set('auth_token', response.data.access_token, { expires: 7 });
      setUser(response.data.user);
      return response.data;
    }
    throw new Error('Login failed');
  };

  const signup = async (email, password, full_name, role) => {
    const response = await authService.signup(email, password, full_name, role);
    if (response.success) {
      Cookies.set('auth_token', response.data.access_token, { expires: 7 });
      setUser(response.data.user);
      return response.data;
    }
    throw new Error('Signup failed');
  };

  const logout = () => {
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
