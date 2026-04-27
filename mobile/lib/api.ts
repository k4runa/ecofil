import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor — attach JWT token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config.url?.endsWith('/logout')) {
      // Lazy import to avoid circular dependency issues at initialization
      const { useAuthStore } = require('./store');
      useAuthStore.getState().logout();
    }
    if (error.response?.status === 429) {
      Alert.alert("Too Many Requests", "You are doing that too fast. Please wait a moment and try again.");
    }
    return Promise.reject(error);
  }
);

export const usersApi = {
  updateField: (field: string, value: any) => api.patch('/users/', { field, value }),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  uploadAvatar: (formData: FormData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const authApi = {
  login: async (credentials: any) => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post('/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (response.data.access_token) {
      await SecureStore.setItemAsync('userToken', response.data.access_token);
      // After login, fetch full user profile to keep store consistent
      const meRes = await authApi.getMe();
      return meRes.data;
    }
    return response;
  },
  register: (userData: any) => api.post('/users', userData),
  googleLogin: async (credential: string) => {
    const response = await api.post('/google-login', { credential });
    if (response.data.access_token) {
      await SecureStore.setItemAsync('userToken', response.data.access_token);
      const meRes = await authApi.getMe();
      return meRes.data;
    }
    return response;
  },
  getMe: () => api.get('/users/me'),
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (e) {
      // Ignore 401/error on logout, we want to clear local state anyway
    } finally {
      await SecureStore.deleteItemAsync('userToken');
    }
  }
};

export const movieApi = {
  getMovies: () => api.get('/movies/'),
  searchMovies: (query: string) => api.get(`/movies/search?query=${query}`),
  addMovie: (movieData: any) => api.post('/movies/', movieData),
  deleteMovie: (movieId: number) => api.delete(`/movies/${movieId}`),
  getRecommendations: () => api.get('/movies/recommendations'),
  getTrending: () => api.get('/movies/all/trending'),
  getMovieDetails: (tmdbId: number, skipAi: boolean = false) => api.get(`/movies/details/${tmdbId}?skip_ai=${skipAi}`),
  toggleFavorite: (movieId: number) => api.post(`/movies/${movieId}/favorite`),
  getFavorites: () => api.get('/movies/favorites'),
  getDiscoveryDetails: (entityId: string) => api.get(`/movies/discovery/${entityId}`),
};

export const aiApi = {
  chat: (message: string, history?: any[]) => api.post('/ai/chat', { message, history: history || [] }),
  getHistory: () => api.get('/ai/history'),
  clearHistory: () => api.delete('/ai/history'),
  getRecommendations: () => api.get('/ai/recommendations'),
};

export const socialApi = {
  getSimilarMinds: () => api.get('/social/similar'),
  getConversations: (status: string = 'ACCEPTED') => api.get(`/social/conversations?status=${status}`),
  sendMessage: (receiverId: number, content: string) => api.post('/social/message', { receiver_id: receiverId, content }),
  getMessages: (otherId: number) => api.get(`/social/messages/${otherId}`),
  getProfile: (userId: number) => api.get(`/social/profile/${userId}`),
};

export const notificationApi = {
  getNotifications: (limit: number = 50) => api.get(`/notifications/?limit=${limit}`),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markRead: (notificationId?: number) => api.patch('/notifications/read', { notification_id: notificationId }),
};

export default api;
