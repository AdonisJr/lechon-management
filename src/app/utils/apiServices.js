import axios from 'axios';

// Auth data utilities
export const setAuthData = (token, user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Add token to headers if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login if on client side
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Orders API
export const ordersAPI = {
  // Get all orders with optional filters and pagination
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value.toString().trim() !== '') {
        queryParams.append(key, value.toString().trim());
      }
    });
    const queryString = queryParams.toString();
    return api.get(queryString ? `/api/orders?${queryString}` : '/api/orders');
  },

  // Get single order
  getById: (id) => api.get(`/api/orders/${id}`),

  // Create new order
  create: (orderData) => api.post('/api/orders', orderData),

  // Update order
  update: (id, orderData) => api.put(`/api/orders/${id}`, orderData),

  // Delete order
  delete: (id) => api.delete(`/api/orders/${id}`),
};

// Users API
export const usersAPI = {
  // Get all users
  getAll: () => api.get('/api/users'),

  // Get single user
  getById: (id) => api.get(`/api/users/${id}`),

  // Create new user
  create: (userData) => api.post('/api/users', userData),

  // Update user
  update: (id, userData) => api.put(`/api/users/${id}`, userData),

  // Delete user
  delete: (id) => api.delete(`/api/users/${id}`),
};

// Lechon Slots API
export const lechonSlotsAPI = {
  // Get all slots with optional filters and pagination
  getAll: (params = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value.toString().trim() !== '') {
        queryParams.append(key, value.toString().trim());
      }
    });
    const queryString = queryParams.toString();
    return api.get(queryString ? `/api/lechon_slot?${queryString}` : '/api/lechon_slot');
  },

  // Get single slot
  getById: (id) => api.get(`/api/lechon_slot/${id}`),

  // Create new slot
  create: (slotData) => api.post('/api/lechon_slot', slotData),

  // Update slot
  update: (id, slotData) => api.put(`/api/lechon_slot/${id}`, slotData),

  // Delete slot
  delete: (id) => api.delete(`/api/lechon_slot/${id}`),

  // Assign order to slot
  assignOrder: (slotId, orderId) => api.post('/api/lechon_slot/assign', { slotId, orderId }),

  // Unassign order from slot
  unassignOrder: (orderId) => api.delete(`/api/lechon_slot/assign?orderId=${orderId}`),
};

// Auth API
export const authAPI = {
  // Login
  login: (credentials) => api.post('/api/login', credentials),

  // Register
  register: (userData) => api.post('/api/register', userData),

  // Check auth status (if needed)
  check: () => api.get('/api/auth/check'),
};

export default api;