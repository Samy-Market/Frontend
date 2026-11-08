import type { ShiftSummary } from '@/lib/types';

export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const WEEKDAYS_LONG = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const shiftHours = (s: Pick<ShiftSummary, 'startTime' | 'endTime'>) => `${s.startTime}–${s.endTime}`;
