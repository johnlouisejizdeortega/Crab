import { create } from 'zustand';
import { api, setToken } from '../lib/api';
import { disconnectSocket, getSocket } from '../lib/socket';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: 'RIDER' | 'DRIVER';
  vehicle?: { model: string; plate: string; color?: string; seats?: number };
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  loading: true,

  init: async () => {
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      set({ user, loading: false });
      getSocket(); // establish authenticated socket
    } catch {
      setToken(null);
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    setToken(token);
    set({ user });
    getSocket();
    return user;
  },

  register: async (payload) => {
    const { token, user } = await api.post<{ token: string; user: User }>('/auth/register', payload);
    setToken(token);
    set({ user });
    getSocket();
    return user;
  },

  logout: () => {
    setToken(null);
    disconnectSocket();
    set({ user: null });
  },

  setUser: (user) => set({ user }),

  refresh: async () => {
    try {
      const { user } = await api.get<{ user: User }>('/auth/me');
      set({ user });
    } catch {
      /* ignore */
    }
  },
}));
