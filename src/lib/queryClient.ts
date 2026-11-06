import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (count, err) => !(err instanceof ApiError && err.status >= 400 && err.status < 500) && count < 2,
    },
  },
});

/** Claves de consulta centralizadas para invalidarlas desde los eventos en vivo. */
export const qk = {
  me: ['me'] as const,
  myStatus: ['attendance', 'me', 'status'] as const,
  myMonth: (month: string) => ['attendance', 'me', 'month', month] as const,
  myMonthAll: ['attendance', 'me', 'month'] as const,
  today: ['attendance', 'today'] as const,
  justifications: (status?: string) => ['justifications', status ?? 'ALL'] as const,
  justificationsAll: ['justifications'] as const,
  employees: (params: Record<string, string>) => ['employees', params] as const,
  employeesAll: ['employees'] as const,
  shifts: ['shifts'] as const,
  report: (params: Record<string, string>) => ['reports', params] as const,
};
