import { create } from 'zustand';
import { api } from '../services/api';

export interface GroupInfo {
  id: number;
  name: string;
  description: string;
  role_level: 'admin' | 'editor' | 'viewer';
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  preferred_theme?: string;
  preferred_language?: string;
  groups: GroupInfo[];
}

export interface BootstrapStatusInfo {
  has_users: boolean;
  user_count: number;
  project_count: number;
  next_user_will_be_global_admin: boolean;
  schema: string;
  settings?: Record<string, any>;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  showLogin: boolean;
  bootstrapStatus: BootstrapStatusInfo | null;
  setShowLogin: (show: boolean) => void;
  fetchBootstrapStatus: () => Promise<BootstrapStatusInfo | null>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (params: {
    email: string;
    full_name: string;
    password: string;
    username?: string;
  }) => Promise<{ is_first_user_global_admin: boolean }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const storedToken = localStorage.getItem('opspages_access_token');
const storedUserRaw = localStorage.getItem('opspages_user');
let parsedUser: UserInfo | null = null;
try {
  if (storedUserRaw) parsedUser = JSON.parse(storedUserRaw);
} catch {
  parsedUser = null;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: storedToken,
  user: parsedUser,
  isAuthenticated: Boolean(storedToken && parsedUser),
  showLogin: false,
  bootstrapStatus: null,
  setShowLogin: (show: boolean) => set({ showLogin: show }),

  fetchBootstrapStatus: async () => {
    try {
      const res = await api.get('/auth/bootstrap-status');
      set({ bootstrapStatus: res.data });
      return res.data as BootstrapStatusInfo;
    } catch {
      return null;
    }
  },

  login: async (usernameOrEmail: string, password: string) => {
    const res = await api.post('/auth/login', {
      username: usernameOrEmail,
      password,
    });
    const { access_token, user } = res.data;
    localStorage.setItem('opspages_access_token', access_token);
    localStorage.setItem('opspages_user', JSON.stringify(user));
    set({
      token: access_token,
      user,
      isAuthenticated: true,
      showLogin: false,
    });
  },

  register: async ({ email, full_name, password, username }) => {
    const res = await api.post('/auth/register', {
      email,
      full_name,
      password,
      username,
    });
    const { access_token, user, is_first_user_global_admin } = res.data;
    localStorage.setItem('opspages_access_token', access_token);
    localStorage.setItem('opspages_user', JSON.stringify(user));
    set({
      token: access_token,
      user,
      isAuthenticated: true,
      showLogin: false,
    });
    return { is_first_user_global_admin: Boolean(is_first_user_global_admin) };
  },

  logout: () => {
    localStorage.removeItem('opspages_access_token');
    localStorage.removeItem('opspages_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      showLogin: false,
    });
  },

  refreshUser: async () => {
    try {
      const res = await api.get('/auth/me');
      localStorage.setItem('opspages_user', JSON.stringify(res.data));
      set({ user: res.data, isAuthenticated: true });
    } catch {
      localStorage.removeItem('opspages_access_token');
      localStorage.removeItem('opspages_user');
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
