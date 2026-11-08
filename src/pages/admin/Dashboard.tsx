import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from './AdminLayout';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  inputClass,
  Spinner,
  surfaceClass,
  TableCard,
  tableClass,
  tdClass,
  thClass,
} from '@/components/ui';
import { cn, presenceView } from '@/lib/styles';
import { Link } from 'react-router-dom';
import { PlanLabel } from '@/components/schedule';
import { useExpiring, useSites, useToday } from '@/hooks/admin';
import { useAuth } from '@/auth/auth';
import { SetupGuide } from './SetupGuide';
import { useNow } from '@/hooks/useNow';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import { formatLate, formatLongDate, formatMinutes, formatTime, relativeDayLabel } from '@/lib/time';
import type { AttendanceMarkedEvent, PresenceStatus, TodayItem, TodayResponse } from '@/lib/types';
import { useSocketEvent } from '@/realtime/socket';

type Filter = 'ALL' | PresenceStatus | 'LATE' | 'REST';

interface FeedItem extends AttendanceMarkedEvent {
  key: string;
}

export default function Dashboard() {
  const todayQ = useToday();
  const qc = useQueryClient();
  const now = useNow(30_000);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [q, setQ] = useState('');
  const [siteId, setSiteId] = useState('');
  const isAdmin = useAuth().user?.role === 'ADMIN';
  const sites = useSites();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [highlight, setHighlight] = useState<Record<string, number>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Actualización inmediata con el payload del evento; luego se revalida contra el servidor.
  useSocketEvent<AttendanceMarkedEvent>('attendance:marked', (ev) => {
    qc.setQueryData<TodayResponse>(qk.today, (prev) => {
      if (!prev) return prev;
      const items = prev.items.map((i) => (i.employee.id === ev.employee.id ? { ...i, ...ev.status } : i));
      return { ...prev, items, totals: computeTotals(items) };
    });
    setFeed((f) => [{ ...ev, key: ev.attendanceId }, ...f].slice(0, 30));
    setHighlight((h) => ({ ...h, [ev.employee.id]: Date.now() }));
    timers.current.push(
      window.setTimeout(
        () =>
          setHighlight((h) => {
            const { [ev.employee.id]: _omit, ...rest } = h;
            return rest;
          }),
        4000,
      ),
    );
  });

  const data = todayQ.data;
  // Filtro de sede: según dónde trabaja HOY (incluye a los trasladados a esa sede).
  const siteItems = useMemo(
    () => (data ? (siteId ? data.items.filter((i) => i.todaySite.site.id === siteId) : data.items) : []),
    [data, siteId],
  );
  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    return siteItems.filter((i) => {
      const resting = i.todayPlan.kind === 'REST' && i.status === 'NOT_MARKED';
      if (filter === 'LATE' && !i.isLate) return false;
      if (filter === 'REST' && i.todayPlan.kind !== 'REST') return false;
      if (filter === 'NOT_MARKED' && (i.status !== 'NOT_MARKED' || resting)) return false;
      if ((filter === 'INSIDE' || filter === 'OUTSIDE') && i.status !== filter) return false;
      if (term && !`${i.employee.fullName} ${i.employee.position} ${i.employee.documentId}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [siteItems, filter, q]);

  if (todayQ.isPending) {
    return (
      <div className="flex justify-center py-20 text-brand-700">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (todayQ.isError || !data) return <ErrorState message={errorMessage(todayQ.error)} onRetry={() => todayQ.refetch()} />;

  const t = siteId ? computeTotals(siteItems) : data.totals;
  const cards: { key: Filter; label: string; value: number; tone: string }[] = [
    { key: 'ALL', label: 'Empleados', value: t.employees, tone: 'text-ink' },
    { key: 'INSIDE', label: 'Dentro', value: t.inside, tone: 'text-brand-700' },
    { key: 'OUTSIDE', label: 'Fuera', value: t.outside, tone: 'text-slate-600' },
    { key: 'NOT_MARKED', label: 'Sin marcar', value: t.notMarked, tone: 'text-amber-700' },
    { key: 'LATE', label: 'Con atraso', value: t.late, tone: 'text-red-700' },
    { key: 'REST', label: 'Descansan hoy', value: t.resting, tone: 'text-slate-500' },
  ];

  return (
    <>
      <PageHeader title="Asistencia de hoy" description={`${formatLongDate(now)} · se actualiza en vivo`} />

      {isAdmin && <SetupGuide />}
      <RotationAlert />
      {t.unassigned > 0 && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
          {t.unassigned} {t.unassigned === 1 ? 'empleado no tiene' : 'empleados no tienen'} horario asignado hoy: no se les calcula atraso.{' '}
          <Link to="/admin/horarios" className="font-medium underline">
            Asignar horarios
          </Link>
        </p>
      )}

      <div className="stagger mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            aria-pressed={filter === c.key}
            className={cn(
              surfaceClass,
              'p-4 text-left transition-[transform,box-shadow] duration-300 ease-[var(--ease-apple)] hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-700',
              filter === c.key && 'ring-2 ring-brand-700/70',
            )}
          >
            <p className="text-[13px] font-medium text-slate-500">{c.label}</p>
            <p className={cn('mt-1 text-[34px] font-semibold leading-tight tracking-tight tabular-nums', c.tone)}>{c.value}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[1fr_320px]">
        <section aria-label="Estado de empleados" className="min-w-0">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor="dash-site">
                Sede
              </label>
              <select id="dash-site" className={cn(inputClass, 'sm:w-48')} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
                <option value="">Todas las sedes</option>
                {sites.data
                  ?.filter((s) => s.active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
              <label className="sr-only" htmlFor="dash-search">
                Buscar empleado
              </label>
              <input
                id="dash-search"
                type="search"
                placeholder="Buscar por nombre, cargo o cédula…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={cn(inputClass, 'sm:max-w-xs')}
              />
            </div>
            <p className="text-xs text-slate-500">
              Mostrando {items.length} de {siteItems.length} · actualizado {formatTime(new Date(todayQ.dataUpdatedAt))}
            </p>
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title="Aún no hay empleados registrados"
              description="Sigue los pasos de configuración en orden: Sedes → Turnos → Horarios → Empleados. Cada empleado entra con su correo y marca desde su celular."
            />
          ) : items.length === 0 ? (
            <EmptyState title="No hay empleados con este filtro" />
          ) : (
            <TableCard>
              <table className={tableClass}>
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className={thClass}>
                      Empleado
                    </th>
                    <th scope="col" className={thClass}>
                      Sede hoy
                    </th>
                    <th scope="col" className={thClass}>
                      Turno de hoy
                    </th>
                    <th scope="col" className={thClass}>
                      Estado
                    </th>
                    <th scope="col" className={thClass}>
                      Ingreso
                    </th>
                    <th scope="col" className={thClass}>
                      Última marca
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Horas hoy
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((i) => (
                    <Row key={i.employee.id} item={i} highlighted={!!highlight[i.employee.id]} />
                  ))}
                </tbody>
              </table>
            </TableCard>
          )}
        </section>

        <aside aria-label="Actividad reciente">
          <Card className="p-0">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold">Actividad en vivo</h2>
              <p className="text-xs text-slate-500">Marcaciones recibidas desde que abriste esta página</p>
            </div>
            {feed.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">Esperando marcaciones…</p>
            ) : (
              <ul className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto" aria-live="polite">
                {feed.map((f) => (
                  <li key={f.key} className="flex items-start gap-3 px-4 py-3 text-sm">
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', f.type === 'IN' ? 'bg-brand-700' : 'bg-ink')} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{f.employee.fullName}</p>
                      <p className="text-slate-600">
                        {f.type === 'IN' ? 'Marcó ingreso' : 'Marcó salida'} a las {formatTime(f.timestamp)}
                      </p>
                      {f.isLate && (
                        <Badge tone="red" className="mt-1">
                          Atraso {formatLate(f.lateMinutes)}
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}

function Row({ item: i, highlighted }: { item: TodayItem; highlighted: boolean }) {
  const view = presenceView[i.status];
  return (
    <tr className={cn('transition-colors duration-1000', highlighted ? 'bg-brand-50' : 'hover:bg-black/[0.015]')}>
      <td className={tdClass}>
        <p className="whitespace-nowrap font-medium">{i.employee.fullName}</p>
        <p className="text-xs text-slate-500">{i.employee.position}</p>
      </td>
      <td className={cn(tdClass, 'whitespace-nowrap text-sm')}>
        {i.todaySite.site.name}
        {i.todaySite.transferred && <span className="block text-xs text-brand-700">Traslado · base {i.todaySite.homeSite.name}</span>}
      </td>
      <td className={cn(tdClass, 'text-sm')}>
        <PlanLabel plan={i.todayPlan} withSchedule />
      </td>
      <td className={tdClass}>
        <div className="flex flex-wrap gap-1">
          {i.missingAfterStart ? (
            <Badge tone="red">No ha llegado</Badge>
          ) : i.status === 'NOT_MARKED' && i.todayPlan.kind === 'REST' ? (
            <Badge tone="slate">Descanso</Badge>
          ) : (
            <Badge tone={view.tone}>{view.label}</Badge>
          )}
          {i.status !== 'NOT_MARKED' && i.todayPlan.kind === 'REST' && <Badge tone="sky">En día de descanso</Badge>}
          {i.isLate && <Badge tone="red">Atraso {formatLate(i.lateMinutes)}</Badge>}
        </div>
      </td>
      <td className={cn(tdClass, 'tabular-nums')}>{formatTime(i.firstInToday)}</td>
      <td className={cn(tdClass, 'whitespace-nowrap tabular-nums text-slate-600')}>
        {i.lastMark ? (
          <>
            {i.lastMark.type === 'IN' ? 'Ingreso' : 'Salida'} {formatTime(i.lastMark.timestamp)}
            <p className="text-xs text-slate-400">{relativeDayLabel(i.lastMark.timestamp)}</p>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className={cn(tdClass, 'whitespace-nowrap text-right tabular-nums')}>
        {formatMinutes(i.workedMinutesToday)}
        {i.status === 'INSIDE' && <p className="text-xs text-sky-700">en curso</p>}
      </td>
    </tr>
  );
}

function computeTotals(items: TodayItem[]): TodayResponse['totals'] {
  return {
    employees: items.length,
    inside: items.filter((i) => i.status === 'INSIDE').length,
    outside: items.filter((i) => i.status === 'OUTSIDE').length,
    notMarked: items.filter((i) => i.status === 'NOT_MARKED' && i.todayPlan.kind !== 'REST').length,
    late: items.filter((i) => i.isLate).length,
    resting: items.filter((i) => i.todayPlan.kind === 'REST').length,
    unassigned: items.filter((i) => i.todayPlan.kind === 'UNASSIGNED').length,
  };
}

/** Aviso de rotaciones que terminan en 14 días sin un horario siguiente. */
function RotationAlert() {
  const q = useExpiring(14);
  const n = q.data?.length ?? 0;
  if (!n) return null;
  const first = q.data![0];
  return (
    <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
      <strong>
        {n} {n === 1 ? 'empleado termina' : 'empleados terminan'} su rotación
      </strong>{' '}
      en los próximos 14 días sin horario siguiente (el primero: {first.employee.fullName}, {first.endDate.split('-').reverse().join('/')}).{' '}
      <Link to="/admin/horarios" className="font-medium underline">
        Planificar rotación
      </Link>
    </p>
  );
}
