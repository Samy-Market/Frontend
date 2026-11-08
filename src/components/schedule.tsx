import { Badge } from './ui';
import { cn } from '@/lib/styles';
import type { DayPlan, Schedule } from '@/lib/types';
import { shiftHours, WEEKDAYS_LONG, WEEKDAYS_SHORT } from '@/lib/schedule';

/** Paleta estable por turno para distinguirlos de un vistazo en las cuadrículas. */
const palette = [
  'bg-brand-50 text-brand-800 ring-brand-700/10',
  'bg-[#e6fafc] text-[#05707a] ring-[#09d1e0]/20 dark:bg-[#06343a] dark:text-[#7ee8f2]',
  'bg-ink text-on-ink ring-black/10',
  'bg-brand-200 text-brand-900 ring-brand-700/10',
  'bg-slate-100 text-slate-800 ring-black/5',
  'bg-brand-100 text-brand-900 ring-brand-700/10',
];
function shiftColor(shiftId: string, order: string[]) {
  const i = order.indexOf(shiftId);
  return palette[(i < 0 ? 0 : i) % palette.length];
}

/** Cuadrícula de 7 días de una plantilla. */
export function WeekGrid({ schedule, shiftOrder, compact }: { schedule: Pick<Schedule, 'days'>; shiftOrder: string[]; compact?: boolean }) {
  return (
    <div className="grid grid-cols-7 gap-1" role="list" aria-label="Turnos de la semana">
      {WEEKDAYS_SHORT.map((label, i) => {
        const day = schedule.days.find((d) => d.weekday === i + 1);
        const shift = day?.shift ?? null;
        return (
          <div
            key={label}
            role="listitem"
            aria-label={`${WEEKDAYS_LONG[i]}: ${shift ? `${shift.name} ${shiftHours(shift)}` : 'Descanso'}`}
            className={cn(
              'rounded-lg px-1 py-1.5 text-center ring-1 ring-inset',
              shift ? shiftColor(shift.id, shiftOrder) : 'bg-transparent text-slate-400 ring-black/5',
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">{label}</p>
            <p className={cn('truncate font-medium', compact ? 'text-xs' : 'text-sm')}>{shift ? shift.name : 'Libre'}</p>
            {shift && !compact && (
              <p className="text-[11px] leading-tight tabular-nums opacity-80">
                {shift.startTime}
                <span className="hidden sm:inline">–</span>
                <br className="sm:hidden" />
                {shift.endTime}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Texto del plan de un día: "Tarde 11:00–21:00", "Descanso" o "Sin horario". */
export function PlanLabel({ plan, withSchedule }: { plan: DayPlan; withSchedule?: boolean }) {
  if (plan.kind === 'WORK' && plan.shift) {
    return (
      <span>
        <span className="font-medium">{plan.shift.name}</span>{' '}
        <span className="whitespace-nowrap tabular-nums text-slate-500">{shiftHours(plan.shift)}</span>
        {withSchedule && plan.scheduleName && <span className="block text-xs text-slate-400">{plan.scheduleName}</span>}
      </span>
    );
  }
  if (plan.kind === 'REST') return <Badge tone="slate">Descanso</Badge>;
  return <Badge tone="amber">Sin horario</Badge>;
}
