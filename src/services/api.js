import axios from 'axios';

// Configure your backend API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.seasidelbs.com';

// Check if we're in development mode
const _isDevelopment = import.meta.env.DEV;
const _isProduction = import.meta.env.PROD;

// Debug API configuration (only in development)
if (_isDevelopment) {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    isDevelopment: _isDevelopment,
    isProduction: _isProduction,
    env: import.meta.env.MODE
  });
}

// Security headers for production
const getSecurityHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (_isProduction) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
  }
  
  return headers;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: _isProduction ? 10000 : 15000, // Shorter timeout in production
  headers: getSecurityHeaders(),
  withCredentials: false, // Disable to prevent CORS issues
  // Security configurations
  maxRedirects: 3,
  validateStatus: (status) => status >= 200 && status < 300,
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID for tracking
    config.metadata = { startTime: Date.now() };
    
    // Log request details (only in development)
    if (_isDevelopment) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        data: config.data,
        params: config.params,
      });
    }
    
    return config;
  },
  (error) => {
    if (_isDevelopment) {
      console.error('[API] Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and logging
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = response.config.metadata ? Date.now() - response.config.metadata.startTime : 0;
    
    // Log response details (only in development)
    if (_isDevelopment) {
      console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
        data: response.data,
      });
    }
    
    return response;
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      const errorDetails = {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        method: error.config?.method,
        timeout: error.config?.timeout
      };
      
      console.error('[API] Network Error:', errorDetails);
      
      // Provide more specific error messages based on the error type
      let userMessage = 'Unable to connect to server. Please check your internet connection or try again later.';
      
      if (error.code === 'ECONNABORTED') {
        userMessage = 'Request timed out. The server is taking too long to respond.';
      } else if (error.code === 'ERR_NETWORK') {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('CORS')) {
        userMessage = 'CORS error. Please contact support if this persists.';
      } else if (error.message.includes('Failed to fetch')) {
        userMessage = 'Failed to connect to server. Please check if the server is running.';
      }
      
      const networkError = new Error(userMessage);
      networkError.isNetworkError = true;
      networkError.originalError = error.message;
      networkError.code = error.code;
      networkError.details = errorDetails;
      return Promise.reject(networkError);
    }

    const errorResponse = error.response || {};
    const errorData = errorResponse.data || {};
    const errorMessage = errorData.message || error.message || 'An unknown error occurred';
    const status = errorResponse.status;

    console.error(`[API] Error ${status} ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, {
      error: errorMessage,
      response: errorResponse.data,
      status: status,
    });

    // Handle specific error statuses
    if (status === 401) {
      // Handle unauthorized (token expired, invalid, etc.)
      localStorage.removeItem('authToken');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?session=expired';
      }
    }

    // Create a more detailed error object
    const apiError = new Error(errorMessage);
    apiError.status = status;
    apiError.data = errorData;
    apiError.isAxiosError = true;
    
    return Promise.reject(apiError);
  }
);

// Customer/User Authentication APIs (different from Admin)
export const authAPI = {
  signup: (userData) => {
    const fullUrl = `${API_BASE_URL}/signup/`;
    console.log('🔵 [API] Calling signup endpoint:', fullUrl);
    console.log('🔵 [API] Signup data:', userData);
    return api.post('/signup/', userData)
      .then(response => {
        console.log('✅ [API] Signup successful:', response.data);
        // Store token if present in response
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        return response;
      })
      .catch(error => {
        console.error('❌ [API] Signup failed:', error);
        console.error('❌ [API] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      });
  },
  login: (credentials) => {
    console.log('🔵 [API] Calling login endpoint:', `${API_BASE_URL}/login/`);
    return api.post('/login/', credentials)
      .then(response => {
        console.log('✅ [API] Login successful:', response.data);
        // Store token if present in response
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
        }
        return response;
      });
  },
  logout: (username) => {
    localStorage.removeItem('authToken');
    return api.post('/logout/', { username });
  },
  forgotPassword: (email) => {
    return api.post('/forgot-password/', { email });
  },
  resetPassword: (data) => {
    console.log('🔵 [API] Calling reset-password endpoint with data:', { ...data, token: data.token?.substring(0, 10) + '...' });
    return api.post('/reset-password/', data);
  },
  changePassword: (data) => {
    console.log('🔵 [API] Calling change-password endpoint:', `${API_BASE_URL}/change-password/`);
    console.log('🔵 [API] Change password data:', data);
    return api.post('/change-password/', data)
      .then(response => {
        console.log('✅ [API] Change password successful:', response.data);
        return response;
      })
      .catch(error => {
        console.error('❌ [API] Change password failed:', error);
        console.error('❌ [API] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        throw error;
      });
  },
  getProfile: () => {
    return api.get('/profile/');
  },
  updateProfile: (userData) => {
    return api.put('/profile/', userData);
  }
};

// Admin Authentication
export const adminAPI = {
  createAdmin: (data) => {
    console.log('AdminAPI: Creating admin with data:', data);
    return api.post('/create-admin/', data);
  },
  login: (data) => {
    console.log('AdminAPI: Admin login request to /Owner-Login/ with data:', data);
    return api.post('/Owner-Login/', data);
  },
  getDashboard: async () => {
    console.log('🔍 [API] Calling getDashboard');
    
    const response = await api.get('/Dashboard/');
    console.log('✅ [API] getDashboard success:', response.status);
    return response;
  },

  getOrdersByCustomer: async () => {
    console.log('🔍 [API] Calling getOrdersByCustomer');
    
    const response = await api.get('/OrdersByCustomerView/');
    console.log('✅ [API] getOrdersByCustomer success:', response.status);
    return response;
  },
  getOrders: async (params) => {
    console.log('🔍 [API] Calling getOrders with params:', params);
    
    try {
      // Try primary endpoint first
      const response = await api.get('/AdminOrdersView/', { params });
      console.log('✅ [API] getOrders success:', response.status);
      return response;
    } catch (error) {
      console.warn('⚠️ [API] getOrders failed, trying Dashboard API:', error.message);
      
      // Try fallback to Dashboard API
      const dashboardResponse = await api.get('/Dashboard/');
      console.log('✅ [API] getOrders fallback success:', dashboardResponse.status);
      return dashboardResponse;
    }
  },
  updateOrderStatus: (data) => {
    return api.post('/UpdateOrderStatus/', data);
  },
  updateDeliveryFee: (data) => {
    console.log('AdminAPI: Updating delivery fee with data:', data);
    return api.post('/update-delivery-fee/', data);
  },
  // Customer management endpoints
  getCustomers: async () => {
    console.log('🔍 [API] Calling getCustomers');
    
    const response = await api.get('/customers/');
    console.log('✅ [API] getCustomers success:', response.status);
    return response;
  },
  getCustomerOrders: (customerId) => {
    return api.get(`/customer_orders/?customer_id=${customerId}`);
  },
  // Inquiry management endpoints
    getInquiries: () => {
      return api.get('/inquirylist/');
    },
  updateInquiryStatus: (data) => {
    return api.post('/inquiryupdate/', data);
  },
  // In-house order creation
  createInHouseOrder: (data) => {
    console.log('AdminAPI: Creating in-house order with data:', data);
    return api.post('/adminordercreate/', data);
  },
  
  // Admin Reports APIs
  getReports: async (params = {}) => {
    console.log('AdminAPI: Fetching reports with params:', params);
    return api.get('/adminreports/', { params });
  },
  
  getSevenDayReport: async () => {
    console.log('AdminAPI: Fetching seven-day report');
    return api.get('/adminreports/');
  },
  
  getCustomDateReport: async (startDate, endDate) => {
    console.log('AdminAPI: Fetching custom date report from', startDate, 'to', endDate);
    return api.get('/adminreports/', { 
      params: { 
        start_date: startDate, 
        end_date: endDate 
      } 
    });
  },
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  create: (data) => {
    console.log('Creating category with data:', data);
    return api.post('/create-categories/', data);
  },
  update: (categoryId, data) => {
    console.log('Updating category:', categoryId, 'with data:', data);
    
    const updateData = {
      category_id: categoryId,
      name: data.name,
      description: data.description
    };
    
    console.log('Category update payload:', updateData);
    return api.post('/restaurant-category-update/', updateData);
  },
  delete: (categoryId) => {
    console.log('Deleting category:', categoryId);
    return api.post('/delete-categories/', { category_id: categoryId });
  },
};

// Menu APIs
export const menuAPI = {
  getAll: (params) => api.get('/GetAllMenu/', { params }),
  search: (query, available = true) => api.get('/menu/search/', { params: { q: query, available } }),
  create: (data) => api.post('/createmenuitem/', data),
  update: (menuId, data) => api.post('/updatemenuitem/', { item_id: menuId, ...data }),
  delete: (menuId) => {
    console.log('MenuAPI: Deleting menu item:', menuId);
    return api.post('/deletemenuitem/', { item_id: menuId });
  },
};

// Order APIs
// export const orderAPI = {
//   create: (data) => api.post('/order/create/', data),
//   getAll: () => api.get('/AdminOrdersView/'),
//   getDetails: (orderId) => api.get(`/order/${orderId}/`),
//   getCustomerOrders: (customerId) => api.get('/customer_orders/', { params: { customer_id: customerId } }),
//   updateStatus: (orderId, data) => {
//     const payload = { order_id: orderId, status: data.status };
//     console.log('OrderAPI.updateStatus - Payload:', payload);
//     return api.post('/UpdateOrderStatus/', payload);
//   },
// };

export const orderAPI = {
  create: (data) => api.post('/order/create/', data),
  adminCreate: (data) => {
    return api.post('/adminordercreate/', data);
  },
  getAll: () => api.get('/AdminOrdersView/'),
  getDetails: (orderId) => api.get(`/order/${orderId}/`),
  getCustomerOrders: (customerId) => api.get('/customer_orders/', { params: { customer_id: customerId } }),
  updateStatus: (orderId, data) => {
    const payload = { order_id: orderId, status: data.status };
    return api.post('/UpdateOrderStatus/', payload);
  },
};





// Customer APIs
export const customerAPI = {
  create: (data) => api.post('/customer/create/', data),
};

// Inquiry APIs
export const inquiryAPI = {
  create: (data) => api.post('/inquirycreate/', data),
  getAll: () => api.get('/inquiry-list/'),
  delete: (inquiryId) => api.post('/inquiry/delete/', { inquiry_id: inquiryId }),
  update: (data) => {
    console.log('InquiryAPI: Updating inquiry status with data:', data);
    return api.post('/inquiryupdate/', data);
  },
};

// File Upload API
export const fileAPI = {
  upload: (file) => {
    console.log('FileAPI: Uploading file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImage: (file) => {
    console.log('FileAPI: Uploading image:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Test API connection
export const testAPI = async () => {
  try {
    console.log('Testing API connection to:', API_BASE_URL);
    const response = await api.get('/categories/');
    console.log('API connection successful:', response.status);
    return { success: true, status: response.status, message: 'Connected successfully' };
  } catch (error) {
    console.error('API connection failed:', error);
    let errorMsg = error.message;
    if (error.isNetworkError) {
      errorMsg = 'Cannot reach server. Please check if the API is running.';
    } else if (error.status === 404) {
      errorMsg = 'API endpoint not found. Server may not be configured properly.';
    }
    return { success: false, error: errorMsg };
  }
};


// Test specific endpoint
export const testEndpoint = async (endpoint, method = 'GET', data = null) => {
  try {
    console.log(`Testing endpoint: ${method} ${endpoint}`);
    let response;
    if (method === 'GET') {
      response = await api.get(endpoint);
    } else if (method === 'POST') {
      response = await api.post(endpoint, data);
    }
    console.log(`Endpoint ${endpoint} is accessible:`, response.status);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error(`Endpoint ${endpoint} failed:`, error);
    return { success: false, error: error.message, status: error.status };
  }
};

// Test admin login specifically
export const testAdminLogin = async () => {
  try {
    console.log('Testing admin login API...');
    const testData = { username: 'test@test.com', password: 'test123' };
    const response = await api.post('/Owner-Login/', testData);
    console.log('Admin login API accessible:', response.status);
    return { success: true, status: response.status };
  } catch (error) {
    console.error('Admin login API test failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return { success: false, error: error.message };
  }
};

// Test login endpoint specifically
export const testLoginEndpoint = async () => {
  try {
    console.log('Testing login endpoint:', `${API_BASE_URL}/login/`);
    const response = await api.post('/login/', { 
      username: 'test@test.com', 
      password: 'test123' 
    });
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error('Login endpoint test failed:', error);
    let errorMsg = 'Login endpoint not accessible';
    if (error.status === 404) {
      errorMsg = 'Login endpoint not found (404). Check if API server is running and configured correctly.';
    } else if (error.status === 405) {
      errorMsg = 'Login endpoint exists but method not allowed.';
    } else if (error.isNetworkError) {
      errorMsg = 'Cannot reach login endpoint. Check server connection.';
    }
    return { success: false, error: errorMsg, status: error.status };
  }
};

// Test upload endpoint specifically
export const testUploadEndpoint = async () => {
  try {
    console.log('Testing upload endpoint:', `${API_BASE_URL}/upload/`);
    
    // Create a test file (small text file)
    const testContent = 'This is a test file for upload testing';
    const testFile = new Blob([testContent], { type: 'text/plain' });
    testFile.name = 'test.txt';
    
    const formData = new FormData();
    formData.append('file', testFile);
    
    const response = await api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Upload endpoint test successful:', response.data);
    return { 
      success: true, 
      status: response.status, 
      data: response.data,
      message: 'Upload endpoint is working',
      fileUrl: response.data.s3_url || response.data.file_url || response.data.url
    };
  } catch (error) {
    console.error('Upload endpoint test failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    let errorMsg = 'Upload endpoint not accessible';
    if (error.status === 404) {
      errorMsg = 'Upload endpoint not found (404). Check if API server has /upload/ endpoint.';
    } else if (error.status === 405) {
      errorMsg = 'Upload endpoint exists but method not allowed.';
    } else if (error.status === 413) {
      errorMsg = 'File too large (413).';
    } else if (error.status === 415) {
      errorMsg = 'Unsupported media type (415).';
    } else if (error.isNetworkError) {
      errorMsg = 'Cannot reach upload endpoint. Check server connection.';
    } else if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    }
    
    return { 
      success: false, 
      error: errorMsg, 
      status: error.status,
      responseData: error.response?.data
    };
  }
};

// Utility function to validate if a menu item is available for ordering
export const validateMenuItemForOrder = async (menuItemId) => {
  try {
    // Test with a minimal order to see if the menu item is available
    const testOrderData = {
      customer_id: 1, // Use a test customer ID
      delivery_address: "Test",
      phone: "1234567890",
      items: [{
        menu_item_id: menuItemId,
        quantity: 1,
        selected_variation: "",
        special_instructions: ""
      }]
    };
    
    const response = await api.post('/order/create/', testOrderData);
    return { 
      success: true, 
      available: response.data.success,
      message: response.data.success ? 'Available' : response.data.error
    };
  } catch (error) {
    return { 
      success: false, 
      available: false,
      error: error.response?.data?.error || error.message
    };
  }
};

export default api;

