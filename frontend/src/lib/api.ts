import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── API Functions ───

export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  requestOtp: (data: any) => api.post('/auth/otp/request', data),
  verifyOtp: (data: any) => api.post('/auth/otp/verify', data),
};

export const propertyAPI = {
  list: (params?: any) => api.get('/properties', { params }),
  getBySlug: (slug: string) => api.get(`/properties/${slug}`),
  create: (data: any) => api.post('/properties', data),
  update: (id: string, data: any) => api.put(`/properties/${id}`, data),
  mine: () => api.get('/properties/provider/mine'),
};

export const searchAPI = {
  search: (params: any) => api.get('/search', { params }),
  searchSlots: (params: any) => api.get('/search/slots', { params }),
};

export const bookingAPI = {
  createHold: (data: any) => api.post('/bookings/hold', data),
  confirm: (id: string, data: any) => api.post(`/bookings/${id}/confirm`, data),
  cancel: (id: string, data: any) => api.post(`/bookings/${id}/cancel`, data),
  list: (params?: any) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
};

export const paymentAPI = {
  createIntent: (data: any) => api.post('/payments/create-intent', data),
  simulateSuccess: (data: any) => api.post('/payments/simulate-success', data),
};

export const roomAPI = {
  getByProperty: (propertyId: string) => api.get(`/rooms/${propertyId}`),
  create: (data: any) => api.post('/rooms', data),
  generateSlots: (data: any) => api.post('/rooms/generate-slots', data),
};
