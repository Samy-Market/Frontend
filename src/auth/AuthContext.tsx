import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/toast';
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { LoginResponse, Me } from '@/lib/types';
import { AuthContext, type AuthState } from './auth';

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

  const adoptSession = useCallback(
    (res: LoginResponse) => {
      tokenStore.set(res.accessToken);
      qc.clear();
      qc.setQueryData(qk.me, res.user);
      setToken(res.accessToken);
      return res.user;
    },
    [qc],
  );

  const login = useCallback(
    async (email: string, password: string) => adoptSession(await api.post<LoginResponse>('/auth/login', { email, password })),
    [adoptSession],
  );

  const setupAdmin = useCallback(
    async (data: { email: string; password: string; siteName?: string; code?: string }) =>
      adoptSession(await api.post<LoginResponse>('/auth/setup', data)),
    [adoptSession],
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
      setupAdmin,
      logout,
    }),
    [token, me, isPending, fetchStatus, meError, refetch, login, setupAdmin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
