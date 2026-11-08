import { useState } from 'react';
import { formKey } from '@/lib/form';
import { AssignModal, AssignPreset } from './Schedules';
import { useToast } from '@/components/toast';
import { Badge, Button, ErrorState, inputClass, Modal, Spinner } from '@/components/ui';
import { useDeleteAssignment, useEmployeeAssignments, useUpdateAssignment } from '@/hooks/admin';
import { errorMessage } from '@/lib/api';
import { daysUntil, formatDayKeyNumeric } from '@/lib/time';
import type { Assignment, Employee } from '@/lib/types';

/** Celda de la tabla de empleados: horario vigente, hasta cuándo y el siguiente. */
export function ScheduleCell({ employee: e, onOpen }: { employee: Employee; onOpen: () => void }) {
  const cur = e.currentSchedule;
  const next = e.nextSchedule;
  const endingSoon = cur?.endDate && daysUntil(cur.endDate) <= 14 && !next;
  return (
    <button onClick={onOpen} className="group text-left" aria-label={`Ver horarios de ${e.fullName}`}>
      {cur ? (
        <>
          <span className="font-medium group-hover:underline">{cur.scheduleName}</span>
          <span className="block text-xs text-slate-500">
            {cur.endDate ? `hasta ${formatDayKeyNumeric(cur.endDate)}` : 'sin fecha de fin'}
            {endingSoon && <span className="ml-1 font-medium text-amber-700">· por terminar</span>}
          </span>
        </>
      ) : (
        <Badge tone="amber">Sin horario</Badge>
      )}
      {next && (
        <span className="block text-xs text-brand-700">
          Luego: {next.scheduleName} desde {formatDayKeyNumeric(next.startDate)}
        </span>
      )}
    </button>
  );
}

const statusView = {
  CURRENT: { label: 'Vigente', tone: 'green' },
  UPCOMING: { label: 'Próximo', tone: 'sky' },
  PAST: { label: 'Terminado', tone: 'slate' },
} as const;

/** Historial de rotaciones de un empleado, con acciones para terminar, ajustar o quitar. */
export function EmployeeSchedulesModal({
  employee,
  canEdit,
  onClose,
}: {
  employee: Employee | null;
  canEdit: boolean;
  onClose: () => void;
}) {
  const q = useEmployeeAssignments(employee?.id ?? null);
  const [assigning, setAssigning] = useState<AssignPreset | null>(null);
  const [editingEnd, setEditingEnd] = useState<Assignment | null>(null);

  return (
    <>
      <Modal
        open={!!employee && !assigning}
        onClose={onClose}
        size="lg"
        title={`Horarios de ${employee?.fullName ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
            {canEdit && employee && <Button onClick={() => setAssigning({ employeeIds: [employee.id] })}>Asignar horario</Button>}
          </>
        }
      >
        {q.isPending ? (
          <div className="flex justify-center py-10 text-brand-700">
            <Spinner />
          </div>
        ) : q.isError ? (
          <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
        ) : q.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Este empleado no tiene horario. Mientras no tenga uno, no se calculan atrasos ni ausencias.
          </p>
        ) : (
          <ul className="space-y-2">
            {q.data.map((a) => (
              <AssignmentRow key={a.id} a={a} canEdit={canEdit} onEditEnd={() => setEditingEnd(a)} />
            ))}
          </ul>
        )}
      </Modal>

      <AssignModal key={formKey('assign', !!assigning)} preset={assigning} onClose={() => setAssigning(null)} />
      <EndDateModal assignment={editingEnd} onClose={() => setEditingEnd(null)} />
    </>
  );
}

function AssignmentRow({ a, canEdit, onEditEnd }: { a: Assignment; canEdit: boolean; onEditEnd: () => void }) {
  const del = useDeleteAssignment();
  const toast = useToast();
  const view = statusView[a.status];
  return (
    <li className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 font-medium">
          {a.schedule.name} <Badge tone={view.tone}>{view.label}</Badge>
        </p>
        <p className="text-sm text-slate-600">
          {formatDayKeyNumeric(a.startDate)} → {a.endDate ? formatDayKeyNumeric(a.endDate) : 'sin fecha de fin'}
        </p>
      </div>
      {canEdit && a.status !== 'PAST' && (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={onEditEnd}>
            Cambiar fin
          </Button>
          {a.status === 'UPCOMING' && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700"
              loading={del.isPending}
              onClick={() =>
                del.mutate(a.id, {
                  onSuccess: () => toast.success('Horario quitado', `${a.schedule.name} ya no se aplicará.`),
                  onError: (err) => toast.error('No se pudo quitar', errorMessage(err)),
                })
              }
            >
              Quitar
            </Button>
          )}
        </div>
      )}
    </li>
  );
}

function EndDateModal({ assignment, onClose }: { assignment: Assignment | null; onClose: () => void }) {
  const update = useUpdateAssignment();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);
  if (assignment && assignment.id !== lastId) {
    setLastId(assignment.id);
    setValue(assignment.endDate ?? '');
    setError(null);
  }

  const save = (endDate: string | null) =>
    assignment &&
    update.mutate(
      { id: assignment.id, endDate },
      {
        onSuccess: () => {
          toast.success('Fecha actualizada', endDate ? `Termina el ${formatDayKeyNumeric(endDate)}.` : 'Sin fecha de fin.');
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );

  return (
    <Modal
      open={!!assignment}
      onClose={onClose}
      title={`Fecha de fin: ${assignment?.schedule.name ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => save(null)} loading={update.isPending}>
            Sin fecha de fin
          </Button>
          <Button onClick={() => (value ? save(value) : setError('Elige una fecha.'))} loading={update.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <label htmlFor="end-date" className="mb-1 block text-sm font-medium">
        Último día de este horario
      </label>
      <input
        id="end-date"
        type="date"
        min={assignment?.startDate}
        className={inputClass}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <p className="mt-2 text-xs text-slate-500">Desde el día siguiente el empleado queda sin horario hasta que le asignes otro.</p>
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Modal>
  );
}
