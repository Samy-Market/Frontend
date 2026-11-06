import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/Toaster';
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { LoginResponse, Me } from '@/lib/types';

interface AuthState {
  token: string | null;
  user: Me | null;
  loading: boolean;
  /** Error al cargar la sesión (p. ej. servidor caído). */
  error: unknown;
  retry: () => void;
  login: (email: string, password: string) => Promise<Me>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const qc = useQueryClient();
  const toast = useToast();

  const meQuery = useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<Me>('/auth/me'),
    enabled: !!token,
    staleTime: 5 * 60_000,
    // Si el servidor no responde, se reintenta solo cada 5 s.
    refetchInterval: (q) => (q.state.status === 'error' ? 5000 : false),
  });

  const logout = useCallback(() => {
    tokenStore.clear();
    setToken(null);
    qc.clear();
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      toast.warning('Tu sesión expiró', 'Inicia sesión nuevamente.');
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, toast]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      tokenStore.set(res.accessToken);
      qc.clear();
      qc.setQueryData(qk.me, res.user);
      setToken(res.accessToken);
      return res.user;
    },
    [qc],
  );

  const { data: me, isPending, fetchStatus, error: meError, refetch } = meQuery;
  const value = useMemo<AuthState>(
    () => ({
      token,
      user: token ? (me ?? null) : null,
      loading: !!token && isPending && fetchStatus !== 'idle',
      error: token && !me ? meError : null,
      retry: () => void refetch(),
      login,
      logout,
    }),
    [token, me, isPending, fetchStatus, meError, refetch, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

export const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPERVISOR';
export const homeFor = (role?: string) => (isAdminRole(role) ? '/admin' : '/');
