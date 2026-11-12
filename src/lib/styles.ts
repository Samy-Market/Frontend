import { formatDateTime, formatDayKey } from './time';
import type { Justification } from './types';
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const justificationTone = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' } as const;
export function justificationTarget(j: Pick<Justification, 'attendance' | 'date'>): string {
  if (j.attendance) return `${j.attendance.type === 'IN' ? 'Ingreso' : 'Salida'} · ${formatDateTime(j.attendance.timestamp)}`;
  return `Ausencia · ${j.date ? formatDayKey(j.date) : '—'}`;
}

export const justificationLabel = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as const;

export const presenceView = {
  INSIDE: { label: 'Dentro', tone: 'green' },
  OUTSIDE: { label: 'Fuera', tone: 'slate' },
  NOT_MARKED: { label: 'Sin marcar', tone: 'amber' },
} as const;
