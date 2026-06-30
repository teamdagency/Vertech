'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';
import type { AuthProfile, AuthResponse } from './types';

interface AuthState {
  token: string | null;
  profile: AuthProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; username: string; displayName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);
const STORAGE_KEY = 'konfia_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AuthResponse;
      setToken(parsed.accessToken);
      setProfile(parsed.profile);
    }
    setLoading(false);
  }, []);

  function persist(session: AuthResponse) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setToken(session.accessToken);
    setProfile(session.profile);
  }

  async function login(email: string, password: string) {
    const session = await api.post<AuthResponse>('/auth/login', { email, password });
    persist(session);
  }

  async function register(input: { email: string; password: string; username: string; displayName: string }) {
    const session = await api.post<AuthResponse>('/auth/register', input);
    persist(session);
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ token, profile, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous AuthProvider.');
  return ctx;
}

export { ApiError };
