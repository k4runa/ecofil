import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from './api';

interface Movie {
  id: number;
  tmdb_id: number;
  title: string;
  [key: string]: any;
}

interface AuthState {
  user: any | null;
  isLoading: boolean;
  setUser: (user: any) => void;
  logout: () => Promise<void>;
}

interface LibraryState {
  libraryMovies: Movie[];
  favoriteMovies: Movie[];
  libraryLoaded: boolean;
  setLibraryMovies: (movies: Movie[]) => void;
  setFavoriteMovies: (movies: Movie[]) => void;
  setLibraryLoaded: (loaded: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('[Store] Server logout failed or already logged out:', error);
    }
    await SecureStore.deleteItemAsync('userToken');
    set({ user: null, isLoading: false });
  },
}));

export const useLibraryStore = create<LibraryState>((set) => ({
  libraryMovies: [],
  favoriteMovies: [],
  libraryLoaded: false,
  setLibraryMovies: (movies) => set({ libraryMovies: movies }),
  setFavoriteMovies: (movies) => set({ favoriteMovies: movies }),
  setLibraryLoaded: (loaded) => set({ libraryLoaded: loaded }),
}));