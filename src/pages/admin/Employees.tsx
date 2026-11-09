import { FormEvent, useState } from 'react';
import { formKey } from '@/lib/form';
import { ConfirmDelete } from '@/components/ConfirmDelete';
import { PasswordInput } from '@/components/PasswordInput';
import { generatePassword, passwordProblems } from '@/lib/password';
import { CEDULA_LENGTH, cedulaProblem, EMAIL_MAX, emailProblem, onlyCedulaDigits, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/field-rules';
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
import { EmployeeInput, useDeleteEmployee, useEmployees, useSaveEmployee, useSites } from '@/hooks/admin';
import { EmployeeSchedulesModal, ScheduleCell } from './EmployeeSchedules';
import { useDebounced } from '@/hooks/useDebounced';
import { ApiError, errorMessage } from '@/lib/api';
import type { Employee } from '@/lib/types';

type ActiveFilter = 'true' | 'false' | 'all';

export default function Employees() {
  const deleteEmployee = useDeleteEmployee();
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
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(e)} aria-label={`Editar a ${e.fullName}`}>
                          Editar
                        </Button>
                        <ConfirmDelete what="empleado" name={e.fullName} onDelete={() => deleteEmployee.mutateAsync(e.id)}>
                          <p className="text-slate-500">
                            También se elimina su usuario de acceso ({e.user.email}). Solo se puede eliminar un empleado sin horario,
                            marcaciones ni historial; si ya trabajó, desactívalo.
                          </p>
                        </ConfirmDelete>
                      </div>
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
  const [confirm, setConfirm] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [touched, setTouched] = useState({ email: false, doc: false });
  const docError = touched.doc || form.documentId.length === CEDULA_LENGTH ? cedulaProblem(form.documentId) : null;
  const emailError = touched.email ? emailProblem(form.email) : null;
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveEmployee();
  const sites = useSites();
  const toast = useToast();

  const set = <K extends keyof EmployeeInput>(k: K, v: EmployeeInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    const email = emailProblem(form.email);
    if (email) local.push(email);
    const doc = cedulaProblem(form.documentId);
    if (doc) local.push(doc);
    if (!form.siteId) local.push('Selecciona la sede del empleado.');
    local.push(...passwordProblems(form.password ?? '', confirm, { required: isNew }));
    if (local.length) {
      setTouched({ email: true, doc: true });
      return setErrors(local);
    }

    const data: Partial<EmployeeInput> = { ...form, email: form.email.trim() };
    if (!data.password) delete data.password;
    save.mutate(
      { id: isNew ? undefined : (employee as Employee).id, data },
      {
        onSuccess: (res) => {
          toast.success(
            isNew ? 'Empleado creado' : 'Cambios guardados',
            data.password ? `${res.fullName} ya puede entrar con ${res.user.email} y la contraseña indicada.` : res.fullName,
          );
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
        <Field label="Correo" htmlFor="f-email" error={emailError ?? undefined}>
          <input
            id="f-email"
            type="email"
            inputMode="email"
            required
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={EMAIL_MAX}
            aria-invalid={!!emailError}
            className={inputClass}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="nombre@empresa.com"
          />
        </Field>
        <Field label="Cédula" htmlFor="f-doc" hint="10 dígitos, cédula ecuatoriana." error={docError ?? undefined}>
          <input
            id="f-doc"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            // Sin maxLength: al pegar "0926-687-856" se quitan los guiones y luego se corta a 10.
            aria-invalid={!!docError}
            className={inputClass}
            value={form.documentId}
            onChange={(e) => set('documentId', onlyCedulaDigits(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, doc: true }))}
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
          hint={
            isNew
              ? `De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres. Compártela con el empleado de forma segura.`
              : 'Déjala vacía para no cambiarla.'
          }
        >
          <PasswordInput
            id="f-pass"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
          />
        </Field>
        <Field label="Repite la contraseña" htmlFor="f-pass2">
          <PasswordInput
            id="f-pass2"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <div className="-mt-2 sm:col-span-2">
          <button
            type="button"
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() => {
              const generated = generatePassword();
              set('password', generated);
              setConfirm(generated);
              setRevealed(true);
            }}
          >
            Generar una contraseña
          </button>
        </div>
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
