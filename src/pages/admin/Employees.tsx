import { FormEvent, useState } from 'react';
import { formKey } from '@/lib/form';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
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
import { cn } from '@/lib/styles';
import { Link } from 'react-router-dom';
import { EmployeeInput, useEmployees, useSaveEmployee, useSites } from '@/hooks/admin';
import { EmployeeSchedulesModal, ScheduleCell } from './EmployeeSchedules';
import { useDebounced } from '@/hooks/useDebounced';
import { ApiError, errorMessage } from '@/lib/api';
import type { Employee } from '@/lib/types';

type ActiveFilter = 'true' | 'false' | 'all';

export default function Employees() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN';
  const [q, setQ] = useState('');
  const [active, setActive] = useState<ActiveFilter>('true');
  const [siteId, setSiteId] = useState('');
  const debouncedQ = useDebounced(q);
  const list = useEmployees({ q: debouncedQ, active, siteId: siteId || undefined });
  const sites = useSites();
  const noSites = sites.data?.filter((s) => s.active).length === 0;
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [historyOf, setHistoryOf] = useState<Employee | null>(null);

  return (
    <>
      <PageHeader
        title="Empleados"
        description={canEdit ? 'Crea, edita y activa o desactiva empleados.' : 'Consulta de empleados (solo lectura para supervisores).'}
        actions={
          canEdit && (
            <Button onClick={() => setEditing('new')} disabled={noSites}>
              + Nuevo empleado
            </Button>
          )
        }
      />

      {canEdit && noSites && (
        <p className="mb-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          Antes de registrar empleados crea las sedes de la empresa en{' '}
          <Link to="/admin/sedes" className="font-medium underline">
            Sedes
          </Link>
          .
        </p>
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="emp-search" className="sr-only">
          Buscar
        </label>
        <input
          id="emp-search"
          type="search"
          className={cn(inputClass, 'sm:max-w-xs')}
          placeholder="Buscar por nombre, correo, cédula o cargo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label htmlFor="emp-active" className="sr-only">
          Estado
        </label>
        <select
          id="emp-active"
          className={cn(inputClass, 'sm:w-44')}
          value={active}
          onChange={(e) => setActive(e.target.value as ActiveFilter)}
        >
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
          <option value="all">Todos</option>
        </select>
        <label htmlFor="emp-site" className="sr-only">
          Sede
        </label>
        <select id="emp-site" className={cn(inputClass, 'sm:w-52')} value={siteId} onChange={(e) => setSiteId(e.target.value)}>
          <option value="">Todas las sedes</option>
          {sites.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState title="No se encontraron empleados" description="Prueba con otro filtro o búsqueda." />
      ) : (
        <TableCard>
          <table className={tableClass}>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className={thClass}>
                  Nombre
                </th>
                <th scope="col" className={thClass}>
                  Cédula
                </th>
                <th scope="col" className={thClass}>
                  Cargo
                </th>
                <th scope="col" className={thClass}>
                  Sede
                </th>
                <th scope="col" className={thClass}>
                  Horario
                </th>
                <th scope="col" className={thClass}>
                  Estado
                </th>
                {canEdit && (
                  <th scope="col" className={thClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className={tdClass}>
                    <p className="font-medium">{e.fullName}</p>
                    <p className="text-xs text-slate-500">{e.user.email}</p>
                  </td>
                  <td className={cn(tdClass, 'tabular-nums')}>{e.documentId}</td>
                  <td className={tdClass}>{e.position}</td>
                  <td className={cn(tdClass, 'whitespace-nowrap')}>{e.site.name}</td>
                  <td className={tdClass}>
                    <ScheduleCell employee={e} onOpen={() => setHistoryOf(e)} />
                  </td>
                  <td className={tdClass}>
                    <Badge tone={e.active ? 'green' : 'slate'}>{e.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  {canEdit && (
                    <td className={cn(tdClass, 'text-right')}>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(e)} aria-label={`Editar a ${e.fullName}`}>
                        Editar
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      {canEdit && <EmployeeForm key={formKey('employee', editing)} employee={editing} onClose={() => setEditing(null)} />}
      <EmployeeSchedulesModal employee={historyOf} canEdit={canEdit} onClose={() => setHistoryOf(null)} />
    </>
  );
}

const empty: EmployeeInput = { fullName: '', email: '', documentId: '', position: '', siteId: '', active: true, password: '' };

function EmployeeForm({ employee, onClose }: { employee: Employee | 'new' | null; onClose: () => void }) {
  const isNew = employee === 'new';
  // Se vuelve a montar (key) cada vez que se abre, así el formulario arranca limpio.
  const [form, setForm] = useState<EmployeeInput>(() =>
    employee && employee !== 'new'
      ? {
          fullName: employee.fullName,
          email: employee.user.email,
          documentId: employee.documentId,
          position: employee.position,
          siteId: employee.siteId,
          active: employee.active,
          password: '',
        }
      : empty,
  );
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveEmployee();
  const sites = useSites();
  const toast = useToast();

  const set = <K extends keyof EmployeeInput>(k: K, v: EmployeeInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    if (!/^\d{10}(\d{3})?$/.test(form.documentId.trim())) local.push('La cédula debe tener 10 dígitos (o 13 si es RUC).');
    if (!form.siteId) local.push('Selecciona la sede del empleado.');
    if (isNew && (form.password ?? '').length < 8) local.push('La contraseña debe tener al menos 8 caracteres.');
    if (!isNew && form.password && form.password.length < 8) local.push('La nueva contraseña debe tener al menos 8 caracteres.');
    if (local.length) return setErrors(local);

    const data: Partial<EmployeeInput> = { ...form };
    if (!data.password) delete data.password;
    save.mutate(
      { id: isNew ? undefined : (employee as Employee).id, data },
      {
        onSuccess: (res) => {
          toast.success(isNew ? 'Empleado creado' : 'Cambios guardados', res.fullName);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={!!employee}
      onClose={onClose}
      size="lg"
      title={isNew ? 'Nuevo empleado' : 'Editar empleado'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="employee-form" loading={save.isPending}>
            {isNew ? 'Crear empleado' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Nombre completo" htmlFor="f-name">
            <input id="f-name" required className={inputClass} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </Field>
        </div>
        <Field label="Correo" htmlFor="f-email">
          <input
            id="f-email"
            type="email"
            required
            className={inputClass}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Cédula" htmlFor="f-doc">
          <input
            id="f-doc"
            inputMode="numeric"
            required
            maxLength={13}
            className={inputClass}
            value={form.documentId}
            onChange={(e) => set('documentId', e.target.value.replace(/\D/g, ''))}
          />
        </Field>
        <Field label="Cargo" htmlFor="f-pos">
          <input id="f-pos" required className={inputClass} value={form.position} onChange={(e) => set('position', e.target.value)} />
        </Field>
        <Field label="Sede" htmlFor="f-site" hint={isNew ? 'Sede base donde trabaja normalmente.' : undefined}>
          <select id="f-site" required className={inputClass} value={form.siteId} onChange={(e) => set('siteId', e.target.value)}>
            <option value="">Elige la sede…</option>
            {sites.data
              ?.filter((x) => x.active || x.id === form.siteId)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label={isNew ? 'Contraseña inicial' : 'Nueva contraseña'}
          htmlFor="f-pass"
          hint={isNew ? 'Mínimo 8 caracteres. Compártela con el empleado de forma segura.' : 'Déjala vacía para no cambiarla.'}
        >
          <input
            id="f-pass"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </Field>
        <div className="flex items-center gap-2 self-end pb-2">
          <input
            id="f-active"
            type="checkbox"
            className="h-4 w-4 accent-brand-700"
            checked={form.active}
            onChange={(e) => set('active', e.target.checked)}
          />
          <label htmlFor="f-active" className="text-sm">
            Empleado activo (puede iniciar sesión y marcar)
          </label>
        </div>
        {errors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
            {errors.map((er) => (
              <li key={er}>{er}</li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}
