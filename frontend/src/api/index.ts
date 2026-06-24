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
  capture: async (blob: Blob) => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      // Convert blob to data URL and save locally
      const toDataURL = (b: Blob) => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.readAsDataURL(b);
      });
      const dataUrl = await toDataURL(blob);
      const photo: Photo = {
        id: Date.now(),
        filename: `guest_${Date.now()}.jpg`,
        local_path: dataUrl,
        cloud_url: dataUrl,
        created_at: new Date().toISOString(),
      } as unknown as Photo;
      const existing = JSON.parse(localStorage.getItem('guest_photos') || '[]');
      existing.unshift(photo);
      localStorage.setItem('guest_photos', JSON.stringify(existing));
      return Promise.resolve({ data: photo });
    }
    const form = new FormData();
    form.append('file', blob, 'capture.jpg');
    return api.post<Photo>('/photos/capture', form);
  },
  list: () => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const existing = JSON.parse(localStorage.getItem('guest_photos') || '[]');
      return Promise.resolve({ data: existing });
    }
    return api.get<Photo[]>('/photos/');
  },
  get: (id: number) => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const existing = JSON.parse(localStorage.getItem('guest_photos') || '[]');
      const found = existing.find((p: any) => p.id === id);
      return Promise.resolve({ data: found });
    }
    return api.get<Photo>(`/photos/${id}`);
  },
  delete: (id: number) => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const existing = JSON.parse(localStorage.getItem('guest_photos') || '[]');
      const filtered = existing.filter((p: any) => p.id !== id);
      localStorage.setItem('guest_photos', JSON.stringify(filtered));
      return Promise.resolve({ data: {} });
    }
    return api.delete(`/photos/${id}`);
  },
};

export const historyApi = {
  list: () => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const existing = JSON.parse(localStorage.getItem('guest_history') || '[]');
      return Promise.resolve({ data: existing });
    }
    return api.get<PoseHistoryItem[]>('/history/');
  },
};

export const adminApi = {
  stats: () => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const mock: AdminStats = { total_users: 1, active_users: 1, total_photos: 0, total_analyses: 0, avg_pose_score: 0, avg_overall_score: 0 };
      return Promise.resolve({ data: mock });
    }
    return api.get<AdminStats>('/admin/stats');
  },
  users: () => {
    const guestMode = localStorage.getItem('guestMode') === 'true';
    if (guestMode) {
      const guest = JSON.parse(localStorage.getItem('guestUser') || 'null');
      const arr = guest ? [guest] : [];
      return Promise.resolve({ data: arr });
    }
    return api.get<User[]>('/admin/users');
  },
  toggleActive: (id: number) => api.patch(`/admin/users/${id}/toggle-active`),
};

export default api;
