import axios from 'axios';
import type { AdminStats, AnalysisResult, Photo, PoseHistoryItem, User } from '../types';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  register: (username: string, email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/register', { username, email, password }),
  login: (username_or_email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { username_or_email, password }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    api.post('/auth/reset-password', { token, new_password }),
};

export const userApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
};

export const analysisApi = {
  realtime: (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, 'frame.jpg');
    return api.post<AnalysisResult>('/analysis/realtime', form);
  },
};

export const photosApi = {
  capture: (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, 'capture.jpg');
    return api.post<Photo>('/photos/capture', form);
  },
  list: () => api.get<Photo[]>('/photos/'),
  get: (id: number) => api.get<Photo>(`/photos/${id}`),
  delete: (id: number) => api.delete(`/photos/${id}`),
};

export const historyApi = {
  list: () => api.get<PoseHistoryItem[]>('/history/'),
};

export const adminApi = {
  stats: () => api.get<AdminStats>('/admin/stats'),
  users: () => api.get<User[]>('/admin/users'),
  toggleActive: (id: number) => api.patch(`/admin/users/${id}/toggle-active`),
};

export default api;
