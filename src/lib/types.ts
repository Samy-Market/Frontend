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
    shift: ShiftSummary | null;
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
  firstInToday: string | null;
  workedMinutesToday: number;
  openSession: boolean;
  isLate: boolean;
  lateMinutes: number;
  missingAfterStart: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  type: MarkType;
  timestamp: string;
  source: 'WEB';
  isLate: boolean;
  lateMinutes: number;
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
}

export interface WorkSession {
  in: string;
  out: string | null;
  minutes: number;
  open: boolean;
  stale: boolean;
}

export interface DaySummary {
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  workedMinutes: number;
  sessions: WorkSession[];
  openSession: boolean;
  isLate: boolean;
  lateMinutes: number;
  records: MarkRecord[];
}

export interface MonthHistory {
  month: string;
  totalWorkedMinutes: number;
  daysWorked: number;
  lateDays: number;
  days: DaySummary[];
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
  status: EmployeeDayStatus;
}

export interface TodayItem extends EmployeeDayStatus {
  employee: {
    id: string;
    fullName: string;
    position: string;
    documentId: string;
    shift: ShiftSummary | null;
  };
}

export interface TodayResponse {
  date: string;
  generatedAt: string;
  totals: { employees: number; inside: number; outside: number; notMarked: number; late: number };
  items: TodayItem[];
}

export interface Employee {
  id: string;
  fullName: string;
  documentId: string;
  position: string;
  active: boolean;
  shiftId: string | null;
  siteId: string;
  shift: ShiftSummary | null;
  site: { id: string; name: string };
  user: { id: string; email: string; role: Role; active: boolean };
}

export interface Shift extends ShiftSummary {
  _count?: { employees: number };
}

export interface ReportTotals {
  workedMinutes: number;
  daysWorked: number;
  lateDays: number;
  lateMinutes: number;
  openSessions: number;
  marks: number;
}

export interface ReportDay {
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  workedMinutes: number;
  isLate: boolean;
  lateMinutes: number;
  openSession: boolean;
  marks: { id: string; type: MarkType; timestamp: string; isLate: boolean; lateMinutes: number }[];
}

export interface EmployeeReport {
  employee: { id: string; fullName: string; documentId: string; position: string; active: boolean; shift: string | null };
  totals: ReportTotals;
  days: ReportDay[];
}

export interface AttendanceReport {
  from: string;
  to: string;
  timezone: string;
  generatedAt: string;
  totals: ReportTotals & { employees: number };
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
