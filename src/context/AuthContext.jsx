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

  // Helper function to safely access localStorage
  const safeLocalStorage = {
    getItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return localStorage.getItem(key);
        }
      } catch (error) {
        console.error('Error accessing localStorage:', error);
      }
      return null;
    },
    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('Error setting localStorage:', error);
      }
    },
    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('Error removing from localStorage:', error);
      }
    }
  };

  useEffect(() => {
    // Check if user is logged in from localStorage
    let storedUser = null;
    let _storedIsAdmin = null;
    
    storedUser = safeLocalStorage.getItem('user');
    _storedIsAdmin = safeLocalStorage.getItem('isAdmin');
    
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
        safeLocalStorage.removeItem('user');
        safeLocalStorage.removeItem('isAdmin');
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
        safeLocalStorage.setItem('user', JSON.stringify(userData));
        safeLocalStorage.setItem('isAdmin', 'false');
        return { success: true, data: userData };
      }
      
      throw new Error('Invalid response from server');
      
    } catch (error) {
      console.error('Login error:', error);
      console.error('Login error response:', error.response?.data);
      console.error('Login error status:', error.response?.status);
      
      // Handle specific status codes
      if (error.response?.status === 400) {
        // Status code 400 - Print the response
        console.log('🔴 Status Code 400 - Printing Response:');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.log('Response Headers:', error.response.headers);
        
        let errorMessage = 'Login failed. Please check your credentials.';
        
        // Extract error message from response
        if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else {
          errorMessage = `Bad Request (400): ${JSON.stringify(error.response.data)}`;
        }
        
        console.log('📤 Final 400 error message:', errorMessage);
        return { success: false, error: errorMessage };
      } else if (error.response?.status === 201) {
        // Status code 201 - Login successful
        console.log('✅ Status Code 201 - Login successful');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // Transform API response (snake_case) to frontend format (camelCase)
        const userData = {
          id: error.response.data.user_id,
          username: error.response.data.username,
          email: error.response.data.email,
          firstName: error.response.data.first_name,
          lastName: error.response.data.last_name,
          customerId: error.response.data.customer_id,
          customerName: error.response.data.customer_name,
          phone: error.response.data.phone,
          address: error.response.data.address
        };
        
        console.log('User logged in successfully (201):', userData);
        setUser(userData);
        setIsAdmin(false);
        safeLocalStorage.setItem('user', JSON.stringify(userData));
        safeLocalStorage.setItem('isAdmin', 'false');
        return { success: true, data: userData };
      } else if (error.response?.status === 200) {
        // Status code 200 - Login successful
        console.log('✅ Status Code 200 - Login successful');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // Transform API response (snake_case) to frontend format (camelCase)
        const userData = {
          id: error.response.data.user_id,
          username: error.response.data.username,
          email: error.response.data.email,
          firstName: error.response.data.first_name,
          lastName: error.response.data.last_name,
          customerId: error.response.data.customer_id,
          customerName: error.response.data.customer_name,
          phone: error.response.data.phone,
          address: error.response.data.address
        };
        
        console.log('User logged in successfully (200):', userData);
        setUser(userData);
        setIsAdmin(false);
        safeLocalStorage.setItem('user', JSON.stringify(userData));
        safeLocalStorage.setItem('isAdmin', 'false');
        return { success: true, data: userData };
      }
      
      // Handle other status codes
      let errorMessage = 'Login failed. Please check your credentials.';
      
      // Check for specific error messages from API response
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        console.log('✅ Using API error message:', errorMessage);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.log('✅ Using API message field:', errorMessage);
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        console.log('✅ Using API detail field:', errorMessage);
      } else if (error.response?.data?.errors) {
        // Handle validation errors array/object
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else if (typeof error.response.data.errors === 'object') {
          errorMessage = Object.values(error.response.data.errors).join(', ');
        } else {
          errorMessage = error.response.data.errors;
        }
        console.log('✅ Using API errors field:', errorMessage);
      } else if (error.response?.data?.non_field_errors) {
        // Handle Django non-field errors
        if (Array.isArray(error.response.data.non_field_errors)) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        } else {
          errorMessage = error.response.data.non_field_errors;
        }
        console.log('✅ Using API non_field_errors:', errorMessage);
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
        console.log('⚠️ Using generic 401 message:', errorMessage);
      } else if (error.response?.status === 404) {
        errorMessage = 'Login service not found. Please try again later.';
        console.log('⚠️ Using generic 404 message:', errorMessage);
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
        console.log('⚠️ Using generic 500 message:', errorMessage);
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
        console.log('⚠️ Using network error message:', errorMessage);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        console.log('⚠️ Using timeout error message:', errorMessage);
      } else if (error.response?.status === 0) {
        errorMessage = 'CORS error - server may not be configured properly';
        console.log('⚠️ Using CORS error message:', errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
        console.log('⚠️ Using error.message:', errorMessage);
      } else {
        errorMessage = 'Login failed. Please check your credentials.';
        console.log('⚠️ Using fallback message:', errorMessage);
      }
      
      console.log('📤 Final login error message being returned:', errorMessage);
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
        safeLocalStorage.setItem('user', JSON.stringify(userData));
        safeLocalStorage.setItem('isAdmin', 'true');
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
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      // Handle specific status codes
      if (error.response?.status === 400) {
        // Status code 400 - Print the response
        console.log('🔴 Status Code 400 - Printing Response:');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.log('Response Headers:', error.response.headers);
        
        let errorMessage = 'Signup failed. Please try again.';
        
        // Extract error message from response
        if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data?.errors) {
          // Handle validation errors array
          if (Array.isArray(error.response.data.errors)) {
            errorMessage = error.response.data.errors.join(', ');
          } else if (typeof error.response.data.errors === 'object') {
            errorMessage = Object.values(error.response.data.errors).join(', ');
          } else {
            errorMessage = error.response.data.errors;
          }
        } else if (error.response.data?.non_field_errors) {
          // Handle Django non-field errors
          if (Array.isArray(error.response.data.non_field_errors)) {
            errorMessage = error.response.data.non_field_errors.join(', ');
          } else {
            errorMessage = error.response.data.non_field_errors;
          }
        } else {
          errorMessage = `Bad Request (400): ${JSON.stringify(error.response.data)}`;
        }
        
        console.log('📤 Final 400 error message:', errorMessage);
        return { success: false, error: errorMessage };
      } else if (error.response?.status === 201) {
        // Status code 201 - Signup successful
        console.log('✅ Status Code 201 - Signup successful');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // Transform API response if user data is returned
        if (error.response.data && error.response.data.user_id) {
          const transformedData = {
            ...error.response.data,
            customerId: error.response.data.customer_id,
            userId: error.response.data.user_id
          };
          return { success: true, data: transformedData };
        }
        
        return { success: true, data: error.response.data };
      } else if (error.response?.status === 200) {
        // Status code 200 - Signup successful
        console.log('✅ Status Code 200 - Signup successful');
        console.log('Response Status:', error.response.status);
        console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // Transform API response if user data is returned
        if (error.response.data && error.response.data.user_id) {
          const transformedData = {
            ...error.response.data,
            customerId: error.response.data.customer_id,
            userId: error.response.data.user_id
          };
          return { success: true, data: transformedData };
        }
        
        return { success: true, data: error.response.data };
      }
      
      // Handle other status codes
      let errorMessage = 'Signup failed. Please try again.';
      
      // Check for specific error messages from API response
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        console.log('✅ Using API error message:', errorMessage);
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        console.log('✅ Using API message field:', errorMessage);
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
        console.log('✅ Using API detail field:', errorMessage);
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        if (Array.isArray(error.response.data.errors)) {
          errorMessage = error.response.data.errors.join(', ');
        } else if (typeof error.response.data.errors === 'object') {
          errorMessage = Object.values(error.response.data.errors).join(', ');
        } else {
          errorMessage = error.response.data.errors;
        }
        console.log('✅ Using API errors field:', errorMessage);
      } else if (error.response?.data?.non_field_errors) {
        // Handle Django non-field errors
        if (Array.isArray(error.response.data.non_field_errors)) {
          errorMessage = error.response.data.non_field_errors.join(', ');
        } else {
          errorMessage = error.response.data.non_field_errors;
        }
        console.log('✅ Using API non_field_errors:', errorMessage);
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please try again.';
        console.log('⚠️ Using generic 401 message:', errorMessage);
      } else if (error.response?.status === 403) {
        errorMessage = 'Access forbidden. Please contact support.';
        console.log('⚠️ Using generic 403 message:', errorMessage);
      } else if (error.response?.status === 404) {
        errorMessage = 'Signup service not found. Please try again later.';
        console.log('⚠️ Using generic 404 message:', errorMessage);
      } else if (error.response?.status === 409) {
        errorMessage = 'User already exists with this email or username';
        console.log('⚠️ Using generic 409 message:', errorMessage);
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data format. Please check your input.';
        console.log('⚠️ Using generic 422 message:', errorMessage);
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
        console.log('⚠️ Using generic 500 message:', errorMessage);
      } else if (error.response?.status === 502) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        console.log('⚠️ Using generic 502 message:', errorMessage);
      } else if (error.response?.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
        console.log('⚠️ Using generic 503 message:', errorMessage);
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Please check your internet connection.';
        console.log('⚠️ Using network error message:', errorMessage);
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        console.log('⚠️ Using timeout error message:', errorMessage);
      } else if (error.response?.status === 0) {
        errorMessage = 'CORS error - server may not be configured properly';
        console.log('⚠️ Using CORS error message:', errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
        console.log('⚠️ Using error.message:', errorMessage);
      } else {
        errorMessage = 'Signup failed. Please try again.';
        console.log('⚠️ Using fallback message:', errorMessage);
      }
      
      console.log('📤 Final error message being returned:', errorMessage);
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
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('isAdmin');
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsAdmin(false);
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('isAdmin');
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

