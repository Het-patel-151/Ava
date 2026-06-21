import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor – auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data.data;
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        original.headers['Authorization'] = `Bearer ${accessToken}`;
        // Update store without importing (circular-safe)
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.getState().setAccessToken(accessToken);
        return api(original);
      } catch {
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- API helpers ---
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (name: string, email: string, password: string) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
  getMe: () => api.get('/auth/me'),
};

export const conversationApi = {
  list: (params?: Record<string, unknown>) => api.get('/conversations', { params }),
  get: (id: string) => api.get(`/conversations/${id}`),
  create: (data: Record<string, unknown>) => api.post('/conversations', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/conversations/${id}`, data),
  delete: (id: string) => api.delete(`/conversations/${id}`),
};

export const messageApi = {
  list: (conversationId: string) => api.get(`/messages/conversation/${conversationId}`),
  delete: (id: string) => api.delete(`/messages/${id}`),
  addReaction: (id: string, emoji: string) => api.post(`/messages/${id}/reactions`, { emoji }),
};

export const agentApi = {
  list: () => api.get('/agents'),
  get: (id: string) => api.get(`/agents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/agents', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
};

export const fileApi = {
  list: (params?: Record<string, unknown>) => api.get('/files', { params }),
  upload: (formData: FormData) => api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const analyticsApi = {
  get: () => api.get('/analytics'),
};

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, unknown>) => api.patch('/settings', data),
  updateProfile: (data: Record<string, unknown>) => api.patch('/settings/profile', data),
  changePassword: (data: Record<string, unknown>) => api.patch('/settings/password', data),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/all/read'),
};
