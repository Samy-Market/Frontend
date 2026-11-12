import { useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { PageHeader } from './AdminLayout';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  inputClass,
  Modal,
  Spinner,
  TableCard,
  tableClass,
  tdClass,
  thClass,
} from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/styles';
import { formatDateTime } from '@/lib/time';

interface AuditItem {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  target: string | null;
  user: { id: string; email: string };
}

interface AuditPage {
  items: AuditItem[];
  nextCursor: string | null;
}

const ENTITY: Record<string, string> = {
  User: 'Usuario',
  Employee: 'Empleado',
  Site: 'Sede',
  SiteTransfer: 'Traslado',
  Shift: 'Turno',
  Schedule: 'Horario',
  ScheduleAssignment: 'Asignación de horario',
  Justification: 'Justificación',
  Holiday: 'Feriado',
  Leave: 'Vacaciones / permiso',
};

const ACTION: Record<string, { label: string; tone: 'green' | 'sky' | 'red' | 'amber' | 'slate' | 'brand' }> = {
  CREATE: { label: 'Creó', tone: 'green' },
  UPDATE: { label: 'Editó', tone: 'sky' },
  UPDATE_WITH_PASSWORD_RESET: { label: 'Editó y cambió la contraseña', tone: 'amber' },
  DELETE: { label: 'Eliminó', tone: 'red' },
  CHANGE_PASSWORD: { label: 'Cambió su contraseña', tone: 'amber' },
  ASSIGN: { label: 'Asignó', tone: 'green' },
  UNASSIGN: { label: 'Quitó', tone: 'red' },
  TRANSFER: { label: 'Trasladó', tone: 'brand' },
  APPROVE: { label: 'Aprobó', tone: 'green' },
  REJECT: { label: 'Rechazó', tone: 'red' },
  END: { label: 'Terminó', tone: 'slate' },
  INITIAL_SETUP: { label: 'Configuración inicial', tone: 'brand' },
};

const FIELD: Record<string, string> = {
  name: 'Nombre',
  fullName: 'Nombre',
  email: 'Correo',
  role: 'Rol',
  active: 'Activo',
  documentId: 'Cédula',
  position: 'Cargo',
  address: 'Dirección',
  startTime: 'Entrada',
  endTime: 'Salida',
  toleranceMinutes: 'Tolerancia (min)',
  startDate: 'Desde',
  endDate: 'Hasta',
  status: 'Estado',
  reviewNote: 'Nota de revisión',
  reason: 'Motivo',
  lat: 'Latitud',
  lng: 'Longitud',
  radiusMeters: 'Radio (m)',
  kind: 'Tipo',
  note: 'Nota',
  date: 'Fecha',
  description: 'Descripción',
  site: 'Sede',
  schedule: 'Horario',
  employee: 'Empleado',
  user: 'Usuario',
};

const HIDDEN = new Set(['id', 'createdAt', 'updatedAt', 'userId', 'employeeId', 'siteId', 'scheduleId', 'createdBy', 'reviewedBy']);

export default function Audit() {
  const [entity, setEntity] = useState('');
  const [userId, setUserId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [detail, setDetail] = useState<AuditItem | null>(null);

  const filters = useQuery({
    queryKey: ['audit', 'filters'],
    queryFn: () => api.get<{ entities: string[]; users: { id: string; email: string }[] }>('/audit/filters'),
  });
  const params = { entity, userId, from, to };
  const list = useInfiniteQuery({
    queryKey: ['audit', 'list', params],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams(Object.entries({ ...params, cursor: pageParam }).filter(([, v]) => v));
      return api.get<AuditPage>(`/audit?${search.toString()}`);
    },
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
  const items = list.data?.pages.flatMap((p) => p.items) ?? [];
  const filtered = !!(entity || userId || from || to);

  return (
    <>
      <PageHeader title="Auditoría" description="Quién cambió qué y cuándo. Solo lectura: estos registros no se pueden editar ni borrar." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_10rem_10rem_auto] lg:items-end">
        <Field label="Sección" htmlFor="au-entity">
          <select id="au-entity" className={inputClass} value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">Todas</option>
            {filters.data?.entities.map((en) => (
              <option key={en} value={en}>
                {ENTITY[en] ?? en}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hecho por" htmlFor="au-user">
          <select id="au-user" className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Cualquier usuario</option>
            {filters.data?.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Desde" htmlFor="au-from">
          <input id="au-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Hasta" htmlFor="au-to">
          <input id="au-to" type="date" min={from || undefined} className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Button
          variant="secondary"
          disabled={!filtered}
          onClick={() => {
            setEntity('');
            setUserId('');
            setFrom('');
            setTo('');
          }}
        >
          Limpiar
        </Button>
      </div>

      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={filtered ? 'No hay cambios con esos filtros' : 'Aún no hay cambios registrados'} />
      ) : (
        <>
          <TableCard>
            <table className={tableClass}>
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className={thClass}>
                    Fecha
                  </th>
                  <th scope="col" className={thClass}>
                    Hecho por
                  </th>
                  <th scope="col" className={thClass}>
                    Acción
                  </th>
                  <th scope="col" className={thClass}>
                    Sección
                  </th>
                  <th scope="col" className={thClass}>
                    Registro
                  </th>
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Detalle</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => {
                  const action = ACTION[i.action] ?? { label: i.action, tone: 'slate' as const };
                  return (
                    <tr key={i.id} className="hover:bg-slate-50">
                      <td className={cn(tdClass, 'whitespace-nowrap tabular-nums text-slate-600')}>{formatDateTime(i.createdAt)}</td>
                      <td className={cn(tdClass, 'max-w-[14rem] truncate')}>{i.user.email}</td>
                      <td className={tdClass}>
                        <Badge tone={action.tone}>{action.label}</Badge>
                      </td>
                      <td className={cn(tdClass, 'whitespace-nowrap')}>{ENTITY[i.entity] ?? i.entity}</td>
                      <td className={cn(tdClass, 'max-w-[16rem] truncate font-medium')}>
                        {i.target ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className={cn(tdClass, 'text-right')}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDetail(i)}
                          aria-label={`Ver detalle del cambio del ${formatDateTime(i.createdAt)}`}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableCard>
          {list.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" loading={list.isFetchingNextPage} onClick={() => void list.fetchNextPage()}>
                Cargar más
              </Button>
            </div>
          )}
        </>
      )}

      <DetailModal item={detail} onClose={() => setDetail(null)} />
    </>
  );
}

function DetailModal({ item, onClose }: { item: AuditItem | null; onClose: () => void }) {
  const rows = item ? diffRows(item.before, item.after) : [];
  const showBefore = rows.some((r) => r.before !== undefined);
  const showAfter = rows.some((r) => r.after !== undefined);
  const action = item ? (ACTION[item.action]?.label ?? item.action) : '';

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      size="lg"
      title="Detalle del cambio"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {item && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            <strong className="text-ink">{item.user.email}</strong> · {action.toLowerCase()} · {ENTITY[item.entity] ?? item.entity}
            {item.target && <> · {item.target}</>}
            <span className="block text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
          </p>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">Este registro no guarda detalle de campos.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl ring-1 ring-black/10">
              <table className="min-w-full divide-y divide-black/5 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Campo</th>
                    {showBefore && <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Antes</th>}
                    {showAfter && <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Después</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rows.map((r) => (
                    <tr key={r.field} className={cn(r.changed && showBefore && showAfter && 'bg-amber-50')}>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{FIELD[r.field] ?? r.field}</td>
                      {showBefore && <td className="px-3 py-2 text-slate-600">{format(r.before)}</td>}
                      {showAfter && <td className="px-3 py-2">{format(r.after)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showBefore && showAfter && rows.some((r) => r.changed) && (
            <p className="text-xs text-slate-500">Las filas resaltadas son las que cambiaron.</p>
          )}
        </div>
      )}
    </Modal>
  );
}

type Row = { field: string; before: unknown; after: unknown; changed: boolean };

function diffRows(before: unknown, after: unknown): Row[] {
  const b = isObj(before) ? before : {};
  const a = isObj(after) ? after : {};
  const keys = [...new Set([...Object.keys(b), ...Object.keys(a)])].filter((k) => !HIDDEN.has(k));
  return keys.map((field) => ({
    field,
    before: isObj(before) ? b[field] : undefined,
    after: isObj(after) ? a[field] : undefined,
    changed: JSON.stringify(b[field]) !== JSON.stringify(a[field]),
  }));
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function format(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return formatDateTime(v);
  if (typeof v === 'object') {
    const named = v as Record<string, unknown>;
    if (typeof named.name === 'string') return named.name;
    if (typeof named.fullName === 'string') return named.fullName;
    if (typeof named.email === 'string') return named.email;
    return JSON.stringify(v);
  }
  return typeof v === 'string' ? v : JSON.stringify(v);
}
