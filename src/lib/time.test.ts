import { describe, expect, it } from 'vitest';
import { addDaysKey, formatDayKeyNumeric, formatLate, formatMinutes, formatMinutesShort, shiftMonth } from './time';

describe('Formatos de tiempo', () => {
  it('minutos a horas', () => {
    expect(formatMinutes(125)).toBe('2 h 05 min');
    expect(formatMinutesShort(605)).toBe('10:05');
    expect(formatLate(14)).toBe('14 min');
    expect(formatLate(75)).toBe('1 h 15 min');
  });

  it('suma días y meses sin desfases de zona horaria', () => {
    expect(addDaysKey('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDaysKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(formatDayKeyNumeric('2026-11-05')).toBe('05/11/2026');
    expect(formatDayKeyNumeric(null)).toBe('—');
  });
});
