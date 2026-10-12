

import { create } from 'zustand';
import { getToken, setToken, getStoredUser, setStoredUser, removeToken } from '../utils/tokenUtils';
import { authApi } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: getToken(),
  isAuthenticated: Boolean(getToken() || getStoredUser()),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(credentials);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(userData);
      set({
        token: data.token,
        user: data.user,
        isAuthenticated: true,
        isLoading: false
      });
      return data;
    } catch (err) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await authApi.updateProfile(data);
      set({ user: updatedUser, isLoading: false });
      return updatedUser;
    } catch (err) {
      set({ error: err.message || 'Profile update failed', isLoading: false });
      throw err;
    }
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }
    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch (err) {
      console.warn('Check auth failed:', err.message);
    }
  }
}));
