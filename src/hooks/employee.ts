import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { EmployeeDayStatus, Justification, MarkResponse, MarkType, MonthHistory, MySchedule } from '@/lib/types';

export const useMyStatus = () =>
  useQuery({
    queryKey: qk.myStatus,
    queryFn: () => api.get<EmployeeDayStatus>('/attendance/me/status'),
    refetchInterval: 5 * 60_000,
  });

export const useMySchedule = () =>
  useQuery({ queryKey: qk.mySchedule, queryFn: () => api.get<MySchedule>('/attendance/me/schedule'), staleTime: 5 * 60_000 });

export const useMyMonth = (month: string) =>
  useQuery({
    queryKey: qk.myMonth(month),
    queryFn: () => api.get<MonthHistory>(`/attendance/me?month=${month}`),
    placeholderData: (prev) => prev,
  });

export const useMyJustifications = () =>
  useQuery({
    queryKey: qk.justifications(),
    queryFn: () => api.get<Justification[]>('/justifications'),
  });

export function useMark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expectedType: MarkType) => api.post<MarkResponse>('/attendance/mark', { expectedType }),
    onSuccess: (res) => {
      qc.setQueryData(qk.myStatus, res.status);
      void qc.invalidateQueries({ queryKey: qk.myMonthAll });
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: qk.myStatus });
    },
  });
}

export function useCreateJustification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { attendanceId: string; reason: string }) => api.post<Justification>('/justifications', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.justificationsAll }),
  });
}
