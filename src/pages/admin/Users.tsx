import { EMAIL_MAX, emailProblem, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/field-rules';
import { PasswordInput } from '@/components/PasswordInput';
import { generatePassword, passwordProblems } from '@/lib/password';
import { FormEvent, useState } from 'react';
import { formKey } from '@/lib/form';
import { ConfirmDelete } from '@/components/ConfirmDelete';
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
import { StaffUserInput, useDeleteStaffUser, useSaveStaffUser, useStaffUsers } from '@/hooks/admin';
import { ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/time';
import type { StaffUser } from '@/lib/types';

const roleLabel = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor' } as const;

export default function Users() {
  const { user: me } = useAuth();
  const list = useStaffUsers();
  const deleteUser = useDeleteStaffUser();
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administradores y supervisores con acceso al panel. Los empleados se gestionan en la sección Empleados."
        actions={<Button onClick={() => setEditing('new')}>+ Nuevo usuario</Button>}
      />

      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="font-medium">Administrador</p>
          <p className="text-slate-600">Todo: empleados, turnos, usuarios, justificaciones y reportes.</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5">
          <p className="font-medium">Supervisor</p>
          <p className="text-slate-600">Dashboard en vivo, justificaciones y reportes. Ve empleados y turnos sin editarlos.</p>
        </div>
      </div>

      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState title="No hay usuarios" />
      ) : (
        <TableCard>
          <table className={tableClass}>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className={thClass}>
                  Correo
                </th>
                <th scope="col" className={thClass}>
                  Rol
                </th>
                <th scope="col" className={thClass}>
                  Estado
                </th>
                <th scope="col" className={thClass}>
                  Creado
                </th>
                <th scope="col" className={thClass}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className={tdClass}>
                    <span className="font-medium">{u.email}</span>
                    {u.id === me?.id && <span className="ml-2 text-xs text-brand-700">(tú)</span>}
                  </td>
                  <td className={tdClass}>
                    <Badge tone={u.role === 'ADMIN' ? 'brand' : 'sky'}>{roleLabel[u.role]}</Badge>
                  </td>
                  <td className={tdClass}>
                    <Badge tone={u.active ? 'green' : 'slate'}>{u.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className={cn(tdClass, 'text-slate-600')}>{formatDateTime(u.createdAt)}</td>
                  <td className={cn(tdClass, 'text-right')}>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label={`Editar a ${u.email}`}>
                        Editar
                      </Button>
                      <ConfirmDelete
                        what="usuario"
                        name={u.email}
                        blockedReason={u.id === me?.id ? 'No puedes eliminar tu propio usuario.' : null}
                        onDelete={() => deleteUser.mutateAsync(u.id)}
                      >
                        <p className="text-slate-500">
                          Pierde el acceso al instante. Solo se puede eliminar un usuario que aún no ha hecho cambios en el sistema; si ya
                          trabajó con la app, desactívalo para conservar su historial.
                        </p>
                      </ConfirmDelete>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      <UserForm
        key={formKey('user', editing)}
        user={editing}
        isSelf={editing !== 'new' && editing?.id === me?.id}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

const empty: StaffUserInput & { confirm: string } = { email: '', role: 'SUPERVISOR', active: true, password: '', confirm: '' };

function UserForm({ user, isSelf, onClose }: { user: StaffUser | 'new' | null; isSelf: boolean; onClose: () => void }) {
  const isNew = user === 'new';
  const [form, setForm] = useState(() =>
    user && user !== 'new' ? { email: user.email, role: user.role, active: user.active, password: '', confirm: '' } : empty,
  );
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveStaffUser();
  const toast = useToast();
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched ? emailProblem(form.email) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    const pass = form.password ?? '';
    const email = emailProblem(form.email);
    if (email) local.push(email);
    local.push(...passwordProblems(pass, form.confirm, { required: isNew }));
    if (local.length) {
      setEmailTouched(true);
      return setErrors(local);
    }

    const data: Partial<StaffUserInput> = { email: form.email.trim(), role: form.role, active: form.active };
    if (pass) data.password = pass;
    if (isSelf) {
      delete data.role;
      delete data.active;
    }
    save.mutate(
      { id: isNew ? undefined : (user as StaffUser).id, data },
      {
        onSuccess: (u) => {
          toast.success(isNew ? 'Usuario creado' : 'Cambios guardados', u.email);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={isNew ? 'Nuevo usuario' : isSelf ? 'Mi usuario' : 'Editar usuario'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={save.isPending}>
            {isNew ? 'Crear usuario' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Correo" htmlFor="u-email" error={emailError ?? undefined}>
          <input
            id="u-email"
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
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onBlur={() => setEmailTouched(true)}
            placeholder="nombre@empresa.com"
          />
        </Field>
        <Field label="Rol" htmlFor="u-role" hint={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}>
          <select
            id="u-role"
            className={inputClass}
            value={form.role}
            disabled={isSelf}
            onChange={(e) => setForm({ ...form, role: e.target.value as StaffUserInput['role'] })}
          >
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={isNew ? 'Contraseña' : 'Nueva contraseña'}
            htmlFor="u-pass"
            hint={isNew ? `De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.` : 'Déjala vacía para no cambiarla.'}
          >
            <PasswordInput
              id="u-pass"
              autoComplete="new-password"
              limit={PASSWORD_MAX}
              revealed={revealed}
              onRevealedChange={setRevealed}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Repite la contraseña" htmlFor="u-pass2">
            <PasswordInput
              id="u-pass2"
              autoComplete="new-password"
              limit={PASSWORD_MAX}
              revealed={revealed}
              onRevealedChange={setRevealed}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </Field>
        </div>
        <button
          type="button"
          className="-mt-2 text-sm font-medium text-brand-700 hover:underline"
          onClick={() => {
            const generated = generatePassword();
            setForm({ ...form, password: generated, confirm: generated });
            setRevealed(true);
          }}
        >
          Generar una contraseña
        </button>
        {!isSelf && (
          <div className="flex items-center gap-2">
            <input
              id="u-active"
              type="checkbox"
              className="h-4 w-4 accent-brand-700"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <label htmlFor="u-active" className="text-sm">
              Usuario activo (puede iniciar sesión)
            </label>
          </div>
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
