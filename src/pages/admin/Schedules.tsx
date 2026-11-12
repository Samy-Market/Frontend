import { FormEvent, useMemo, useState } from 'react';
import { formKey } from '@/lib/form';
import { Link } from 'react-router-dom';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
import { WeekGrid } from '@/components/schedule';
import { shiftHours, WEEKDAYS_LONG } from '@/lib/schedule';
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputClass, Modal, Spinner } from '@/components/ui';
import { cn } from '@/lib/styles';
import {
  ScheduleInput,
  useAssignSchedule,
  useDeleteSchedule,
  useEmployees,
  useExpiring,
  useSaveSchedule,
  useScheduleMembers,
  useSchedules,
  useShifts,
  useUnassign,
  useUnassignPreview,
} from '@/hooks/admin';
import { UnassignSummary } from '@/components/UnassignSummary';
import { ConfirmDelete } from '@/components/ConfirmDelete';
import { ApiError, errorMessage } from '@/lib/api';
import { addDaysKey, addMonthsKey, daysUntil, formatDayKeyNumeric, todayKey } from '@/lib/time';
import type { ExpiringAssignment, Schedule } from '@/lib/types';

export default function Schedules() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN';
  const schedules = useSchedules();
  const shifts = useShifts();
  const [editing, setEditing] = useState<Schedule | 'new' | null>(null);
  const [assigning, setAssigning] = useState<AssignPreset | null>(null);
  const [viewing, setViewing] = useState<Schedule | null>(null);
  const deleteSchedule = useDeleteSchedule();
  const shiftOrder = useMemo(() => (shifts.data ?? []).map((s) => s.id), [shifts.data]);
  const noShifts = shifts.data?.length === 0;

  return (
    <>
      <PageHeader
        title="Horarios rotativos"
        description="Plantillas semanales que se repiten durante cada rotación (por ejemplo, 3 meses). Asígnalas a los empleados con fecha de inicio y fin."
        actions={
          canEdit && (
            <>
              <Button variant="secondary" onClick={() => setAssigning({})} disabled={!schedules.data?.some((s) => s.active)}>
                Asignar horario
              </Button>
              <Button onClick={() => setEditing('new')} disabled={noShifts}>
                + Nuevo horario
              </Button>
            </>
          )
        }
      />

      {noShifts && (
        <div className="mb-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Primero crea los turnos (por ejemplo, “Mañana 08:00–18:00” y “Tarde 11:00–21:00”) en{' '}
          <Link to="/admin/turnos" className="font-medium underline">
            Turnos
          </Link>
          . Luego arma aquí la semana combinándolos.
        </div>
      )}

      <ExpiringPanel canEdit={canEdit} onPlan={(items) => setAssigning(presetFromExpiring(items))} />

      {schedules.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : schedules.isError ? (
        <ErrorState message={errorMessage(schedules.error)} onRetry={() => schedules.refetch()} />
      ) : schedules.data.length === 0 ? (
        <EmptyState
          title="Aún no hay horarios"
          description="Crea uno por cada patrón semanal que use tu personal, por ejemplo “Rotación A: L mañana, M tarde, X mañana…”."
        />
      ) : (
        <ul className="stagger grid gap-4 2xl:grid-cols-2">
          {schedules.data.map((s) => (
            <li key={s.id}>
              <Card className={cn('flex h-full flex-col gap-4', !s.active && 'opacity-70')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                      {s.name}
                      {!s.active && <Badge>Inactivo</Badge>}
                    </h2>
                    {s.description && <p className="text-sm text-slate-600">{s.description}</p>}
                  </div>
                  <Badge tone={s.currentEmployees ? 'brand' : 'slate'} className="shrink-0">
                    {s.currentEmployees ?? 0} {s.currentEmployees === 1 ? 'empleado' : 'empleados'} hoy
                  </Badge>
                </div>
                <WeekGrid schedule={s} shiftOrder={shiftOrder} />
                <div className="mt-auto flex flex-wrap gap-2">
                  {canEdit && (
                    <Button size="sm" onClick={() => setAssigning({ scheduleId: s.id })} disabled={!s.active}>
                      Asignar a empleados
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setViewing(s)}>
                    Ver asignados
                  </Button>
                  {canEdit && (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                        Editar
                      </Button>
                      <ConfirmDelete
                        what="horario"
                        name={s.name}
                        blockedReason={
                          s.currentEmployees
                            ? `Lo usan ${s.currentEmployees} ${s.currentEmployees === 1 ? 'empleado' : 'empleados'} hoy. Quítalos primero con "Ver asignados".`
                            : null
                        }
                        onDelete={() => deleteSchedule.mutateAsync(s.id)}
                      >
                        <p className="text-slate-500">Solo se puede eliminar un horario que nunca se asignó. Si ya se usó, desactívalo.</p>
                      </ConfirmDelete>
                    </>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <>
          <ScheduleForm key={formKey('schedule', editing)} schedule={editing} onClose={() => setEditing(null)} />
          <AssignModal key={formKey('assign', !!assigning)} preset={assigning} onClose={() => setAssigning(null)} />
        </>
      )}
      <MembersModal key={viewing?.id ?? 'none'} schedule={viewing} canEdit={canEdit} onClose={() => setViewing(null)} />
    </>
  );
}

function ExpiringPanel({ canEdit, onPlan }: { canEdit: boolean; onPlan: (items: ExpiringAssignment[]) => void }) {
  const q = useExpiring(30);
  if (!q.data || q.data.length === 0) return null;

  const groups = new Map<string, ExpiringAssignment[]>();
  for (const e of q.data) groups.set(e.endDate, [...(groups.get(e.endDate) ?? []), e]);

  return (
    <section aria-labelledby="expiring-title" className="mb-6 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <h2 id="expiring-title" className="font-semibold text-amber-900">
        Rotaciones por terminar ({q.data.length})
      </h2>
      <p className="text-sm text-amber-900/80">
        Estos empleados terminan su horario en los próximos 30 días y todavía no tienen el siguiente asignado.
      </p>
      <ul className="mt-3 space-y-2">
        {[...groups.entries()].map(([endDate, items]) => {
          const n = daysUntil(endDate);
          return (
            <li key={endDate} className="flex flex-col gap-2 rounded-xl bg-white/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-medium">
                  Terminan el {formatDayKeyNumeric(endDate)}{' '}
                  <span className="text-amber-800">({n === 0 ? 'hoy' : n === 1 ? 'mañana' : `en ${n} días`})</span>
                </p>
                <p className="text-slate-600">{items.map((i) => `${i.employee.fullName} (${i.schedule.name})`).join(', ')}</p>
              </div>
              {canEdit && (
                <Button size="sm" variant="secondary" onClick={() => onPlan(items)}>
                  Asignar siguiente rotación
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const emptyDays = () => WEEKDAYS_LONG.map((_, i) => ({ weekday: i + 1, shiftId: null as string | null }));

function ScheduleForm({ schedule, onClose }: { schedule: Schedule | 'new' | null; onClose: () => void }) {
  const isNew = schedule === 'new';
  const shifts = useShifts();
  const save = useSaveSchedule();
  const toast = useToast();
  const [form, setForm] = useState<ScheduleInput>(() =>
    schedule && schedule !== 'new'
      ? {
          name: schedule.name,
          description: schedule.description ?? '',
          active: schedule.active,
          days: emptyDays().map((d) => ({ ...d, shiftId: schedule.days.find((x) => x.weekday === d.weekday)?.shiftId ?? null })),
        }
      : { name: '', description: '', active: true, days: emptyDays() },
  );
  const [errors, setErrors] = useState<string[]>([]);
  const shiftList = shifts.data ?? [];
  const shiftOrder = shiftList.map((s) => s.id);

  const setDay = (weekday: number, shiftId: string | null) =>
    setForm((f) => ({ ...f, days: f.days.map((d) => (d.weekday === weekday ? { ...d, shiftId } : d)) }));

  const preview = {
    days: form.days.map((d) => ({ ...d, shift: shiftList.find((s) => s.id === d.shiftId) ?? null })),
  };
  const workDays = form.days.filter((d) => d.shiftId).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setErrors(['El nombre del horario es obligatorio.']);
    if (workDays === 0) return setErrors(['El horario debe tener al menos un día de trabajo.']);
    save.mutate(
      { id: isNew ? undefined : (schedule as Schedule).id, data: { ...form, description: form.description?.trim() || null } },
      {
        onSuccess: (s) => {
          toast.success(isNew ? 'Horario creado' : 'Horario actualizado', `${s.name}${isNew ? ': ahora asígnalo a los empleados.' : ''}`);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={!!schedule}
      onClose={onClose}
      size="lg"
      title={isNew ? 'Nuevo horario rotativo' : 'Editar horario'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="schedule-form" loading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="sc-name" hint="Ej.: Rotación A, Cajeros grupo 1…">
            <input
              id="sc-name"
              className={inputClass}
              value={form.name}
              maxLength={80}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Descripción (opcional)" htmlFor="sc-desc">
            <input
              id="sc-desc"
              className={inputClass}
              value={form.description ?? ''}
              maxLength={300}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">Turno de cada día ({workDays} días de trabajo)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {form.days.map((d) => (
              <label key={d.weekday} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                <span className="w-24 shrink-0 text-sm font-medium">{WEEKDAYS_LONG[d.weekday - 1]}</span>
                <select
                  className={inputClass}
                  value={d.shiftId ?? ''}
                  onChange={(e) => setDay(d.weekday, e.target.value || null)}
                  aria-label={`Turno del ${WEEKDAYS_LONG[d.weekday - 1]}`}
                >
                  <option value="">Descanso</option>
                  {shiftList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({shiftHours(s)})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Vista previa</p>
          <WeekGrid schedule={preview} shiftOrder={shiftOrder} />
        </div>

        {!isNew && (
          <div className="flex items-center gap-2">
            <input
              id="sc-active"
              type="checkbox"
              className="h-4 w-4 accent-brand-700"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="sc-active" className="text-sm">
              Activo (se puede asignar a empleados)
            </label>
          </div>
        )}
        {!isNew && (
          <p className="text-xs text-slate-500">
            Los cambios se aplican a todos los empleados que usan este horario, desde ahora. Los atrasos ya registrados no cambian.
          </p>
        )}

        {errors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((er) => (
              <li key={er}>{er}</li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}

export interface AssignPreset {
  scheduleId?: string;
  employeeIds?: string[];
  startDate?: string;
}

function presetFromExpiring(items: ExpiringAssignment[]): AssignPreset {
  const start = addDaysKey(items[0].endDate, 1);
  return { employeeIds: items.map((i) => i.employee.id), startDate: start };
}

type Duration = '3' | '1' | '6' | 'custom' | 'open';

export function AssignModal({ preset, onClose }: { preset: AssignPreset | null; onClose: () => void }) {
  const schedules = useSchedules();
  const employees = useEmployees({ active: 'true' });
  const assign = useAssignSchedule();
  const toast = useToast();
  const [scheduleId, setScheduleId] = useState(preset?.scheduleId ?? '');
  const [startDate, setStartDate] = useState(preset?.startDate ?? todayKey());
  const [duration, setDuration] = useState<Duration>('3');
  const [customEnd, setCustomEnd] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(preset?.employeeIds ?? []));
  const [q, setQ] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const endDate =
    duration === 'open'
      ? null
      : duration === 'custom'
        ? customEnd || null
        : startDate
          ? addDaysKey(addMonthsKey(startDate, Number(duration)), -1)
          : null;

  const list = (employees.data ?? []).filter((e) => {
    const t = q.trim().toLowerCase();
    return !t || `${e.fullName} ${e.position} ${e.documentId}`.toLowerCase().includes(t);
  });
  const allFilteredSelected = list.length > 0 && list.every((e) => selected.has(e.id));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      list.forEach((e) => (allFilteredSelected ? n.delete(e.id) : n.add(e.id)));
      return n;
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    if (!scheduleId) local.push('Elige el horario.');
    if (!startDate) local.push('Indica la fecha de inicio.');
    if (duration === 'custom' && !customEnd) local.push('Indica la fecha de fin o elige otra duración.');
    if (endDate && startDate && endDate < startDate) local.push('La fecha de fin no puede ser anterior a la de inicio.');
    if (selected.size === 0) local.push('Selecciona al menos un empleado.');
    if (local.length) return setErrors(local);
    setErrors([]);
    assign.mutate(
      { scheduleId, employeeIds: [...selected], startDate, endDate },
      {
        onSuccess: (r) => {
          const parts = [`${r.assigned} ${r.assigned === 1 ? 'empleado' : 'empleados'}`];
          if (r.closedPrevious) parts.push(`se cerró el horario anterior de ${r.closedPrevious}`);
          toast.success('Horario asignado', parts.join('; ') + '.');
          if (r.inactiveEmployees.length) toast.warning('Empleados inactivos', r.inactiveEmployees.join(', '));
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  const activeSchedules = (schedules.data ?? []).filter((s) => s.active);

  return (
    <Modal
      open={!!preset}
      onClose={onClose}
      size="lg"
      title="Asignar horario"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="assign-form" loading={assign.isPending}>
            Asignar a {selected.size} {selected.size === 1 ? 'empleado' : 'empleados'}
          </Button>
        </>
      }
    >
      <form id="assign-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Horario" htmlFor="as-schedule">
          <select id="as-schedule" className={inputClass} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            <option value="">Elige un horario…</option>
            {activeSchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Desde" htmlFor="as-start">
            <input id="as-start" type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Duración" htmlFor="as-duration">
            <select id="as-duration" className={inputClass} value={duration} onChange={(e) => setDuration(e.target.value as Duration)}>
              <option value="1">1 mes</option>
              <option value="3">3 meses</option>
              <option value="6">6 meses</option>
              <option value="custom">Hasta una fecha…</option>
              <option value="open">Sin fecha de fin</option>
            </select>
          </Field>
          {duration === 'custom' ? (
            <Field label="Hasta" htmlFor="as-end">
              <input
                id="as-end"
                type="date"
                min={startDate}
                className={inputClass}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </Field>
          ) : (
            <div className="space-y-1">
              <p className="block text-sm font-medium text-slate-700">Hasta</p>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm">{endDate ? formatDayKeyNumeric(endDate) : 'Sin fecha de fin'}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Si un empleado ya tiene un horario vigente, ese horario terminará automáticamente el día anterior al inicio.
        </p>

        <fieldset>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-medium text-slate-700">Empleados ({selected.size} seleccionados)</legend>
            <div className="flex items-center gap-2">
              <label htmlFor="as-q" className="sr-only">
                Buscar empleado
              </label>
              <input
                id="as-q"
                type="search"
                placeholder="Buscar…"
                className={cn(inputClass, 'w-44')}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="button" size="sm" variant="ghost" onClick={toggleAll} disabled={list.length === 0}>
                {allFilteredSelected ? 'Quitar todos' : 'Marcar todos'}
              </Button>
            </div>
          </div>
          <ul className="max-h-64 divide-y divide-black/5 overflow-y-auto rounded-2xl ring-1 ring-black/10">
            {employees.isPending ? (
              <li className="flex justify-center py-6 text-brand-700">
                <Spinner />
              </li>
            ) : list.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">No hay empleados activos con ese filtro.</li>
            ) : (
              list.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-700"
                      checked={selected.has(e.id)}
                      onChange={() => toggle(e.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{e.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">{e.position}</span>
                    </span>
                    <span className="shrink-0 text-right text-xs text-slate-500">
                      {e.currentSchedule ? (
                        <>
                          {e.currentSchedule.scheduleName}
                          <span className="block">
                            {e.currentSchedule.endDate ? `hasta ${formatDayKeyNumeric(e.currentSchedule.endDate)}` : 'sin fin'}
                          </span>
                        </>
                      ) : (
                        <Badge tone="amber">Sin horario</Badge>
                      )}
                    </span>
                  </label>
                </li>
              ))
            )}
          </ul>
        </fieldset>

        {errors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((er) => (
              <li key={er}>{er}</li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}

function MembersModal({ schedule, canEdit, onClose }: { schedule: Schedule | null; canEdit: boolean; onClose: () => void }) {
  const members = useScheduleMembers(schedule?.id ?? null);
  const unassign = useUnassign();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [restore, setRestore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const list = members.data ?? [];
  const today = todayKey();
  const removable = list.filter((m) => m.endDate !== today);
  const chosen = removable.filter((m) => selected.has(m.id));
  const preview = useUnassignPreview(confirming ? chosen.map((m) => m.id) : []);
  const allSelected = removable.length > 0 && chosen.length === removable.length;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const remove = () =>
    unassign.mutate(
      { ids: chosen.map((m) => m.id), restorePrevious: restore },
      {
        onSuccess: (r) => {
          const parts = [
            r.ended && `${r.ended} ${r.ended === 1 ? 'termina' : 'terminan'} hoy`,
            r.deleted && `${r.deleted} ${r.deleted === 1 ? 'próximo eliminado' : 'próximos eliminados'}`,
            r.restored && `${r.restored} ${r.restored === 1 ? 'vuelve' : 'vuelven'} a su horario anterior`,
          ]
            .filter(Boolean)
            .join(' · ');
          toast.success('Empleados quitados del horario', parts || undefined);
          setSelected(new Set());
          setConfirming(false);
        },
        onError: (err) => {
          setError(errorMessage(err));
          setConfirming(false);
        },
      },
    );

  return (
    <Modal
      open={!!schedule}
      onClose={onClose}
      size="lg"
      title={`Asignados a ${schedule?.name ?? ''}`}
      footer={
        confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Volver
            </Button>
            <Button variant="danger" loading={unassign.isPending} disabled={preview.isPending || preview.isError} onClick={remove}>
              Sí, quitar {chosen.length}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            {canEdit && (
              <Button variant="danger" disabled={!chosen.length} onClick={() => setConfirming(true)}>
                Quitar del horario{chosen.length ? ` (${chosen.length})` : ''}
              </Button>
            )}
          </>
        )
      }
    >
      {members.isPending ? (
        <div className="flex justify-center py-10 text-brand-700">
          <Spinner />
        </div>
      ) : members.isError ? (
        <ErrorState message={errorMessage(members.error)} onRetry={() => members.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState title="Nadie tiene este horario" description="No hay empleados con este horario hoy ni más adelante." />
      ) : confirming ? (
        <div className="space-y-3 text-sm">
          <p>
            ¿Quitar a <strong>{chosen.length}</strong> {chosen.length === 1 ? 'empleado' : 'empleados'} del horario{' '}
            <strong>{schedule?.name}</strong>? Así quedarán:
          </p>
          <UnassignSummary query={preview} restore={restore} onRestoreChange={setRestore} />
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <ul className="divide-y divide-slate-100">
            {canEdit && (
              <li className="pb-2">
                <label className="flex items-center gap-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand-700"
                    checked={allSelected}
                    disabled={!removable.length}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(removable.map((m) => m.id)))}
                  />
                  Seleccionar todos ({removable.length})
                </label>
              </li>
            )}
            {list.map((m) => (
              <li key={m.id} className="py-2.5">
                <label className={cn('flex items-center gap-3', canEdit && 'cursor-pointer')}>
                  {canEdit && (
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-brand-700"
                      checked={selected.has(m.id)}
                      disabled={m.endDate === today}
                      onChange={() => toggle(m.id)}
                      aria-label={`Seleccionar a ${m.employee.fullName}`}
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {m.employee.fullName}
                      {!m.employee.active && <span className="ml-1 text-xs text-slate-400">(inactivo)</span>}
                    </span>
                    <span className="block text-xs text-slate-500">{m.employee.position}</span>
                  </span>
                  <span className="text-right text-xs tabular-nums text-slate-600">
                    {formatDayKeyNumeric(m.startDate)} → {m.endDate ? formatDayKeyNumeric(m.endDate) : 'sin fin'}
                  </span>
                  {m.endDate === today ? (
                    <Badge tone="amber">Termina hoy</Badge>
                  ) : (
                    <Badge tone={m.status === 'CURRENT' ? 'brand' : 'sky'}>{m.status === 'CURRENT' ? 'Vigente' : 'Próximo'}</Badge>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
