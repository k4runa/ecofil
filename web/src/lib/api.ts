import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
};

// Request interceptor for JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const isAuthEndpoint = error.config?.url === '/logout' || error.config?.url === '/login';
      if (!isAuthEndpoint) {
        localStorage.removeItem('access_token');
        // Trigger a storage event so Zustand stores can react
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: any) => api.post('/login', new URLSearchParams(credentials)),
  googleLogin: (credential: string) => api.post('/google-login', { credential }),
  register: (userData: any) => api.post('/users', userData),
  getMe: () => {
    return api.get(`/users/me`);
  },
  updateUserField: (username: string, data: { field: string; value: any; current_password?: string }) => {
    return api.patch(`/users/${username}`, data);
  },
  updateProfile: (username: string, data: any) => {
    return api.patch(`/users/${username}/profile`, data);
  },
  uploadAvatar: (formData: FormData) => {
    return api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  logout: () => api.post('/logout')
};

export const movieApi = {
  getMovies: (username: string) => api.get(`/movies/${username}`),
  searchMovies: (query: string) => api.get(`/movies/search?query=${query}`),
  addMovie: (username: string, movieData: any) => api.post(`/movies/${username}`, movieData),
  deleteMovie: (username: string, movieId: number) => api.delete(`/movies/${username}/${movieId}`),
  getRecommendations: (username: string) => api.get(`/movies/recommendations/${username}`),
  toggleFavorite: (username: string, movieId: number) => api.post(`/movies/${username}/${movieId}/favorite`),
};

export const aiApi = {
  chat: (message: string, history?: { role: string; content: string }[]) =>
    api.post('/ai/chat', { message, history: history || [] }),
  streamChat: async (message: string, history?: { role: string; content: string }[]) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, history: history || [] }),
    });
  },
};

export const socialApi = {
  getSimilarMinds: () => api.get('/social/similar'),
  getProfile: (userId: number) => api.get(`/social/profile/${userId}`),
  sendMessage: (receiverId: number, content: string) => api.post('/social/message', { receiver_id: receiverId, content }),
  editMessage: (messageId: number, content: string) => api.patch(`/social/message/${messageId}`, { content }),
  deleteMessage: (messageId: number) => api.delete(`/social/message/${messageId}`),
  getMessages: (otherId: number) => api.get(`/social/messages/${otherId}`),
  getConversations: (status: string = 'ACCEPTED') => api.get(`/social/conversations?status=${status}`),
  handleRequest: (otherId: number, action: 'accept' | 'decline') => api.patch(`/social/requests/${otherId}/${action}`),
  markAsRead: (otherId: number) => api.patch(`/social/messages/${otherId}/read`),
  deleteConversation: (otherId: number) => api.delete(`/social/conversation/${otherId}`),
  updatePrivacy: (isPrivate: boolean) => api.patch('/social/privacy', { is_private: isPrivate }),
};

export default api;
