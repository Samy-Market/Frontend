import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/toast';
import { api, setUnauthorizedHandler, tokenStore } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { LoginResponse, Me } from '@/lib/types';
import { AuthContext, type AuthState } from './auth';
import { activityStore } from './session';
import { SessionWatcher } from './SessionWatcher';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get());
  const qc = useQueryClient();
  const toast = useToast();

  const meQuery = useQuery({
    queryKey: qk.me,
    queryFn: () => api.get<Me>('/auth/me'),
    enabled: !!token,
    staleTime: 5 * 60_000,
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

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== tokenStore.key) return;
      if (!e.newValue) {
        setToken(null);
        qc.clear();
      } else if (e.newValue !== token) {
        qc.clear();
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [qc, token]);

  const adoptSession = useCallback(
    (res: LoginResponse) => {
      activityStore.touch();
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

  const replaceToken = useCallback((next: string) => {
    tokenStore.set(next);
    setToken(next);
  }, []);

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
      replaceToken,
    }),
    [token, me, isPending, fetchStatus, meError, refetch, login, setupAdmin, logout, replaceToken],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionWatcher />
    </AuthContext.Provider>
  );
}
