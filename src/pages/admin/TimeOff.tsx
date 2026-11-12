import { FormEvent, useState } from 'react';
import { formKey } from '@/lib/form';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
import { ConfirmDelete } from '@/components/ConfirmDelete';
import { Badge, Button, ErrorState, Field, inputClass, Modal, Spinner } from '@/components/ui';
import { cn } from '@/lib/styles';
import { useCancelLeave, useCreateHoliday, useCreateLeave, useDeleteHoliday, useEmployees, useHolidays, useLeaves } from '@/hooks/admin';
import { ApiError, errorMessage } from '@/lib/api';
import { addDaysKey, daysUntil, formatDayKey, formatDayKeyNumeric, todayKey } from '@/lib/time';
import type { Leave, LeaveKind } from '@/lib/types';

const KIND_LABEL: Record<LeaveKind, string> = { VACATION: 'Vacaciones', MEDICAL: 'Permiso médico', PERSONAL: 'Permiso personal' };
const KIND_TONE = { VACATION: 'brand', MEDICAL: 'red', PERSONAL: 'sky' } as const;
const STATUS = {
  CURRENT: { label: 'En curso', tone: 'green' },
  UPCOMING: { label: 'Próximo', tone: 'sky' },
  PAST: { label: 'Terminado', tone: 'slate' },
} as const;

export default function TimeOff() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [leaveOpen, setLeaveOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Feriados y permisos"
        description="Días en los que no se trabaja: no cuentan como ausencia ni como días programados en los reportes."
        actions={<Button onClick={() => setLeaveOpen(true)}>+ Registrar vacaciones o permiso</Button>}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <HolidaysSection canEdit={isAdmin} />
        <LeavesSection onNew={() => setLeaveOpen(true)} />
      </div>
      <LeaveForm key={formKey('leave', leaveOpen)} open={leaveOpen} onClose={() => setLeaveOpen(false)} />
    </>
  );
}

function HolidaysSection({ canEdit }: { canEdit: boolean }) {
  const [year, setYear] = useState(() => Number(todayKey().slice(0, 4)));
  const q = useHolidays(year);
  const create = useCreateHoliday();
  const remove = useDeleteHoliday();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !name.trim()) return setError('Indica la fecha y el nombre del feriado.');
    setError(null);
    create.mutate(
      { date, name: name.trim() },
      {
        onSuccess: (h) => {
          toast.success('Feriado agregado', `${formatDayKey(h.date)} · ${h.name}`);
          setDate('');
          setName('');
          if (Number(h.date.slice(0, 4)) !== year) setYear(Number(h.date.slice(0, 4)));
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <section aria-labelledby="holidays-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="holidays-title" className="text-2xl font-semibold">
          Feriados
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Año anterior"
          >
            ←
          </button>
          <span className="w-14 text-center font-semibold tabular-nums" aria-live="polite">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            aria-label="Año siguiente"
          >
            →
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        Valen para todos los empleados. Si alguien trabaja ese día, sus horas cuentan como suplementarias.
      </p>

      {canEdit && (
        <form onSubmit={add} className="mb-4 rounded-[18px] bg-white p-4 ring-1 ring-black/[0.04]" noValidate>
          <div className="grid gap-3">
            <Field label="Fecha" htmlFor="hd-date">
              <input id="hd-date" type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Nombre" htmlFor="hd-name">
              <input
                id="hd-name"
                className={inputClass}
                maxLength={80}
                placeholder="Ej.: Día del Trabajo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={create.isPending}>
                Agregar feriado
              </Button>
            </div>
          </div>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      )}

      {q.isPending ? (
        <div className="flex justify-center py-10 text-brand-700">
          <Spinner />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          No hay feriados registrados para {year}.
        </div>
      ) : (
        <ul className="divide-y divide-black/5 rounded-[18px] bg-white ring-1 ring-black/[0.04]">
          {q.data.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{h.name}</p>
                <p className={cn('text-xs', h.date < todayKey() ? 'text-slate-400' : 'text-slate-500')}>{formatDayKey(h.date)}</p>
              </div>
              {canEdit && (
                <ConfirmDelete what="feriado" name={h.name} onDelete={() => remove.mutateAsync(h.id)}>
                  <p className="text-slate-500">Si ya pasó, los reportes de ese día volverán a contar las ausencias.</p>
                </ConfirmDelete>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function LeavesSection({ onNew }: { onNew: () => void }) {
  const [scope, setScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const q = useLeaves(scope);

  return (
    <section aria-labelledby="leaves-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="leaves-title" className="text-2xl font-semibold">
          Vacaciones y permisos
        </h2>
        <div role="tablist" aria-label="Mostrar" className="inline-flex rounded-xl bg-black/[0.05] p-0.5">
          {(['CURRENT', 'ALL'] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={cn(
                'rounded-[10px] px-3 py-1.5 text-sm font-medium transition-all duration-300',
                scope === s ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-slate-500 hover:text-ink',
              )}
            >
              {s === 'CURRENT' ? 'Vigentes y próximos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>
      <p className="mb-4 text-sm text-slate-500">Por empleado. Esos días no se cuentan como ausencia aunque no marque.</p>

      {q.isPending ? (
        <div className="flex justify-center py-10 text-brand-700">
          <Spinner />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="font-medium text-slate-800">No hay vacaciones ni permisos {scope === 'CURRENT' ? 'vigentes' : 'registrados'}</p>
          <Button size="sm" variant="secondary" className="mt-3" onClick={onNew}>
            Registrar
          </Button>
        </div>
      ) : (
        <ul className="stagger space-y-2">
          {q.data.map((l) => (
            <LeaveRow key={l.id} l={l} />
          ))}
        </ul>
      )}
    </section>
  );
}

function LeaveRow({ l }: { l: Leave }) {
  const cancel = useCancelLeave();
  const toast = useToast();
  const status = STATUS[l.status];
  const single = l.startDate === l.endDate;

  const onCancel = () =>
    cancel.mutate(l.id, {
      onSuccess: (r) =>
        toast.success(
          r.deleted ? 'Permiso cancelado' : 'Permiso terminado',
          r.deleted ? `${l.employee.fullName}: ${l.label.toLowerCase()} eliminado.` : `Desde hoy ${l.employee.fullName} vuelve a trabajar.`,
        ),
      onError: (err) => toast.error('No se pudo cambiar', errorMessage(err)),
    });

  return (
    <li className="flex flex-col gap-3 rounded-[18px] bg-white p-4 ring-1 ring-black/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {l.employee.fullName}
          <Badge tone={KIND_TONE[l.kind]}>{l.label}</Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          {single ? formatDayKeyNumeric(l.startDate) : `${formatDayKeyNumeric(l.startDate)} al ${formatDayKeyNumeric(l.endDate)}`}
          {l.status === 'UPCOMING' && ` (en ${daysUntil(l.startDate)} días)`}
        </p>
        {l.note && <p className="mt-0.5 text-xs text-slate-500">Nota: {l.note}</p>}
      </div>
      {l.status !== 'PAST' && (
        <Button size="sm" variant="secondary" onClick={onCancel} loading={cancel.isPending}>
          {l.status === 'UPCOMING' ? 'Cancelar' : 'Terminar ahora'}
        </Button>
      )}
    </li>
  );
}

function LeaveForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const employees = useEmployees({ active: 'true' });
  const create = useCreateLeave();
  const toast = useToast();
  const [kind, setKind] = useState<LeaveKind>('VACATION');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const list = (employees.data ?? []).filter((e) => {
    const t = q.trim().toLowerCase();
    return !t || `${e.fullName} ${e.position} ${e.site.name}`.toLowerCase().includes(t);
  });
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    if (!startDate || !endDate) local.push('Indica las fechas.');
    if (endDate < startDate) local.push('La fecha de fin no puede ser anterior a la de inicio.');
    if (selected.size === 0) local.push('Selecciona al menos un empleado.');
    if (local.length) return setErrors(local);
    setErrors([]);
    create.mutate(
      { employeeIds: [...selected], kind, startDate, endDate, note: note.trim() || undefined },
      {
        onSuccess: (r) => {
          toast.success(`${KIND_LABEL[kind]} registradas`, `${r.created} ${r.created === 1 ? 'empleado' : 'empleados'}.`);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Registrar vacaciones o permiso"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="leave-form" loading={create.isPending}>
            Registrar {selected.size > 0 ? `a ${selected.size}` : ''}
          </Button>
        </>
      }
    >
      <form id="leave-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Tipo" htmlFor="lv-kind">
            <select id="lv-kind" className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as LeaveKind)}>
              {(Object.keys(KIND_LABEL) as LeaveKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desde" htmlFor="lv-start">
            <input
              id="lv-start"
              type="date"
              className={inputClass}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </Field>
          <Field label="Hasta (inclusive)" htmlFor="lv-end">
            <input
              id="lv-end"
              type="date"
              min={startDate}
              className={inputClass}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Solo hoy', days: 0 },
            { label: '1 semana', days: 6 },
            { label: '15 días', days: 14 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setEndDate(addDaysKey(startDate, p.days))}
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-black/10 transition hover:bg-black/5"
            >
              {p.label}
            </button>
          ))}
        </div>
        <Field label="Nota (opcional)" htmlFor="lv-note">
          <input
            id="lv-note"
            className={inputClass}
            maxLength={300}
            placeholder="Ej.: certificado médico entregado, vacaciones anuales…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>

        <fieldset>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <legend className="text-[13px] font-medium text-slate-600">Empleados ({selected.size} seleccionados)</legend>
            <label htmlFor="lv-q" className="sr-only">
              Buscar empleado
            </label>
            <input
              id="lv-q"
              type="search"
              placeholder="Buscar…"
              className={cn(inputClass, 'w-48')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-60 divide-y divide-black/5 overflow-y-auto rounded-2xl ring-1 ring-black/10">
            {employees.isPending ? (
              <li className="flex justify-center py-6 text-brand-700">
                <Spinner />
              </li>
            ) : list.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500">No hay empleados con ese filtro.</li>
            ) : (
              list.map((e) => (
                <li key={e.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-black/[0.02]">
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
                    <Badge>{e.site.name}</Badge>
                  </label>
                </li>
              ))
            )}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Se pueden registrar fechas pasadas (por ejemplo, un permiso médico de la semana anterior): esos días dejan de contar como
            ausencia.
          </p>
        </fieldset>

        {errors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((er) => (
              <li key={er}>{er}</li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}
