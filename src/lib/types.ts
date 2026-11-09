export type Role = 'EMPLOYEE' | 'SUPERVISOR' | 'ADMIN';
export type MarkType = 'IN' | 'OUT';
export type PresenceStatus = 'INSIDE' | 'OUTSIDE' | 'NOT_MARKED';
export type JustificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ShiftSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  toleranceMinutes: number;
}

export interface Me {
  id: string;
  email: string;
  role: Role;
  active: boolean;
  employee: {
    id: string;
    fullName: string;
    documentId: string;
    position: string;
    site: { id: string; name: string };
  } | null;
}

export interface LoginResponse {
  accessToken: string;
  user: Me;
}

export interface EmployeeDayStatus {
  status: PresenceStatus;
  nextType: MarkType;
  lastMark: { id: string; type: MarkType; timestamp: string } | null;
  /** Ingreso que cuenta hoy (la hora de entrada del turno si llegó antes). */
  firstInToday: string | null;
  /** Minutos que llegó antes de su hora de entrada (no suman horas). */
  preEntryMinutesToday: number;
  /** Desde cuándo corre el contador de la jornada en curso. */
  countingFrom: string | null;
  workedMinutesToday: number;
  openSession: boolean;
  isLate: boolean;
  lateMinutes: number;
  missingAfterStart: boolean;
  /** Qué le toca hoy según su horario rotativo. */
  todayPlan: DayPlan;
  /** Sede donde trabaja hoy (base o traslado). */
  todaySite: DaySite;
}

export interface SiteRef {
  id: string;
  name: string;
}

export interface DaySite {
  site: SiteRef;
  homeSite: SiteRef;
  transferred: boolean;
  transferId: string | null;
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  active: boolean;
  activeEmployees?: number;
  incomingTransfersToday?: number;
}

export interface Transfer {
  id: string;
  employee: { id: string; fullName: string; position: string };
  fromSite: SiteRef;
  toSite: SiteRef;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdBy: string;
  status: 'PAST' | 'CURRENT' | 'UPCOMING';
}

/** Plan de un día: trabajar con un turno, descansar o sin horario asignado. */
export interface DayPlan {
  date: string;
  kind: 'WORK' | 'REST' | 'UNASSIGNED';
  shift: ShiftSummary | null;
  scheduleName: string | null;
}

export interface Attendance {
  id: string;
  employeeId: string;
  type: MarkType;
  timestamp: string;
  source: 'WEB';
  isLate: boolean;
  lateMinutes: number;
  preEntryMinutes: number;
}

export interface MarkResponse {
  attendance: Attendance;
  employee: { id: string; fullName: string; position: string };
  status: EmployeeDayStatus;
}

export interface MarkRecord {
  id: string;
  type: MarkType;
  timestamp: string;
  isLate: boolean;
  lateMinutes: number;
  preEntryMinutes: number;
}

export interface WorkSession {
  in: string;
  countedFrom: string;
  preEntryMinutes: number;
  out: string | null;
  minutes: number;
  open: boolean;
  stale: boolean;
}

export interface DaySummary {
  date: string;
  firstIn: string | null;
  preEntryMinutes: number;
  lastOut: string | null;
  workedMinutes: number;
  sessions: WorkSession[];
  openSession: boolean;
  isLate: boolean;
  lateMinutes: number;
  records: MarkRecord[];
}

export interface MonthDay extends DaySummary {
  plan: DayPlan;
  /** Día de trabajo ya pasado sin marcaciones. */
  absent: boolean;
}

export interface MonthHistory {
  month: string;
  totalWorkedMinutes: number;
  daysWorked: number;
  lateDays: number;
  absences: number;
  scheduledDays: number;
  days: MonthDay[];
}

export interface MySchedule {
  from: string;
  to: string;
  today: string;
  days: DayPlan[];
}

export interface Justification {
  id: string;
  attendanceId: string;
  employeeId: string;
  reason: string;
  status: JustificationStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  attendance: { id: string; type: MarkType; timestamp: string; isLate: boolean; lateMinutes: number };
  employee: { id: string; fullName: string; position: string };
  reviewer: { id: string; email: string } | null;
}

export interface AttendanceMarkedEvent {
  attendanceId: string;
  employee: { id: string; fullName: string; position: string };
  type: MarkType;
  timestamp: string;
  isLate: boolean;
  lateMinutes: number;
  preEntryMinutes: number;
  status: EmployeeDayStatus;
}

export interface TodayItem extends EmployeeDayStatus {
  employee: {
    id: string;
    fullName: string;
    position: string;
    documentId: string;
  };
}

export interface TodayResponse {
  date: string;
  generatedAt: string;
  totals: { employees: number; inside: number; outside: number; notMarked: number; late: number; resting: number; unassigned: number };
  items: TodayItem[];
}

export interface Employee {
  id: string;
  fullName: string;
  documentId: string;
  position: string;
  active: boolean;
  siteId: string;
  site: { id: string; name: string };
  user: { id: string; email: string; role: Role; active: boolean };
  currentSchedule: ScheduleSummary | null;
  nextSchedule: ScheduleSummary | null;
}

export interface ScheduleSummary {
  id: string;
  scheduleId: string;
  scheduleName: string;
  startDate: string;
  endDate: string | null;
}

export interface Shift extends ShiftSummary {
  /** Horarios que usan este turno. */
  schedules?: { id: string; name: string }[];
}

/** Plantilla semanal (1 = lunes … 7 = domingo; shift null = descanso). */
export interface Schedule {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  days: { weekday: number; shiftId: string | null; shift: ShiftSummary | null }[];
  currentEmployees?: number;
}

export interface Assignment {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string | null;
  schedule: { id: string; name: string };
  status: 'PAST' | 'CURRENT' | 'UPCOMING';
}

export interface ExpiringAssignment {
  assignmentId: string;
  employee: { id: string; fullName: string };
  schedule: { id: string; name: string };
  endDate: string;
}

export interface AssignResult {
  assigned: number;
  closedPrevious: number;
  inactiveEmployees: string[];
}

export interface ReportTotals {
  workedMinutes: number;
  /** Después de la hora de salida del turno, o todo lo trabajado en un día de descanso. */
  overtimeMinutes: number;
  daysWorked: number;
  lateDays: number;
  lateMinutes: number;
  preEntryDays: number;
  preEntryMinutes: number;
  openSessions: number;
  marks: number;
  scheduledDays: number;
  absences: number;
}

export interface ReportDay {
  date: string;
  firstIn: string | null;
  preEntryMinutes: number;
  lastOut: string | null;
  workedMinutes: number;
  overtimeMinutes: number;
  isLate: boolean;
  lateMinutes: number;
  openSession: boolean;
  plan: DayPlan;
  absent: boolean;
  site: SiteRef;
  marks: { id: string; type: MarkType; timestamp: string; isLate: boolean; lateMinutes: number; preEntryMinutes: number }[];
}

export interface EmployeeReport {
  employee: { id: string; fullName: string; documentId: string; position: string; active: boolean; schedules: string[]; homeSite: SiteRef };
  totals: ReportTotals;
  days: ReportDay[];
  /** Todos los días del rango hasta hoy con lo que le tocaba. */
  calendar: DayPlan[];
}

export interface AttendanceReport {
  from: string;
  to: string;
  timezone: string;
  generatedAt: string;
  totals: ReportTotals & { employees: number };
  site: SiteRef | null;
  employees: EmployeeReport[];
}

export interface SetupStatus {
  needsSetup: boolean;
  requiresCode: boolean;
}

export interface StaffUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR';
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
