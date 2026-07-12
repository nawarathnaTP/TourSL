import { create } from 'zustand';
import { authApi } from '../api/client.js';

const STORAGE_KEY = 'toursl_auth';

function parseAuth(data) {
  return {
    accessToken: data.accessToken || data.access_token || data.token,
    refreshToken: data.refreshToken || data.refresh_token,
    user: data.user || {
      id: data.id || data.userId,
      firstName: data.firstName || data.first_name,
      lastName: data.lastName || data.last_name,
      email: data.email,
      role: data.role,
    },
  };
}

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (data) => {
    const { accessToken, refreshToken, user } = parseAuth(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
  },

  login: async (email, password) => {
    const data = await authApi.login({ email, password });
    const { accessToken, refreshToken, user } = parseAuth(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
    return data;
  },

  register: async (role, payload) => {
    const fn = role === 'GUIDE' ? authApi.registerGuide : authApi.registerTourist;
    const data = await fn(payload);
    const { accessToken, refreshToken, user } = parseAuth(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
    return data;
  },

  googleLogin: async (idToken, role) => {
    const fn = role === 'GUIDE' ? authApi.googleGuide : authApi.googleTourist;
    const data = await fn({ idToken });
    const { accessToken, refreshToken, user } = parseAuth(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
    return data;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const { accessToken, refreshToken, user } = parseAuth(data);
        if (user && (user.firstName || user.email)) {
          set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
    } catch { /* ignore */ }
    set({ isLoading: false });
  },
}));

export default useAuthStore;
