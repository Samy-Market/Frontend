/** Utilidades de fecha/hora. Todo se muestra en la zona de referencia de la empresa. */
export const TIMEZONE = 'America/Guayaquil';
const LOCALE = 'es-EC';

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE, { timeZone: TIMEZONE, ...opts });
const timeFmt = fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const timeSecFmt = fmt({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const dateLongFmt = fmt({ weekday: 'long', day: 'numeric', month: 'long' });
const dateShortFmt = fmt({ weekday: 'short', day: '2-digit', month: 'short' });
const dateTimeFmt = fmt({ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
const isoDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

export const formatTime = (d: string | Date | null | undefined) => (d ? timeFmt.format(new Date(d)) : '—');
export const formatTimeWithSeconds = (d: Date) => timeSecFmt.format(d);
export const formatDateTime = (d: string | Date | null | undefined) => (d ? dateTimeFmt.format(new Date(d)) : '—');
export const formatLongDate = (d: Date) => capitalize(dateLongFmt.format(d));

/** "yyyy-MM-dd" (día local) → "lun, 03 nov" */
export const formatDayKey = (key: string) => capitalize(dateShortFmt.format(dayKeyToDate(key)));

/** Día local "yyyy-MM-dd" para una fecha. */
export const toDayKey = (d: Date) => isoDateFmt.format(d);
export const todayKey = () => toDayKey(new Date());
export const currentMonth = () => todayKey().slice(0, 7);

/** Mediodía local de ese día (sin ambigüedad de zona). Ecuador es UTC−5 fijo. */
const dayKeyToDate = (key: string) => new Date(`${key}T12:00:00-05:00`);

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const label = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, 15)),
  );
  return capitalize(label);
}

export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.max(0, total % 60);
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

/** Atraso legible: "14 min" o "1 h 05 min". */
export function formatLate(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  return formatMinutes(minutes);
}

/** "hoy", "ayer" o la fecha corta, para contextualizar una hora. */
export function relativeDayLabel(d: string | Date): string {
  const key = toDayKey(new Date(d));
  if (key === todayKey()) return 'hoy';
  if (key === toDayKey(new Date(Date.now() - 86_400_000))) return 'ayer';
  return formatDayKey(key).toLowerCase();
}

export function formatMinutesShort(total: number): string {
  const h = Math.floor(total / 60);
  const m = Math.max(0, total % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
