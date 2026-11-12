import { useEffect, useState } from 'react';
import { useToast } from '@/components/toast';
import { Badge, Card, ErrorState, Spinner } from '@/components/ui';
import { cn } from '@/lib/styles';
import { WEEKDAYS_SHORT, shiftHours } from '@/lib/schedule';
import { useMark, useMySchedule, useMyStatus } from '@/hooks/employee';
import { useNow } from '@/hooks/useNow';
import { errorMessage } from '@/lib/api';
import { DeviceLocation, getDeviceLocation } from '@/lib/geolocation';
import { formatLate, formatLongDate, formatMinutes, formatTime, formatTimeWithSeconds, relativeDayLabel } from '@/lib/time';

export default function EmployeeHome() {
  const now = useNow(1000);
  const statusQ = useMyStatus();
  const mark = useMark();
  const [done, setDone] = useState<'IN' | 'OUT' | null>(null);
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setDone(null), 1800);
    return () => window.clearTimeout(t);
  }, [done]);
  const toast = useToast();

  const s = statusQ.data;
  const plan = s?.todayPlan;
  const shift = plan?.kind === 'WORK' ? plan.shift : null;
  const inside = s?.status === 'INSIDE';

  const countFrom = Math.max(statusQ.dataUpdatedAt, s?.countingFrom ? new Date(s.countingFrom).getTime() : 0);
  const liveMinutes =
    s && inside ? s.workedMinutesToday + Math.max(0, Math.floor((now.getTime() - countFrom) / 60_000)) : (s?.workedMinutesToday ?? 0);

  const busy = mark.isPending || locating;

  const onMark = async () => {
    if (!s || busy) return;
    let location: DeviceLocation | undefined;
    if (s.location.required) {
      setLocating(true);
      try {
        location = await getDeviceLocation();
      } catch (err) {
        toast.error('No se pudo obtener tu ubicación', errorMessage(err));
        return;
      } finally {
        setLocating(false);
      }
    }
    mark.mutate(
      { expectedType: s.nextType, location },
      {
        onSuccess: (res) => {
          setDone(res.attendance.type);
          const time = formatTime(res.attendance.timestamp);
          if (res.attendance.type === 'IN') {
            if (res.attendance.isLate) {
              toast.warning(`Ingreso registrado a las ${time}`, `Se registró con ${formatLate(res.attendance.lateMinutes)} de atraso.`);
            } else {
              toast.success(`Ingreso registrado a las ${time}`, '¡Que tengas una buena jornada!');
            }
          } else {
            toast.success(`Salida registrada a las ${time}`, `Hoy llevas ${formatMinutes(res.status.workedMinutesToday)}.`);
          }
        },
        onError: (err) => toast.error('No se pudo registrar la marcación', errorMessage(err)),
      },
    );
  };

  if (statusQ.isPending) {
    return (
      <div className="flex justify-center py-20 text-brand-700">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (statusQ.isError || !s) {
    return <ErrorState message={errorMessage(statusQ.error)} onRetry={() => statusQ.refetch()} />;
  }

  const statusView = {
    INSIDE: { label: 'Dentro', tone: 'green' as const, text: 'Estás en tu jornada' },
    OUTSIDE: { label: 'Fuera', tone: 'slate' as const, text: 'Jornada finalizada por ahora' },
    NOT_MARKED: { label: 'Sin marcar', tone: 'amber' as const, text: 'Aún no registras ingreso hoy' },
  }[s.status];

  const isIn = s.nextType === 'IN';
  const blue = done ? done === 'IN' : isIn;

  return (
    <div className="space-y-5">
      <section className="text-center" aria-label="Fecha y hora actual">
        <p className="text-[15px] text-slate-500">{formatLongDate(now)}</p>
        <p className="mt-1 text-[56px] font-semibold leading-none tracking-[-0.04em] tabular-nums" aria-live="off">
          {formatTimeWithSeconds(now)}
        </p>
        <p className="mt-2 text-xs text-slate-400">Hora de Ecuador · la hora oficial la registra el servidor</p>
      </section>

      <section className="flex justify-center py-4">
        <div className="relative">
          {!busy && !done && (
            <span aria-hidden className={cn('absolute inset-0 animate-halo rounded-full', blue ? 'bg-brand-700' : 'bg-ink')} />
          )}
          <button
            type="button"
            onClick={() => void onMark()}
            disabled={busy || !!done}
            aria-describedby="estado-actual"
            className={cn(
              'relative flex h-56 w-56 flex-col items-center justify-center rounded-full transition-[transform,background] text-on-accent duration-300 ease-[var(--ease-apple)] active:scale-[0.96] focus-visible:outline-4 focus-visible:outline-offset-4 sm:h-64 sm:w-64',
              blue
                ? 'bg-[radial-gradient(circle_at_30%_25%,#2f75e8,#0058e0_55%,#0047b8)] shadow-[0_24px_60px_-18px_rgba(0,88,224,0.6)] focus-visible:outline-brand-700'
                : 'bg-[radial-gradient(circle_at_30%_25%,#48484a,#1d1d1f_60%)] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)] focus-visible:outline-ink dark:bg-[radial-gradient(circle_at_30%_25%,#ffffff,#d1d1d6_75%)] dark:text-[#1d1d1f] dark:shadow-[0_24px_60px_-18px_rgba(255,255,255,0.18)]',
            )}
          >
            {done ? (
              <span key="done" className="flex animate-pop flex-col items-center" role="status">
                <svg
                  viewBox="0 0 24 24"
                  className="h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
                <span className="mt-2 text-xl font-semibold">{done === 'IN' ? 'Ingreso registrado' : 'Salida registrada'}</span>
              </span>
            ) : busy ? (
              <span key="pending" className="flex animate-fade-in flex-col items-center">
                <Spinner className="h-10 w-10" />
                <span className="mt-3 text-lg font-medium">{locating ? 'Verificando ubicación…' : 'Registrando…'}</span>
              </span>
            ) : (
              <span key={isIn ? 'in' : 'out'} className="flex animate-scale-in flex-col items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-12 w-12 opacity-95"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {isIn ? (
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  ) : (
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                  )}
                </svg>
                <span className="mt-3 text-[22px] font-semibold">{isIn ? 'Marcar ingreso' : 'Marcar salida'}</span>
              </span>
            )}
          </button>
        </div>
      </section>
      {s.location.required && (
        <p className="-mt-2 text-center text-xs text-slate-500">
          Al marcar se verifica que estés en {s.todaySite.site.name} (a menos de {s.location.radiusMeters} m).
        </p>
      )}

      {s.dayOff ? (
        <DayOffCard label={s.dayOff.label} holiday={s.dayOff.kind === 'HOLIDAY'} />
      ) : (
        <TodayShift plan={plan} site={s.todaySite} />
      )}

      <Card>
        <div id="estado-actual" className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Estado actual</p>
            <p className="mt-0.5 text-sm text-slate-700">{statusView.text}</p>
          </div>
          <Badge tone={statusView.tone} className="px-3 py-1 text-sm">
            {statusView.label}
          </Badge>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Última marcación</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{s.lastMark ? formatTime(s.lastMark.timestamp) : '—'}</dd>
            <dd className="text-xs text-slate-500">
              {s.lastMark
                ? `${s.lastMark.type === 'IN' ? 'Ingreso' : 'Salida'} · ${relativeDayLabel(s.lastMark.timestamp)}`
                : 'Sin registros'}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Horas trabajadas hoy</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatMinutes(liveMinutes)}</dd>
            <dd className="text-xs text-slate-500">
              {inside ? 'Jornada abierta · en curso' : s.firstInToday ? `Ingreso ${formatTime(s.firstInToday)}` : '—'}
            </dd>
          </div>
        </dl>

        {s.preEntryMinutesToday > 0 && s.firstInToday && (
          <p className="mt-3 rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-900">
            Llegaste <strong>{formatLate(s.preEntryMinutesToday)}</strong> antes (preingreso). Tus horas se cuentan desde las{' '}
            <strong>{formatTime(s.firstInToday)}</strong>.
          </p>
        )}
        {s.isLate && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Hoy ingresaste con <strong>{formatLate(s.lateMinutes)}</strong> de atraso. Puedes justificarlo desde el Historial.
          </p>
        )}
        {s.missingAfterStart && shift && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tu hora de entrada era a las <strong>{shift.startTime}</strong> (tolerancia {shift.toleranceMinutes} min).
          </p>
        )}
      </Card>

      <MyWeek />
    </div>
  );
}

function TodayShift({ plan, site }: { plan: import('@/lib/types').DayPlan | undefined; site: import('@/lib/types').DaySite }) {
  if (!plan) return null;
  const where = site.transferred ? (
    <p className="mt-1 text-xs font-medium">
      Hoy trabajas en <strong>{site.site.name}</strong> (traslado temporal)
    </p>
  ) : (
    <p className="mt-1 text-xs opacity-70">{site.site.name}</p>
  );
  if (plan.kind === 'WORK' && plan.shift) {
    return (
      <div className="rounded-2xl bg-brand-50 px-4 py-3 text-center ring-1 ring-brand-100">
        <p className="text-xs uppercase tracking-wide text-brand-800/70">Tu turno de hoy</p>
        <p className="text-lg font-semibold text-brand-800">
          {plan.shift.name} · <span className="tabular-nums">{shiftHours(plan.shift)}</span>
        </p>
        <p className="text-xs text-brand-800/70">
          Tolerancia {plan.shift.toleranceMinutes} min · {plan.scheduleName}
        </p>
        <div className="text-brand-800">{where}</div>
      </div>
    );
  }
  if (plan.kind === 'REST') {
    return (
      <div className="rounded-2xl bg-slate-100 px-4 py-3 text-center">
        <p className="font-semibold">Hoy es tu día de descanso</p>
        <p className="text-xs text-slate-500">Si igual vienes a trabajar, marca normalmente: no cuenta como atraso.</p>
        {where}
      </div>
    );
  }
  return (
    <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-900 ring-1 ring-amber-200">
      Aún no tienes un horario asignado. Consulta a tu supervisor.
    </div>
  );
}

function MyWeek() {
  const q = useMySchedule();
  if (!q.data) return null;
  return (
    <section aria-labelledby="mi-semana">
      <Card className="p-0">
        <h2 id="mi-semana" className="border-b border-slate-100 px-4 py-3 text-sm font-semibold">
          Mi semana
        </h2>
        <ul className="divide-y divide-slate-100">
          {q.data.days.map((d, i) => {
            const isToday = d.date === q.data.today;
            return (
              <li key={d.date} className={cn('flex items-center justify-between px-4 py-2 text-sm', isToday && 'bg-brand-50')}>
                <span className={cn('w-20', isToday && 'font-semibold text-brand-800')}>
                  {WEEKDAYS_SHORT[i]} {d.date.slice(8)}
                  {isToday && <span className="ml-1 text-xs font-normal">(hoy)</span>}
                </span>
                {d.kind === 'WORK' && d.shift ? (
                  <span className="text-right">
                    <span className="font-medium">{d.shift.name}</span>{' '}
                    <span className="tabular-nums text-slate-500">{shiftHours(d.shift)}</span>
                  </span>
                ) : d.kind === 'REST' ? (
                  <Badge tone="slate">Descanso</Badge>
                ) : (
                  <span className="text-xs text-slate-400">Sin horario</span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}

function DayOffCard({ label, holiday }: { label: string; holiday: boolean }) {
  return (
    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-center ring-1 ring-emerald-600/20">
      <p className="font-semibold text-emerald-700">
        {holiday ? `Hoy es ${label.replace('Feriado: ', 'feriado: ')}` : `Hoy estás de ${label.toLowerCase()}`}
      </p>
      <p className="text-xs text-emerald-700/80">
        No necesitas marcar. Si igual vienes a trabajar, marca normalmente: no cuenta como atraso.
      </p>
    </div>
  );
}
