import axios from 'axios';

// Configure your backend API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.seasidelbs.com';

// Check if we're in development mode
const _isDevelopment = import.meta.env.DEV;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Disable to prevent CORS issues
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token to headers if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request details
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
    });
    
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and logging
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('[API] Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
      });
      
      const networkError = new Error('Unable to connect to server. Please check your internet connection or try again later.');
      networkError.isNetworkError = true;
      networkError.originalError = error.message;
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
  getDashboard: () => api.get('/Dashboard/'),
  getOrders: (params) => api.get('/AdminOrdersView/', { params }),
  updateOrderStatus: (data) => api.post('/UpdateOrderStatus/', data),
  // Customer management endpoints
  getCustomers: () => api.get('/AdminOrdersView/'), // Using orders to extract customer data
  getCustomerOrders: (customerId) => api.get(`/customer_orders/?customer_id=${customerId}`),
  // Inquiry management endpoints
  getInquiries: () => {
    console.log('AdminAPI: Getting all inquiries');
    return api.get('/inquirylist/');
  },
  updateInquiryStatus: (data) => {
    console.log('AdminAPI: Updating inquiry status with data:', data);
    return api.post('/inquiryupdate/', data);
  },
};

// Category APIs
export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  create: (data) => {
    console.log('Creating category with data:', data);
    return api.post('/create-categories/', data);
  },
  update: async (categoryId, data) => {
    console.log('Updating category:', categoryId, 'with data:', data);
    
    try {
      // Since there's no direct update endpoint, we'll use create + delete approach
      // This maintains the category ID by creating first, then deleting the old one
      
      // First create the new category with updated data
      const createResponse = await api.post('/create-categories/', data);
      console.log('Created new category:', createResponse.data);
      
      // Then delete the old category
      await api.post('/delete-categories/', { category_id: categoryId });
      console.log('Deleted old category:', categoryId);
      
      // Return success response
      return {
        ...createResponse,
        data: {
          ...createResponse.data,
          message: 'Category updated successfully',
          old_category_id: categoryId,
          new_category_id: createResponse.data.category?.id
        }
      };
    } catch (error) {
      console.error('Category update failed:', error);
      throw error;
    }
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
export const orderAPI = {
  create: (data) => api.post('/order/create/', data),
  getAll: () => api.get('/AdminOrdersView/'),
  getDetails: (orderId) => api.get(`/order/${orderId}/`),
  getCustomerOrders: (customerId) => api.get('/customer_orders/', { params: { customer_id: customerId } }),
  updateStatus: (orderId, data) => {
    const payload = { order_id: orderId, status: data.status };
    console.log('OrderAPI.updateStatus - Payload:', payload);
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

