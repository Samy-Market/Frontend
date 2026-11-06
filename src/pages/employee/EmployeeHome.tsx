import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toaster';
import { Badge, Card, cn, ErrorState, Spinner } from '@/components/ui';
import { useMark, useMyStatus } from '@/hooks/employee';
import { useNow } from '@/hooks/useNow';
import { errorMessage } from '@/lib/api';
import { formatLate, formatLongDate, formatMinutes, formatTime, formatTimeWithSeconds, relativeDayLabel } from '@/lib/time';

export default function EmployeeHome() {
  const { user } = useAuth();
  const shift = user?.employee?.shift;
  const now = useNow(1000);
  const statusQ = useMyStatus();
  const mark = useMark();
  const toast = useToast();

  const s = statusQ.data;
  const inside = s?.status === 'INSIDE';

  // Horas de hoy "en vivo": lo que calculó el servidor + lo transcurrido desde esa consulta.
  const liveMinutes =
    s && inside ? s.workedMinutesToday + Math.max(0, Math.floor((now.getTime() - statusQ.dataUpdatedAt) / 60_000)) : s?.workedMinutesToday ?? 0;

  const onMark = () => {
    if (!s || mark.isPending) return;
    mark.mutate(s.nextType, {
      onSuccess: (res) => {
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
    });
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

  return (
    <div className="space-y-5">
      <section className="text-center" aria-label="Fecha y hora actual">
        <p className="text-sm text-slate-500">{formatLongDate(now)}</p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight" aria-live="off">
          {formatTimeWithSeconds(now)}
        </p>
        <p className="mt-1 text-xs text-slate-400">Hora de Ecuador · la hora oficial la registra el servidor</p>
      </section>

      <section className="flex justify-center py-2">
        <button
          type="button"
          onClick={onMark}
          disabled={mark.isPending}
          aria-describedby="estado-actual"
          className={cn(
            'relative flex h-56 w-56 flex-col items-center justify-center rounded-full text-white shadow-xl transition active:scale-95 focus-visible:outline-4 focus-visible:outline-offset-4 disabled:opacity-80 sm:h-64 sm:w-64',
            isIn
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-700/30 focus-visible:outline-emerald-600'
              : 'bg-gradient-to-br from-rose-500 to-rose-700 shadow-rose-700/30 focus-visible:outline-rose-600',
          )}
        >
          {mark.isPending ? (
            <>
              <Spinner className="h-10 w-10" />
              <span className="mt-3 text-lg font-semibold">Registrando…</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {isIn ? (
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                ) : (
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                )}
              </svg>
              <span className="mt-3 text-2xl font-bold">{isIn ? 'Marcar ingreso' : 'Marcar salida'}</span>
            </>
          )}
        </button>
      </section>

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
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {s.lastMark ? formatTime(s.lastMark.timestamp) : '—'}
            </dd>
            <dd className="text-xs text-slate-500">
              {s.lastMark ? `${s.lastMark.type === 'IN' ? 'Ingreso' : 'Salida'} · ${relativeDayLabel(s.lastMark.timestamp)}` : 'Sin registros'}
            </dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-xs text-slate-500">Horas trabajadas hoy</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{formatMinutes(liveMinutes)}</dd>
            <dd className="text-xs text-slate-500">{inside ? 'Jornada abierta · en curso' : s.firstInToday ? `Ingreso ${formatTime(s.firstInToday)}` : '—'}</dd>
          </div>
        </dl>

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

      {shift && (
        <p className="text-center text-xs text-slate-500">
          Turno {shift.name}: {shift.startTime} – {shift.endTime} · tolerancia {shift.toleranceMinutes} min
        </p>
      )}
    </div>
  );
}
