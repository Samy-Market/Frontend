import { FormEvent, useState } from 'react';
import { formKey } from '@/lib/form';
import { ConfirmDelete } from '@/components/ConfirmDelete';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputClass, Modal, Spinner } from '@/components/ui';
import { cn } from '@/lib/styles';
import {
  SiteInput,
  useCreateTransfer,
  useDeleteSite,
  useDeleteTransfer,
  useEmployees,
  useSaveSite,
  useSites,
  useTransfers,
  useUpdateTransfer,
} from '@/hooks/admin';
import { ApiError, errorMessage } from '@/lib/api';
import { getDeviceLocation } from '@/lib/geolocation';
import { DEFAULT_RADIUS, parseCoordinates } from '@/lib/geo';
import { addDaysKey, daysUntil, formatDayKeyNumeric, todayKey } from '@/lib/time';
import type { Site, Transfer } from '@/lib/types';

export default function Sites() {
  const deleteSite = useDeleteSite();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const sites = useSites();
  const [editing, setEditing] = useState<Site | 'new' | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const activeSites = (sites.data ?? []).filter((s) => s.active);

  return (
    <>
      <PageHeader
        title="Sedes"
        description="Locales de la empresa. Cada empleado tiene una sede base; si por una emergencia u orden trabaja en otra, registra un traslado y sus marcaciones de esos días quedarán en esa sede."
        actions={
          <>
            <Button variant="secondary" onClick={() => setTransferOpen(true)} disabled={activeSites.length < 2}>
              Registrar traslado
            </Button>
            {isAdmin && <Button onClick={() => setEditing('new')}>+ Nueva sede</Button>}
          </>
        }
      />

      {sites.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : sites.isError ? (
        <ErrorState message={errorMessage(sites.error)} onRetry={() => sites.refetch()} />
      ) : sites.data.length === 0 ? (
        <EmptyState title="Aún no hay sedes" description="Crea las sedes de la empresa antes de registrar a los empleados." />
      ) : (
        <ul className="stagger grid gap-4 md:grid-cols-2">
          {sites.data.map((s) => (
            <li key={s.id}>
              <Card className={cn('flex h-full flex-col gap-4', !s.active && 'opacity-60')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
                      {s.name}
                      {!s.active && <Badge>Inactiva</Badge>}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">{s.address || 'Sin dirección'}</p>
                    <p className={cn('mt-1 text-xs', s.lat !== null ? 'text-brand-700' : 'text-slate-400')}>
                      {s.lat !== null ? `Marcación solo a menos de ${s.radiusMeters} m de la sede` : 'Sin control de ubicación al marcar'}
                    </p>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 shrink-0 text-brand-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />
                  </svg>
                </div>
                <dl className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Empleados de esta sede</dt>
                    <dd className="text-2xl font-semibold tabular-nums">{s.activeEmployees ?? 0}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <dt className="text-xs text-slate-500">Llegan hoy por traslado</dt>
                    <dd className={cn('text-2xl font-semibold tabular-nums', (s.incomingTransfersToday ?? 0) > 0 && 'text-brand-700')}>
                      {s.incomingTransfersToday ?? 0}
                    </dd>
                  </div>
                </dl>
                {isAdmin && (
                  <div className="mt-auto flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      Editar
                    </Button>
                    <ConfirmDelete
                      what="sede"
                      feminine
                      name={s.name}
                      blockedReason={
                        s.activeEmployees
                          ? `Es la sede base de ${s.activeEmployees} ${s.activeEmployees === 1 ? 'empleado' : 'empleados'}. Cámbialos de sede primero.`
                          : null
                      }
                      onDelete={() => deleteSite.mutateAsync(s.id)}
                    >
                      <p className="text-slate-500">Solo se puede eliminar una sede sin empleados, marcaciones ni traslados.</p>
                    </ConfirmDelete>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <TransfersSection onNew={() => setTransferOpen(true)} canCreate={activeSites.length >= 2} />

      {isAdmin && <SiteForm key={formKey('site', editing)} site={editing} onClose={() => setEditing(null)} />}
      <TransferForm
        key={formKey('transfer', transferOpen)}
        open={transferOpen}
        sites={activeSites}
        onClose={() => setTransferOpen(false)}
      />
    </>
  );
}

function SiteForm({ site, onClose }: { site: Site | 'new' | null; onClose: () => void }) {
  const isNew = site === 'new';
  const save = useSaveSite();
  const toast = useToast();
  const existing = site && site !== 'new' ? site : null;
  const [form, setForm] = useState<Omit<SiteInput, 'lat' | 'lng' | 'radiusMeters'>>(() =>
    existing ? { name: existing.name, address: existing.address ?? '', active: existing.active } : { name: '', address: '', active: true },
  );
  const [coords, setCoords] = useState(existing?.lat != null && existing.lng != null ? `${existing.lat}, ${existing.lng}` : '');
  const [radius, setRadius] = useState(String(existing?.radiusMeters ?? DEFAULT_RADIUS));
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const point = parseCoordinates(coords);

  const fillCurrentLocation = async () => {
    setLocating(true);
    try {
      const here = await getDeviceLocation();
      setCoords(`${here.latitude.toFixed(6)}, ${here.longitude.toFixed(6)}`);
      if (here.accuracy > 50) toast.warning('Ubicación aproximada', `El GPS indica ±${Math.round(here.accuracy)} m. Revísala en el mapa.`);
    } catch (err) {
      toast.error('No se pudo obtener la ubicación', errorMessage(err));
    } finally {
      setLocating(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problems: string[] = [];
    if (!form.name.trim()) problems.push('El nombre de la sede es obligatorio.');
    if (point === 'invalid') problems.push('La ubicación debe ser "latitud, longitud", por ejemplo -2.170998, -79.922359.');
    const radiusMeters = Number(radius);
    if (point && point !== 'invalid' && (!Number.isInteger(radiusMeters) || radiusMeters < 30 || radiusMeters > 2000)) {
      problems.push('El radio debe ser un número entero entre 30 y 2000 metros.');
    }
    if (problems.length) return setErrors(problems);
    const location =
      point && point !== 'invalid' ? { lat: point.lat, lng: point.lng, radiusMeters } : { lat: null, lng: null, radiusMeters: null };
    save.mutate(
      { id: isNew ? undefined : (site as Site).id, data: { ...form, address: form.address?.trim() || null, ...location } },
      {
        onSuccess: (s) => {
          toast.success(isNew ? 'Sede creada' : 'Sede actualizada', s.name);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={!!site}
      onClose={onClose}
      title={isNew ? 'Nueva sede' : 'Editar sede'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="site-form" loading={save.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="site-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre" htmlFor="st-name" hint="Ej.: Sede Centro, Sede Norte, Bodega principal…">
          <input
            id="st-name"
            className={inputClass}
            maxLength={80}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Dirección (opcional)" htmlFor="st-address">
          <input
            id="st-address"
            className={inputClass}
            maxLength={200}
            value={form.address ?? ''}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </Field>
        <fieldset className="space-y-3 rounded-2xl bg-slate-50 p-3">
          <legend className="sr-only">Control de ubicación</legend>
          <p className="text-sm font-medium">Control de ubicación al marcar (opcional)</p>
          <p className="text-xs text-slate-500">
            Si indicas la ubicación, los empleados solo podrán marcar desde el celular cuando estén cerca de la sede. Déjala vacía para no
            controlarla.
          </p>
          <Field
            label="Ubicación (latitud, longitud)"
            htmlFor="st-coords"
            hint="En Google Maps, mantén presionado sobre la sede y copia los números que aparecen."
          >
            <input
              id="st-coords"
              className={inputClass}
              inputMode="decimal"
              placeholder="-2.170998, -79.922359"
              value={coords}
              onChange={(e) => setCoords(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" loading={locating} onClick={() => void fillCurrentLocation()}>
              Usar mi ubicación actual
            </Button>
            {point && point !== 'invalid' && (
              <a
                href={`https://www.google.com/maps?q=${point.lat},${point.lng}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-brand-700 hover:underline"
              >
                Ver en el mapa
              </a>
            )}
            {coords && (
              <button type="button" className="text-sm text-slate-500 hover:underline" onClick={() => setCoords('')}>
                Quitar ubicación
              </button>
            )}
          </div>
          {point && point !== 'invalid' && (
            <Field label="Radio permitido (metros)" htmlFor="st-radius" hint="Entre 30 y 2000. 150 m cubre bien un local y su entrada.">
              <input
                id="st-radius"
                className={inputClass}
                inputMode="numeric"
                value={radius}
                onChange={(e) => setRadius(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          )}
        </fieldset>
        {!isNew && (
          <div className="flex items-center gap-2">
            <input
              id="st-active"
              type="checkbox"
              className="h-4 w-4 accent-brand-700"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="st-active" className="text-sm">
              Sede activa
            </label>
          </div>
        )}
        {!isNew && (
          <p className="text-xs text-slate-500">
            Una sede con historial no se puede eliminar, solo desactivar. Para desactivarla, primero mueve a sus empleados a otra sede.
          </p>
        )}
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

const statusView = {
  CURRENT: { label: 'En curso', tone: 'brand' },
  UPCOMING: { label: 'Próximo', tone: 'sky' },
  PAST: { label: 'Terminado', tone: 'slate' },
} as const;

function TransfersSection({ onNew, canCreate }: { onNew: () => void; canCreate: boolean }) {
  const [scope, setScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const q = useTransfers(scope);

  return (
    <section aria-labelledby="transfers-title" className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="transfers-title" className="text-2xl font-semibold">
            Traslados
          </h2>
          <p className="text-sm text-slate-500">Empleados que trabajan temporalmente en otra sede.</p>
        </div>
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

      {q.isPending ? (
        <div className="flex justify-center py-10 text-brand-700">
          <Spinner />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 px-6 py-10 text-center">
          <p className="font-medium text-slate-800">No hay traslados {scope === 'CURRENT' ? 'vigentes' : 'registrados'}</p>
          {canCreate && (
            <Button size="sm" variant="secondary" className="mt-3" onClick={onNew}>
              Registrar traslado
            </Button>
          )}
        </div>
      ) : (
        <ul className="stagger space-y-2">
          {q.data.map((t) => (
            <TransferRow key={t.id} t={t} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TransferRow({ t }: { t: Transfer }) {
  const update = useUpdateTransfer();
  const del = useDeleteTransfer();
  const toast = useToast();
  const view = statusView[t.status];
  const single = t.startDate === t.endDate;
  const today = todayKey();

  const finishNow = () => {
    if (t.startDate >= today) {
      del.mutate(t.id, {
        onSuccess: () => toast.success('Traslado quitado', `${t.employee.fullName} vuelve a ${t.fromSite.name}.`),
        onError: (err) => toast.error('No se pudo quitar', errorMessage(err)),
      });
    } else {
      update.mutate(
        { id: t.id, endDate: addDaysKey(today, -1) },
        {
          onSuccess: () => toast.success('Traslado terminado', `Desde hoy ${t.employee.fullName} vuelve a ${t.fromSite.name}.`),
          onError: (err) => toast.error('No se pudo terminar', errorMessage(err)),
        },
      );
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-[18px] bg-white p-4 ring-1 ring-black/[0.04] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-medium">
          {t.employee.fullName}
          <Badge tone={view.tone}>{view.label}</Badge>
        </p>
        <p className="mt-0.5 text-sm text-slate-600">
          {t.fromSite.name} <span aria-hidden>→</span>
          <span className="sr-only">hacia</span> <span className="font-medium text-ink">{t.toSite.name}</span> ·{' '}
          {single ? formatDayKeyNumeric(t.startDate) : `${formatDayKeyNumeric(t.startDate)} al ${formatDayKeyNumeric(t.endDate)}`}
          {t.status === 'UPCOMING' && ` (en ${daysUntil(t.startDate)} días)`}
        </p>
        {t.reason && <p className="mt-0.5 text-xs text-slate-500">Motivo: {t.reason}</p>}
      </div>
      {t.status !== 'PAST' && (
        <Button size="sm" variant="secondary" onClick={finishNow} loading={update.isPending || del.isPending}>
          {t.status === 'UPCOMING' ? 'Cancelar' : 'Terminar ahora'}
        </Button>
      )}
    </li>
  );
}

function TransferForm({ open, sites, onClose }: { open: boolean; sites: Site[]; onClose: () => void }) {
  const employees = useEmployees({ active: 'true' });
  const create = useCreateTransfer();
  const toast = useToast();
  const [siteId, setSiteId] = useState('');
  const [startDate, setStartDate] = useState(todayKey());
  const [endDate, setEndDate] = useState(todayKey());
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const candidates = (employees.data ?? []).filter((e) => e.siteId !== siteId);
  const list = candidates.filter((e) => {
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
    if (!siteId) local.push('Elige la sede de destino.');
    if (!startDate || !endDate) local.push('Indica las fechas.');
    if (endDate < startDate) local.push('La fecha de fin no puede ser anterior a la de inicio.');
    const ids = [...selected].filter((id) => candidates.some((c) => c.id === id));
    if (ids.length === 0) local.push('Selecciona al menos un empleado.');
    if (local.length) return setErrors(local);
    setErrors([]);
    create.mutate(
      { employeeIds: ids, siteId, startDate, endDate, reason: reason.trim() || undefined },
      {
        onSuccess: (r) => {
          const site = sites.find((s) => s.id === siteId)?.name ?? '';
          toast.success(
            'Traslado registrado',
            `${r.created} ${r.created === 1 ? 'empleado trabajará' : 'empleados trabajarán'} en ${site}.`,
          );
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
      title="Registrar traslado"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="transfer-form" loading={create.isPending}>
            Trasladar {selected.size > 0 ? `a ${selected.size}` : ''}
          </Button>
        </>
      }
    >
      <form id="transfer-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Trabajará en" htmlFor="tr-site">
            <select id="tr-site" className={inputClass} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
              <option value="">Elige la sede…</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desde" htmlFor="tr-start">
            <input
              id="tr-start"
              type="date"
              min={todayKey()}
              className={inputClass}
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
              }}
            />
          </Field>
          <Field label="Hasta (inclusive)" htmlFor="tr-end">
            <input
              id="tr-end"
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
            { label: '3 días', days: 2 },
            { label: '1 semana', days: 6 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setStartDate(todayKey());
                setEndDate(addDaysKey(todayKey(), p.days));
              }}
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-black/10 transition hover:bg-black/5"
            >
              {p.label}
            </button>
          ))}
        </div>
        <Field label="Motivo (opcional)" htmlFor="tr-reason">
          <input
            id="tr-reason"
            className={inputClass}
            maxLength={300}
            placeholder="Ej.: emergencia, falta de personal, inventario…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>

        <fieldset>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <legend className="text-[13px] font-medium text-slate-600">Empleados ({selected.size} seleccionados)</legend>
            <label htmlFor="tr-q" className="sr-only">
              Buscar empleado
            </label>
            <input
              id="tr-q"
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
              <li className="px-3 py-6 text-center text-sm text-slate-500">
                {siteId ? 'No hay empleados de otras sedes con ese filtro.' : 'No hay empleados activos.'}
              </li>
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
            Durante esas fechas sus marcaciones se registran en la sede de destino. Al terminar, vuelven solos a su sede base.
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
