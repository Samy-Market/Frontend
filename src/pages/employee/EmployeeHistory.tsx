import { useMemo, useState } from 'react';
import { Badge, Card, ErrorState, Spinner } from '@/components/ui';
import { justificationLabel, justificationTone } from '@/lib/styles';
import { useMyJustifications, useMyMonth } from '@/hooks/employee';
import { errorMessage } from '@/lib/api';
import {
  currentMonth,
  formatDayKey,
  formatLate,
  formatMinutes,
  formatMinutesShort,
  formatMonth,
  formatTime,
  shiftMonth,
  todayKey,
} from '@/lib/time';
import type { Justification } from '@/lib/types';
import { JustifyModal, JustifyTarget } from './JustifyModal';

export default function EmployeeHistory() {
  const [month, setMonth] = useState(currentMonth);
  const monthQ = useMyMonth(month);
  const justQ = useMyJustifications();
  const [justifying, setJustifying] = useState<JustifyTarget | null>(null);

  const byAttendance = useMemo(() => {
    const map = new Map<string, Justification>();
    for (const j of justQ.data ?? []) if (j.attendanceId && !map.has(j.attendanceId)) map.set(j.attendanceId, j);
    return map;
  }, [justQ.data]);
  const byDate = useMemo(() => {
    const map = new Map<string, Justification>();
    for (const j of justQ.data ?? []) if (j.date && !map.has(j.date)) map.set(j.date, j);
    return map;
  }, [justQ.data]);

  const isCurrent = month === currentMonth();
  const data = monthQ.data;
  const days = data ? [...data.days].reverse() : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Mes anterior"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold" aria-live="polite">
          {formatMonth(month)}
        </h1>
        <button
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          disabled={isCurrent}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          →
        </button>
      </div>

      {monthQ.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : monthQ.isError ? (
        <ErrorState message={errorMessage(monthQ.error)} onRetry={() => monthQ.refetch()} />
      ) : (
        <>
          <dl className="grid grid-cols-4 gap-2 text-center">
            <Card className="p-3">
              <dt className="text-xs text-slate-500">Horas</dt>
              <dd className="mt-1 text-lg font-semibold tabular-nums">{formatMinutesShort(data!.totalWorkedMinutes)}</dd>
            </Card>
            <Card className="p-3">
              <dt className="text-xs text-slate-500">Días</dt>
              <dd className="mt-1 text-lg font-semibold">{data!.daysWorked}</dd>
            </Card>
            <Card className="p-3">
              <dt className="text-xs text-slate-500">Atrasos</dt>
              <dd className={`mt-1 text-lg font-semibold ${data!.lateDays ? 'text-amber-700' : ''}`}>{data!.lateDays}</dd>
            </Card>
            <Card className="p-3">
              <dt className="text-xs text-slate-500">Ausencias</dt>
              <dd className={`mt-1 text-lg font-semibold ${data!.absences ? 'text-red-700' : ''}`}>{data!.absences}</dd>
            </Card>
          </dl>

          {days.length === 0 ? (
            <Card>
              <p className="py-6 text-center text-sm text-slate-500">No hay marcaciones en este mes.</p>
            </Card>
          ) : (
            <ul className="stagger space-y-3">
              {days.map((d) => {
                const isToday = d.date === todayKey();
                const inProgress = isToday && d.sessions.some((s) => s.open && !s.stale);
                const abandoned = d.sessions.some((s) => s.stale);
                return (
                  <li key={d.date}>
                    <Card className="p-0">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                        <div>
                          <p className="font-medium">
                            {formatDayKey(d.date)} {isToday && <span className="text-xs font-normal text-brand-700">(hoy)</span>}
                          </p>
                          <p className="text-xs text-slate-500">
                            {d.plan.kind === 'WORK' && d.plan.shift
                              ? `Turno ${d.plan.shift.name} ${d.plan.shift.startTime}–${d.plan.shift.endTime}`
                              : d.plan.kind === 'REST'
                                ? 'Día de descanso'
                                : 'Sin horario'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {d.isLate && !d.lateJustified && <Badge tone="amber">Atraso {formatLate(d.lateMinutes)}</Badge>}
                            {d.lateJustified && <Badge tone="green">Atraso {formatLate(d.lateMinutes)} justificado</Badge>}
                            {d.preEntryMinutes > 0 && <Badge tone="sky">Preingreso {formatLate(d.preEntryMinutes)}</Badge>}
                            {inProgress && <Badge tone="sky">Jornada en curso</Badge>}
                            {abandoned && <Badge tone="red">Jornada abierta (sin salida)</Badge>}
                            {d.absent && <Badge tone="red">Ausente</Badge>}
                            {d.absenceJustified && <Badge tone="green">Ausencia justificada</Badge>}
                            {d.dayOff && <Badge tone="green">{d.dayOff.label}</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold tabular-nums">{formatMinutesShort(d.workedMinutes)}</p>
                          <p className="text-xs text-slate-500">horas</p>
                        </div>
                      </div>
                      {(d.absent || d.absenceJustified) && (
                        <div className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                          <p className="text-slate-500">No hay marcaciones este día.</p>
                          {byDate.get(d.date) ? (
                            <Badge tone={justificationTone[byDate.get(d.date)!.status]}>
                              Solicitud {justificationLabel[byDate.get(d.date)!.status].toLowerCase()}
                            </Badge>
                          ) : (
                            <button
                              onClick={() => setJustifying({ kind: 'absence', date: d.date })}
                              className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                            >
                              Justificar
                            </button>
                          )}
                        </div>
                      )}
                      <ul className="divide-y divide-slate-100">
                        {d.records.map((r) => {
                          const j = byAttendance.get(r.id);
                          return (
                            <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${r.type === 'IN' ? 'bg-brand-700' : 'bg-ink'}`} aria-hidden />
                                <span className="w-14 font-medium">{r.type === 'IN' ? 'Ingreso' : 'Salida'}</span>
                                <span className="tabular-nums text-slate-700">{formatTime(r.timestamp)}</span>
                              </div>
                              {j ? (
                                <Badge tone={justificationTone[j.status]}>Solicitud {justificationLabel[j.status].toLowerCase()}</Badge>
                              ) : (
                                <button
                                  onClick={() => setJustifying({ kind: 'mark', record: r })}
                                  className="rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                                >
                                  Justificar
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-center text-xs text-slate-500">Total del mes: {formatMinutes(data!.totalWorkedMinutes)}</p>
        </>
      )}

      <JustifyModal
        key={justifying ? (justifying.kind === 'mark' ? justifying.record.id : justifying.date) : 'closed'}
        target={justifying}
        onClose={() => setJustifying(null)}
      />
    </div>
  );
}
