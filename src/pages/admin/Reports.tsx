import { Fragment, useState } from 'react';
import { PageHeader } from './AdminLayout';
import { useToast } from '@/components/toast';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  inputClass,
  Spinner,
  TableCard,
  tableClass,
  tdClass,
  thClass,
} from '@/components/ui';
import { cn } from '@/lib/styles';
import { PlanLabel } from '@/components/schedule';
import { useAttendanceReport, useEmployees, useSites } from '@/hooks/admin';
import { api, errorMessage } from '@/lib/api';
import { formatDayKey, formatLate, formatMinutes, formatMinutesShort, formatTime, todayKey } from '@/lib/time';

const firstOfMonth = () => `${todayKey().slice(0, 7)}-01`;

export default function Reports() {
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(todayKey);
  const [employeeId, setEmployeeId] = useState('');
  const [siteId, setSiteId] = useState('');
  const sites = useSites();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();
  const employees = useEmployees({ active: 'all' });

  const validRange = !!from && !!to && from <= to;
  const report = useAttendanceReport({ from, to, employeeId: employeeId || undefined, siteId: siteId || undefined }, validRange);
  const data = report.data;

  // El Excel es mensual: una hoja de resumen y una hoja por colaborador con todos los días del mes.
  const [month, setMonth] = useState(() => todayKey().slice(0, 7));
  const exportXlsx = async () => {
    if (!month) return;
    setDownloading(true);
    try {
      const range = monthRange(month);
      const search = new URLSearchParams(range);
      if (employeeId) search.set('employeeId', employeeId);
      if (siteId) search.set('siteId', siteId);
      await api.download(`/reports/attendance/export?${search}`, `asistencia_${month}.xlsx`);
      toast.success('Reporte exportado', `Se descargó el Excel de ${monthLabel(month)}.`);
    } catch (err) {
      toast.error('No se pudo exportar', errorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const presets = [
    { label: 'Hoy', from: todayKey(), to: todayKey() },
    { label: 'Últimos 7 días', from: daysAgo(6), to: todayKey() },
    { label: 'Este mes', from: firstOfMonth(), to: todayKey() },
    { label: 'Mes anterior', ...previousMonth() },
  ];

  return (
    <>
      <PageHeader
        title="Reportes"
        description="Marcaciones, horas trabajadas y atrasos por rango de fechas (hora de Ecuador)."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="r-month" className="sr-only">
              Mes a exportar
            </label>
            <input
              id="r-month"
              type="month"
              className={cn(inputClass, 'w-auto py-2')}
              value={month}
              max={todayKey().slice(0, 7)}
              onChange={(e) => setMonth(e.target.value)}
            />
            <Button onClick={exportXlsx} loading={downloading} disabled={!month}>
              Exportar mes a Excel
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Desde" htmlFor="r-from">
            <input id="r-from" type="date" className={inputClass} value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="r-to" error={!validRange ? 'La fecha final debe ser igual o posterior a la inicial.' : undefined}>
            <input
              id="r-to"
              type="date"
              className={inputClass}
              value={to}
              min={from}
              max={todayKey()}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
          <Field label="Sede" htmlFor="r-site" hint="Días trabajados en esa sede (incluye traslados).">
            <select id="r-site" className={inputClass} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Todas las sedes</option>
              {sites.data?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="lg:col-span-2">
            <Field label="Empleado" htmlFor="r-emp">
              <select id="r-emp" className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                <option value="">Todos los empleados</option>
                {employees.data?.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.fullName}
                    {e.active ? '' : ' (inactivo)'}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setFrom(p.from);
                setTo(p.to);
              }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium ring-1',
                from === p.from && to === p.to
                  ? 'bg-brand-50 text-brand-800 ring-brand-600/30'
                  : 'text-slate-600 ring-slate-300 hover:bg-slate-50',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Card>

      {!validRange ? null : report.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : report.isError ? (
        <ErrorState message={errorMessage(report.error)} onRetry={() => report.refetch()} />
      ) : data ? (
        <div className={cn('transition-opacity', report.isFetching && 'opacity-60')} aria-busy={report.isFetching}>
          <dl className="stagger mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <Stat label="Horas trabajadas" value={formatMinutesShort(data.totals.workedMinutes)} />
            <Stat label="Horas suplementarias" value={formatMinutesShort(data.totals.overtimeMinutes)} />
            <Stat label="Días trabajados" value={`${data.totals.daysWorked} / ${data.totals.scheduledDays}`} />
            <Stat label="Ausencias" value={data.totals.absences} tone={data.totals.absences ? 'text-red-700' : undefined} />
            <Stat label="Días con atraso" value={data.totals.lateDays} tone={data.totals.lateDays ? 'text-red-700' : undefined} />
            <Stat label="Minutos de atraso" value={data.totals.lateMinutes} tone={data.totals.lateMinutes ? 'text-red-700' : undefined} />
            <Stat
              label="Jornadas abiertas"
              value={data.totals.openSessions}
              tone={data.totals.openSessions ? 'text-amber-700' : undefined}
            />
          </dl>

          {data.employees.length === 0 ? (
            <EmptyState title="No hay datos para este filtro" />
          ) : (
            <TableCard>
              <table className={tableClass}>
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className={thClass}>
                      Empleado
                    </th>
                    <th scope="col" className={thClass}>
                      Sede base
                    </th>
                    <th scope="col" className={thClass}>
                      Horario
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      <abbr title="Días trabajados / días programados">Días</abbr>
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Ausencias
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Horas
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Atrasos
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Min. atraso
                    </th>
                    <th scope="col" className={cn(thClass, 'text-right')}>
                      Abiertas
                    </th>
                    <th scope="col" className={thClass}>
                      <span className="sr-only">Detalle</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.employees.map((e) => {
                    const open = expanded === e.employee.id;
                    return (
                      <Fragment key={e.employee.id}>
                        <tr className="hover:bg-slate-50">
                          <td className={tdClass}>
                            <p className="font-medium">
                              {e.employee.fullName} {!e.employee.active && <Badge>Inactivo</Badge>}
                            </p>
                            <p className="text-xs text-slate-500">
                              {e.employee.documentId} · {e.employee.position}
                            </p>
                          </td>
                          <td className={cn(tdClass, 'whitespace-nowrap text-slate-600')}>{e.employee.homeSite.name}</td>
                          <td className={cn(tdClass, 'text-slate-600')}>
                            {e.employee.schedules.join(', ') || <span className="text-slate-400">Sin horario</span>}
                          </td>
                          <td className={cn(tdClass, 'whitespace-nowrap text-right tabular-nums')}>
                            {e.totals.daysWorked} / {e.totals.scheduledDays}
                          </td>
                          <td className={cn(tdClass, 'text-right tabular-nums', e.totals.absences > 0 && 'font-medium text-red-700')}>
                            {e.totals.absences}
                          </td>
                          <td className={cn(tdClass, 'text-right tabular-nums font-medium')}>
                            {formatMinutesShort(e.totals.workedMinutes)}
                          </td>
                          <td className={cn(tdClass, 'text-right tabular-nums', e.totals.lateDays > 0 && 'text-red-700')}>
                            {e.totals.lateDays}
                          </td>
                          <td className={cn(tdClass, 'text-right tabular-nums')}>{e.totals.lateMinutes}</td>
                          <td className={cn(tdClass, 'text-right tabular-nums', e.totals.openSessions > 0 && 'text-amber-700')}>
                            {e.totals.openSessions}
                          </td>
                          <td className={cn(tdClass, 'text-right')}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-expanded={open}
                              aria-controls={`detail-${e.employee.id}`}
                              onClick={() => setExpanded(open ? null : e.employee.id)}
                              disabled={e.days.length === 0}
                            >
                              {open ? 'Ocultar' : 'Ver días'}
                            </Button>
                          </td>
                        </tr>
                        {open && (
                          <tr id={`detail-${e.employee.id}`}>
                            <td colSpan={10} className="bg-slate-50 px-4 py-3">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-xs text-slate-500">
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Fecha
                                    </th>
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Sede
                                    </th>
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Turno programado
                                    </th>
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Ingreso
                                    </th>
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Salida
                                    </th>
                                    <th scope="col" className="py-1 pr-4 font-medium">
                                      Marcaciones
                                    </th>
                                    <th scope="col" className="py-1 pr-4 text-right font-medium">
                                      Horas
                                    </th>
                                    <th scope="col" className="py-1 font-medium">
                                      Observaciones
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {e.days.map((d) => (
                                    <tr key={d.date} className="border-t border-slate-200">
                                      <td className="py-1.5 pr-4">{formatDayKey(d.date)}</td>
                                      <td className="whitespace-nowrap py-1.5 pr-4">
                                        {d.site.name}
                                        {d.site.id !== e.employee.homeSite.id && (
                                          <span className="ml-1 text-xs text-brand-700">(traslado)</span>
                                        )}
                                      </td>
                                      <td className="py-1.5 pr-4">
                                        <PlanLabel plan={d.plan} />
                                      </td>
                                      <td className="py-1.5 pr-4 tabular-nums">{formatTime(d.firstIn)}</td>
                                      <td className="py-1.5 pr-4 tabular-nums">{formatTime(d.lastOut)}</td>
                                      <td className="py-1.5 pr-4 text-xs tabular-nums text-slate-600">
                                        {d.marks.map((m) => `${m.type === 'IN' ? 'E' : 'S'} ${formatTime(m.timestamp)}`).join(' · ')}
                                      </td>
                                      <td className="py-1.5 pr-4 text-right tabular-nums">{formatMinutes(d.workedMinutes)}</td>
                                      <td className="py-1.5">
                                        <div className="flex flex-wrap gap-1">
                                          {d.isLate && <Badge tone="red">Atraso {formatLate(d.lateMinutes)}</Badge>}
                                          {d.preEntryMinutes > 0 && <Badge tone="sky">Preingreso {formatLate(d.preEntryMinutes)}</Badge>}
                                          {d.overtimeMinutes > 0 && (
                                            <Badge tone="brand">Suplementarias {formatLate(d.overtimeMinutes)}</Badge>
                                          )}
                                          {d.openSession && <Badge tone="amber">Jornada abierta</Badge>}
                                          {d.absent && <Badge tone="red">Ausente</Badge>}
                                          {!d.absent && d.plan.kind === 'REST' && <Badge tone="sky">Trabajó en descanso</Badge>}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </TableCard>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Período {data.from} a {data.to} · {data.totals.marks} marcaciones · zona horaria {data.timezone}
          </p>
        </div>
      ) : null}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <Card className="p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={cn('mt-1 text-[28px] font-semibold leading-tight tracking-tight tabular-nums', tone)}>{value}</dd>
    </Card>
  );
}

function daysAgo(n: number) {
  const [y, m, d] = todayKey().split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - n));
  return dt.toISOString().slice(0, 10);
}

/** "2026-11" → { from: "2026-11-01", to: "2026-11-30" }. */
function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

/** "2026-11" → "noviembre de 2026". */
function monthLabel(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function previousMonth() {
  const [y, m] = todayKey().split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 2, 1));
  const end = new Date(Date.UTC(y, m - 1, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}
