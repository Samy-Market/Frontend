import { FormEvent, useEffect, useState } from 'react';
import { PageHeader } from './AdminLayout';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toaster';
import { Button, cn, EmptyState, ErrorState, Field, inputClass, Modal, Spinner, TableCard, tableClass, tdClass, thClass } from '@/components/ui';
import { ShiftInput, useSaveShift, useShifts } from '@/hooks/admin';
import { ApiError, errorMessage } from '@/lib/api';
import type { Shift } from '@/lib/types';

export default function Shifts() {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN';
  const list = useShifts();
  const [editing, setEditing] = useState<Shift | 'new' | null>(null);

  return (
    <>
      <PageHeader
        title="Turnos"
        description="Hora de entrada, salida y minutos de tolerancia antes de considerar atraso."
        actions={canEdit && <Button onClick={() => setEditing('new')}>+ Nuevo turno</Button>}
      />
      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700"><Spinner /></div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState title="No hay turnos configurados" />
      ) : (
        <TableCard>
          <table className={tableClass}>
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className={thClass}>Nombre</th>
                <th scope="col" className={thClass}>Entrada</th>
                <th scope="col" className={thClass}>Salida</th>
                <th scope="col" className={thClass}>Tolerancia</th>
                <th scope="col" className={thClass}>Empleados activos</th>
                {canEdit && <th scope="col" className={thClass}><span className="sr-only">Acciones</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {list.data.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className={cn(tdClass, 'font-medium')}>{s.name}</td>
                  <td className={cn(tdClass, 'tabular-nums')}>{s.startTime}</td>
                  <td className={cn(tdClass, 'tabular-nums')}>{s.endTime}</td>
                  <td className={tdClass}>{s.toleranceMinutes} min</td>
                  <td className={tdClass}>{s._count?.employees ?? 0}</td>
                  {canEdit && (
                    <td className={cn(tdClass, 'text-right')}>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(s)} aria-label={`Editar turno ${s.name}`}>
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
      {canEdit && <ShiftForm shift={editing} onClose={() => setEditing(null)} />}
      <p className="mt-4 text-xs text-slate-500">
        Los cambios de turno aplican a las marcaciones nuevas; el atraso de marcaciones pasadas se conserva tal como se registró.
      </p>
    </>
  );
}

const empty: ShiftInput = { name: '', startTime: '08:00', endTime: '17:00', toleranceMinutes: 10 };

function ShiftForm({ shift, onClose }: { shift: Shift | 'new' | null; onClose: () => void }) {
  const isNew = shift === 'new';
  const [form, setForm] = useState<ShiftInput>(empty);
  const [errors, setErrors] = useState<string[]>([]);
  const save = useSaveShift();
  const toast = useToast();

  useEffect(() => {
    setErrors([]);
    if (shift === 'new') setForm(empty);
    else if (shift) setForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime, toleranceMinutes: shift.toleranceMinutes });
  }, [shift]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(
      { id: isNew ? undefined : (shift as Shift).id, data: { ...form, toleranceMinutes: Number(form.toleranceMinutes) } },
      {
        onSuccess: (s) => {
          toast.success(isNew ? 'Turno creado' : 'Turno actualizado', s.name);
          onClose();
        },
        onError: (err) => setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={!!shift}
      onClose={onClose}
      title={isNew ? 'Nuevo turno' : 'Editar turno'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="shift-form" loading={save.isPending}>Guardar</Button>
        </>
      }
    >
      <form id="shift-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Nombre" htmlFor="s-name">
            <input id="s-name" required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
        </div>
        <Field label="Hora de entrada" htmlFor="s-start">
          <input id="s-start" type="time" required className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </Field>
        <Field label="Hora de salida" htmlFor="s-end">
          <input id="s-end" type="time" required className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </Field>
        <div className="col-span-2">
          <Field label="Tolerancia (minutos)" htmlFor="s-tol" hint="Ingresos hasta la hora de entrada + tolerancia no cuentan como atraso.">
            <input id="s-tol" type="number" min={0} max={240} required className={inputClass} value={form.toleranceMinutes} onChange={(e) => setForm({ ...form, toleranceMinutes: Number(e.target.value) })} />
          </Field>
        </div>
        {errors.length > 0 && (
          <ul role="alert" className="col-span-2 list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((er) => <li key={er}>{er}</li>)}
          </ul>
        )}
      </form>
    </Modal>
  );
}
