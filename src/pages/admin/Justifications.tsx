import { FormEvent, useState } from 'react';
import { PageHeader } from './AdminLayout';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputClass, Modal, Spinner } from '@/components/ui';
import { cn, justificationLabel, justificationTarget, justificationTone } from '@/lib/styles';
import { useJustifications, useReviewJustification } from '@/hooks/admin';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatDayKey, formatLate } from '@/lib/time';
import type { Justification, JustificationStatus } from '@/lib/types';

const tabs: { key: JustificationStatus | undefined; label: string }[] = [
  { key: 'PENDING', label: 'Pendientes' },
  { key: 'APPROVED', label: 'Aprobadas' },
  { key: 'REJECTED', label: 'Rechazadas' },
  { key: undefined, label: 'Todas' },
];

export default function Justifications() {
  const [status, setStatus] = useState<JustificationStatus | undefined>('PENDING');
  const list = useJustifications(status);
  const [reviewing, setReviewing] = useState<{ j: Justification; decision: 'APPROVED' | 'REJECTED' } | null>(null);

  return (
    <>
      <PageHeader
        title="Justificaciones"
        description="Solicitudes de corrección enviadas por los empleados. Las nuevas aparecen en vivo."
      />

      <div role="tablist" aria-label="Filtrar por estado" className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={status === t.key}
            onClick={() => setStatus(t.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              status === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : list.isError ? (
        <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
      ) : list.data.length === 0 ? (
        <EmptyState
          title={status === 'PENDING' ? 'No hay solicitudes pendientes' : 'No hay solicitudes en esta vista'}
          description={status === 'PENDING' ? '¡Todo al día!' : undefined}
        />
      ) : (
        <ul className="stagger grid gap-3 lg:grid-cols-2">
          {list.data.map((j) => (
            <li key={j.id}>
              <Card className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{j.employee.fullName}</p>
                    <p className="text-xs text-slate-500">{j.employee.position}</p>
                  </div>
                  <Badge tone={justificationTone[j.status]}>{justificationLabel[j.status]}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  {j.attendance ? (
                    <>
                      <span className="font-medium">{j.attendance.type === 'IN' ? 'Ingreso' : 'Salida'}</span>
                      <span className="tabular-nums">{formatDateTime(j.attendance.timestamp)}</span>
                      {j.attendance.isLate && <Badge tone="red">Atraso {formatLate(j.attendance.lateMinutes)}</Badge>}
                    </>
                  ) : (
                    <>
                      <span className="font-medium">Ausencia</span>
                      <span>{j.date ? formatDayKey(j.date) : '—'}</span>
                      <Badge tone="red">No marcó</Badge>
                    </>
                  )}
                </div>
                <p className="mt-3 flex-1 whitespace-pre-line text-sm text-slate-700">{j.reason}</p>
                <p className="mt-2 text-xs text-slate-500">Enviada el {formatDateTime(j.createdAt)}</p>

                {j.status === 'PENDING' ? (
                  <div className="mt-4 flex gap-2">
                    <Button variant="success" size="sm" onClick={() => setReviewing({ j, decision: 'APPROVED' })}>
                      Aprobar
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setReviewing({ j, decision: 'REJECTED' })}>
                      Rechazar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    Revisada el {formatDateTime(j.reviewedAt)} por {j.reviewer?.email ?? '—'}
                    {j.reviewNote && <p className="mt-1 text-sm text-slate-700">“{j.reviewNote}”</p>}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ReviewModal state={reviewing} onClose={() => setReviewing(null)} />
    </>
  );
}

function ReviewModal({ state, onClose }: { state: { j: Justification; decision: 'APPROVED' | 'REJECTED' } | null; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const review = useReviewJustification();
  const toast = useToast();
  const approve = state?.decision === 'APPROVED';

  const close = () => {
    setNote('');
    setError(null);
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!state) return;
    review.mutate(
      { id: state.j.id, status: state.decision, reviewNote: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(approve ? 'Justificación aprobada' : 'Justificación rechazada', `Se notificó a ${state.j.employee.fullName}.`);
          close();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <Modal
      open={!!state}
      onClose={close}
      title={approve ? 'Aprobar justificación' : 'Rechazar justificación'}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form="review-form" variant={approve ? 'success' : 'danger'} loading={review.isPending}>
            {approve ? 'Aprobar' : 'Rechazar'}
          </Button>
        </>
      }
    >
      {state && (
        <form id="review-form" onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-700">
            {state.j.employee.fullName} · {justificationTarget(state.j)}
          </p>
          <Field label="Nota para el empleado (opcional)" htmlFor="review-note" error={error ?? undefined}>
            <textarea
              id="review-note"
              rows={3}
              maxLength={500}
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <p className="text-xs text-slate-500">La decisión queda registrada en la auditoría y el empleado la recibe al instante.</p>
        </form>
      )}
    </Modal>
  );
}
