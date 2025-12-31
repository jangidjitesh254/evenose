import axios from 'axios';
import { useAuthStore } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
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

// Response interceptor - Handle errors (especially 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data?.message || error.message);
    
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      console.log('🔴 401 Unauthorized - Session expired');
      
      // Get current path before clearing
      const currentPath = window.location.pathname;
      
      // Clear everything
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');
      
      // Update auth store
      const authStore = useAuthStore.getState();
      authStore.logout();
      
      // Only redirect to login if not already there
      // This prevents redirect loops
      if (currentPath !== '/login' && currentPath !== '/register') {
        console.log('🔴 Redirecting to login...');
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.log('🔴 403 Forbidden - Access denied');
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/updateprofile', data),
  changePassword: (data) => api.put('/auth/changepassword', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

// Hackathon API
export const hackathonAPI = {
  getAll: () => api.get('/hackathons'),
  getById: (id) => api.get(`/hackathons/${id}`),
  create: (data) => api.post('/hackathons', data),
  update: (id, data) => api.put(`/hackathons/${id}`, data),
  delete: (id) => api.delete(`/hackathons/${id}`),
  getMyHackathons: () => api.get('/hackathons/my/organized'),
  getMyCoordinations: () => api.get('/hackathons/my/coordinations'),
  
  // Coordinator management
  getCoordinators: (id) => api.get(`/hackathons/${id}/coordinators`),
  inviteCoordinator: (id, data) => api.post(`/hackathons/${id}/coordinators/invite`, data),
  removeCoordinator: (id, userId) => api.delete(`/hackathons/${id}/coordinators/${userId}`),
  cancelCoordinatorInvite: (id, userId) => api.delete(`/hackathons/${id}/coordinators/${userId}/cancel`),
  resendCoordinatorInvite: (id, userId) => api.post(`/hackathons/${id}/coordinators/${userId}/resend`),
  acceptCoordinatorInvitation: (hackathonId) => api.post(`/hackathons/coordinators/accept`, { hackathonId }),
  searchCoordinators: (id, query) => api.get(`/hackathons/${id}/search-coordinators?query=${encodeURIComponent(query)}`),
};

// Team API
export const teamAPI = {
  create: (data) => api.post('/teams', data),
  getById: (id) => api.get(`/teams/${id}`),
  update: (id, data) => api.put(`/teams/${id}`, data),
  delete: (id) => api.delete(`/teams/${id}`),
  getMyTeams: () => api.get('/teams/my'),
  addMember: (id, data) => api.post(`/teams/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/teams/${id}/members/${userId}`),
  leaveTeam: (id) => api.post(`/teams/${id}/leave`),
  getMyJoinRequests: () => api.get('/teams/my/join-requests'),
  acceptJoinRequest: (teamId, requestId) => api.post(`/teams/${teamId}/join-requests/${requestId}/accept`),
  rejectJoinRequest: (teamId, requestId) => api.post(`/teams/${teamId}/join-requests/${requestId}/reject`),
};

// Payment API (if you have payment functionality)
export const paymentApi = {
  createPayment: (data) => api.post('/payments', data),
  getPayments: () => api.get('/payments'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  verifyPayment: (id, data) => api.post(`/payments/${id}/verify`, data),
};