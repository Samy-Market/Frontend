import { createContext, useContext } from 'react';
import type { Me } from '@/lib/types';

export interface AuthState {
  token: string | null;
  user: Me | null;
  loading: boolean;
  error: unknown;
  retry: () => void;
  login: (email: string, password: string) => Promise<Me>;
  setupAdmin: (data: { email: string; password: string; siteName?: string; code?: string }) => Promise<Me>;
  logout: () => void;
  replaceToken: (token: string) => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPERVISOR';
export const homeFor = (role?: string) => (isAdminRole(role) ? '/admin' : '/');
