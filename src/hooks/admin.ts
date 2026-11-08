import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import type {
  AssignResult,
  Assignment,
  AttendanceReport,
  Employee,
  ExpiringAssignment,
  Justification,
  JustificationStatus,
  Schedule,
  Shift,
  Site,
  StaffUser,
  Transfer,
  TodayResponse,
} from '@/lib/types';

export const useToday = () =>
  useQuery({
    queryKey: qk.today,
    queryFn: () => api.get<TodayResponse>('/attendance/today'),
    // Respaldo: recalcula "sin marcar / atrasado" aunque nadie marque.
    refetchInterval: 60_000,
  });

export const useEmployees = (params: { q?: string; active?: 'true' | 'false' | 'all'; siteId?: string }) => {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.active) search.set('active', params.active);
  if (params.siteId) search.set('siteId', params.siteId);
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
  siteId: string;
  active: boolean;
  password?: string;
}

export function useSaveEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<EmployeeInput> }) =>
      id ? api.patch<Employee>(`/employees/${id}`, data) : api.post<Employee>('/employees', data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.employeesAll });
      void qc.invalidateQueries({ queryKey: qk.today });
      void qc.invalidateQueries({ queryKey: qk.shifts });
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
      void qc.invalidateQueries({ queryKey: qk.shifts });
      void qc.invalidateQueries({ queryKey: qk.employeesAll });
      void qc.invalidateQueries({ queryKey: qk.today });
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

export const useAttendanceReport = (params: { from: string; to: string; employeeId?: string; siteId?: string }, enabled: boolean) => {
  const search = new URLSearchParams({ from: params.from, to: params.to });
  if (params.employeeId) search.set('employeeId', params.employeeId);
  if (params.siteId) search.set('siteId', params.siteId);
  return useQuery({
    queryKey: qk.report(Object.fromEntries(search)),
    queryFn: () => api.get<AttendanceReport>(`/reports/attendance?${search}`),
    enabled,
    placeholderData: (prev) => prev,
  });
};

export const useStaffUsers = () => useQuery({ queryKey: qk.staffUsers, queryFn: () => api.get<StaffUser[]>('/users') });

export interface StaffUserInput {
  email: string;
  role: 'ADMIN' | 'SUPERVISOR';
  active: boolean;
  password?: string;
}

export function useSaveStaffUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<StaffUserInput> }) =>
      id ? api.patch<StaffUser>(`/users/${id}`, data) : api.post<StaffUser>('/users', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.staffUsers }),
  });
}

// ---------------------------------------------------------------------------
// Horarios rotativos
// ---------------------------------------------------------------------------

export const useSchedules = () => useQuery({ queryKey: qk.schedules, queryFn: () => api.get<Schedule[]>('/schedules') });

export interface ScheduleInput {
  name: string;
  description: string | null;
  active: boolean;
  days: { weekday: number; shiftId: string | null }[];
}

/** Al cambiar horarios o asignaciones cambian el dashboard, empleados y reportes. */
function invalidateScheduleData(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.schedules });
  void qc.invalidateQueries({ queryKey: qk.assignmentsAll });
  void qc.invalidateQueries({ queryKey: qk.employeesAll });
  void qc.invalidateQueries({ queryKey: qk.shifts });
  void qc.invalidateQueries({ queryKey: qk.today });
  void qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useSaveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ScheduleInput }) =>
      id ? api.patch<Schedule>(`/schedules/${id}`, data) : api.post<Schedule>('/schedules', data),
    onSuccess: () => invalidateScheduleData(qc),
  });
}

export function useAssignSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { scheduleId: string; employeeIds: string[]; startDate: string; endDate: string | null }) =>
      api.post<AssignResult>('/schedules/assign', data),
    onSuccess: () => invalidateScheduleData(qc),
  });
}

export const useEmployeeAssignments = (employeeId: string | null) =>
  useQuery({
    queryKey: qk.assignments(employeeId ?? ''),
    queryFn: () => api.get<Assignment[]>(`/employees/${employeeId}/assignments`),
    enabled: !!employeeId,
  });

export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string | null }) =>
      api.patch<Assignment>(`/schedule-assignments/${id}`, { endDate }),
    onSuccess: () => invalidateScheduleData(qc),
  });
}

export function useDeleteAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/schedule-assignments/${id}`),
    onSuccess: () => invalidateScheduleData(qc),
  });
}

export const useExpiring = (days: number) =>
  useQuery({ queryKey: qk.expiring(days), queryFn: () => api.get<ExpiringAssignment[]>(`/schedules/expiring?days=${days}`) });

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/shifts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.shifts }),
  });
}

// ---------------------------------------------------------------------------
// Sedes y traslados
// ---------------------------------------------------------------------------

export const useSites = () => useQuery({ queryKey: qk.sites, queryFn: () => api.get<Site[]>('/sites') });

export interface SiteInput {
  name: string;
  address: string | null;
  active: boolean;
}

function invalidateSiteData(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: qk.sites });
  void qc.invalidateQueries({ queryKey: qk.transfersAll });
  void qc.invalidateQueries({ queryKey: qk.employeesAll });
  void qc.invalidateQueries({ queryKey: qk.today });
  void qc.invalidateQueries({ queryKey: ['reports'] });
}

export function useSaveSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: SiteInput }) =>
      id ? api.patch<Site>(`/sites/${id}`, data) : api.post<Site>('/sites', data),
    onSuccess: () => invalidateSiteData(qc),
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/sites/${id}`),
    onSuccess: () => invalidateSiteData(qc),
  });
}

export const useTransfers = (scope: 'CURRENT' | 'ALL') =>
  useQuery({ queryKey: qk.transfers(scope), queryFn: () => api.get<Transfer[]>(`/transfers?scope=${scope}`) });

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeIds: string[]; siteId: string; startDate: string; endDate: string; reason?: string }) =>
      api.post<{ created: number }>('/transfers', data),
    onSuccess: () => invalidateSiteData(qc),
  });
}

export function useUpdateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) => api.patch(`/transfers/${id}`, { endDate }),
    onSuccess: () => invalidateSiteData(qc),
  });
}

export function useDeleteTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/transfers/${id}`),
    onSuccess: () => invalidateSiteData(qc),
  });
}
