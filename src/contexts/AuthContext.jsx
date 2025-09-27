import { createContext, useContext, useEffect, useState } from 'react';
import api from '@/services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Set the token in API headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Verify token validity with backend
        const isValid = await checkAuth();
        if (!isValid) {
          // checkAuth will handle logout if token is invalid
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Auth initialization failed:', error);
        logout();
      }
    };

    initAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;

      if (!userData) {
        throw new Error('No user data received');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      
      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set up API
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    // Clear all stored data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear API configuration
    delete api.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setLoading(false);
  };

  const isAdmin = () => user?.role === 'admin';
  const isSubAdmin = () => user?.role === 'sub_admin';
  const canAccessAdmin = () => isAdmin() || isSubAdmin();

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isSubAdmin, canAccessAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
