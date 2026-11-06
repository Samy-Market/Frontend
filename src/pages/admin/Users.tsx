import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toaster';
import { Badge, Button, cn, EmptyState, ErrorState, Field, inputClass, Modal, Spinner, TableCard, tableClass, tdClass, thClass } from '@/components/ui';
import { StaffUserInput, useSaveStaffUser, useStaffUsers } from '@/hooks/admin';
import { ApiError, errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/time';
import type { StaffUser } from '@/lib/types';

const roleLabel = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor' } as const;

/** Usuarios del personal: administradores y supervisores (los empleados se gestionan en Empleados). */
export default function Users() {
  const { user: me } = useAuth();
  const list = useStaffUsers();
  const [editing, setEditing] = useState<StaffUser | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administradores y supervisores con acceso al panel. Los empleados se gestionan en la sección Empleados."
        actions={<Button onClick={() => setEditing('new')}>+ Nuevo usuario</Button>}
      />

      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <p className="font-medium">Administrador</p>
          <p className="text-slate-600">Todo: empleados, turnos, usuarios, justificaciones y reportes.</p>
        </div>
        <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <p className="font-medium">Supervisor</p>
          <p className="text-slate-600">Dashboard en vivo, justificaciones y reportes. Ve empleados y turnos sin editarlos.</p>
        </div>
      </div>

      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700"><Spinner /></div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState title="No hay usuarios" />
      ) : (
        <TableCard>
          <table className={tableClass}>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className={thClass}>Correo</th>
                <th scope="col" className={thClass}>Rol</th>
                <th scope="col" className={thClass}>Estado</th>
                <th scope="col" className={thClass}>Creado</th>
                <th scope="col" className={thClass}><span className="sr-only">Acciones</span></th>
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
                    <Button variant="ghost" size="sm" onClick={() => setEditing(u)} aria-label={`Editar a ${u.email}`}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}

      <UserForm user={editing} isSelf={editing !== 'new' && editing?.id === me?.id} onClose={() => setEditing(null)} />
    </>
  );
}

const empty: StaffUserInput & { confirm: string } = { email: '', role: 'SUPERVISOR', active: true, password: '', confirm: '' };

function UserForm({ user, isSelf, onClose }: { user: StaffUser | 'new' | null; isSelf: boolean; onClose: () => void }) {
  const isNew = user === 'new';
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveStaffUser();
  const toast = useToast();

  useEffect(() => {
    setErrors([]);
    if (user === 'new') setForm(empty);
    else if (user) setForm({ email: user.email, role: user.role, active: user.active, password: '', confirm: '' });
  }, [user]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    const pass = form.password ?? '';
    if (isNew && pass.length < 8) local.push('La contraseña debe tener al menos 8 caracteres.');
    if (!isNew && pass && pass.length < 8) local.push('La nueva contraseña debe tener al menos 8 caracteres.');
    if (pass && pass !== form.confirm) local.push('Las contraseñas no coinciden.');
    if (local.length) return setErrors(local);

    const data: Partial<StaffUserInput> = { email: form.email, role: form.role, active: form.active };
    if (pass) data.password = pass;
    if (isSelf) {
      // El backend no permite cambiar el propio rol ni desactivarse.
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
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="user-form" loading={save.isPending}>
            {isNew ? 'Crear usuario' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Correo" htmlFor="u-email">
          <input id="u-email" type="email" required autoComplete="off" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Rol" htmlFor="u-role" hint={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}>
          <select id="u-role" className={inputClass} value={form.role} disabled={isSelf} onChange={(e) => setForm({ ...form, role: e.target.value as StaffUserInput['role'] })}>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isNew ? 'Contraseña' : 'Nueva contraseña'} htmlFor="u-pass" hint={isNew ? 'Mínimo 8 caracteres.' : 'Déjala vacía para no cambiarla.'}>
            <input id="u-pass" type="password" autoComplete="new-password" className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <Field label="Repite la contraseña" htmlFor="u-pass2">
            <input id="u-pass2" type="password" autoComplete="new-password" className={inputClass} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </Field>
        </div>
        {!isSelf && (
          <div className="flex items-center gap-2">
            <input id="u-active" type="checkbox" className="h-4 w-4 accent-brand-700" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            <label htmlFor="u-active" className="text-sm">Usuario activo (puede iniciar sesión)</label>
          </div>
        )}
        {errors.length > 0 && (
          <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((er) => <li key={er}>{er}</li>)}
          </ul>
        )}
      </form>
    </Modal>
  );
}
