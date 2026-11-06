import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type { AttendanceReport, Employee, Justification, JustificationStatus, Shift, TodayResponse } from '@/lib/types';

export const useToday = () =>
  useQuery({
    queryKey: qk.today,
    queryFn: () => api.get<TodayResponse>('/attendance/today'),
    // Respaldo: recalcula "sin marcar / atrasado" aunque nadie marque.
    refetchInterval: 60_000,
  });

export const useEmployees = (params: { q?: string; active?: 'true' | 'false' | 'all' }) => {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.active) search.set('active', params.active);
  const key = Object.fromEntries(search);
  return useQuery({
    queryKey: qk.employees(key),
    queryFn: () => api.get<Employee[]>(`/employees?${search}`),
    placeholderData: (prev) => prev,
  });
};

export interface EmployeeInput {
  fullName: string;
  email: string;
  documentId: string;
  position: string;
  shiftId: string | null;
  active: boolean;
  password?: string;
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<EmployeeInput> }) =>
      id ? api.patch<Employee>(`/employees/${id}`, data) : api.post<Employee>('/employees', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.employeesAll });
      qc.invalidateQueries({ queryKey: qk.today });
      qc.invalidateQueries({ queryKey: qk.shifts });
    },
  });
}

export const useShifts = () => useQuery({ queryKey: qk.shifts, queryFn: () => api.get<Shift[]>('/shifts') });

export type ShiftInput = Pick<Shift, 'name' | 'startTime' | 'endTime' | 'toleranceMinutes'>;

export function useSaveShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ShiftInput }) =>
      id ? api.patch<Shift>(`/shifts/${id}`, data) : api.post<Shift>('/shifts', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.shifts });
      qc.invalidateQueries({ queryKey: qk.employeesAll });
      qc.invalidateQueries({ queryKey: qk.today });
    },
  });
}

export const useJustifications = (status?: JustificationStatus) =>
  useQuery({
    queryKey: qk.justifications(status),
    queryFn: () => api.get<Justification[]>(`/justifications${status ? `?status=${status}` : ''}`),
  });

export function useReviewJustification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewNote }: { id: string; status: 'APPROVED' | 'REJECTED'; reviewNote?: string }) =>
      api.patch<Justification>(`/justifications/${id}`, { status, ...(reviewNote ? { reviewNote } : {}) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.justificationsAll }),
  });
}

export const useAttendanceReport = (params: { from: string; to: string; employeeId?: string }, enabled: boolean) => {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  if (params.employeeId) search.set('employeeId', params.employeeId);
  return useQuery({
    queryKey: qk.report(Object.fromEntries(search)),
    queryFn: () => api.get<AttendanceReport>(`/reports/attendance?${search}`),
    enabled,
    placeholderData: (prev) => prev,
  });
};
