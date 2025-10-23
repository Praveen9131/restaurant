import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI } from '../services/api';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('user');
    const _storedIsAdmin = localStorage.getItem('isAdmin');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        
        // Validate user data and check if it's admin or customer
        if (parsedUser.isStaff || parsedUser.isSuperuser) {
          // This is an admin user
          setUser(parsedUser);
          setIsAdmin(true);
        } else {
          // This is a customer user
          setUser(parsedUser);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        setUser(null);
        setIsAdmin(false);
      }
    } else {
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ username: email, password });
      
      // Handle successful login
      if (response.data && response.data.message === 'Login successful') {
        // Transform API response (snake_case) to frontend format (camelCase)
        const userData = {
          id: response.data.user_id,
          username: response.data.username,
          email: response.data.email,
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          customerId: response.data.customer_id,
          customerName: response.data.customer_name,
          phone: response.data.phone,
          address: response.data.address
        };
        
        console.log('User logged in successfully:', userData);
        setUser(userData);
        setIsAdmin(false);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAdmin', 'false');
        return { success: true, data: userData };
      }
      
      throw new Error('Invalid response from server');
      
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await adminAPI.login({ username: email, password });
      
      // Handle successful admin login
      if (response.data && response.data.message === 'Login successful') {
        // Transform API response (snake_case) to frontend format (camelCase)
        const userData = {
          id: response.data.user_id,
          username: response.data.username,
          email: response.data.email,
          firstName: response.data.first_name,
          lastName: response.data.last_name,
          isStaff: response.data.is_staff,
          isSuperuser: response.data.is_superuser
        };
        
        console.log('Admin logged in successfully:', userData);
        setUser(userData);
        setIsAdmin(true);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('isAdmin', 'true');
        return { success: true, data: userData };
      }
      
      throw new Error('Invalid response from server');
      
    } catch (error) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.message || 
                         error.response?.data?.error || 
                         error.message || 
                         'Admin login failed. Please check your credentials.';
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Signup data being sent:', userData);
      const response = await authAPI.signup(userData);
      console.log('Signup response:', response.data);
      
      // Transform API response if user data is returned
      if (response.data && response.data.user_id) {
        const transformedData = {
          ...response.data,
          customerId: response.data.customer_id,
          userId: response.data.user_id
        };
        return { success: true, data: transformedData };
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Signup error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Signup failed';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (error.response?.status === 409) {
        errorMessage = 'User already exists with this email or username';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
      } else if (error.response?.status === 0) {
        errorMessage = 'CORS error - server may not be configured properly';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      if (user?.username || user?.email) {
        await authAPI.logout(user.username || user.email);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('user');
      localStorage.removeItem('isAdmin');
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    adminLogin,
    signup,
    logout,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

