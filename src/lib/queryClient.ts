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
  staffUsers: ['users'] as const,
  schedules: ['schedules'] as const,
  sites: ['sites'] as const,
  transfers: (scope: string) => ['transfers', scope] as const,
  transfersAll: ['transfers'] as const,
  holidays: (year: number) => ['holidays', year] as const,
  leaves: (scope: string) => ['leaves', scope] as const,
  leavesAll: ['leaves'] as const,
  expiring: (days: number) => ['schedules', 'expiring', days] as const,
  scheduleMembers: (scheduleId: string) => ['schedules', 'members', scheduleId] as const,
  assignments: (employeeId: string) => ['assignments', employeeId] as const,
  assignmentsAll: ['assignments'] as const,
  mySchedule: ['attendance', 'me', 'schedule'] as const,
  report: (params: Record<string, string>) => ['reports', params] as const,
};
