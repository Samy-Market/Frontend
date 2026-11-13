import { FormEvent, useState } from 'react';
import { PageHeader } from './AdminLayout';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, EmptyState, ErrorState, Field, inputClass, Modal, Spinner } from '@/components/ui';
import { cn, justificationLabel, justificationTarget, justificationTone } from '@/lib/styles';
import { useJustificationCorrection, useJustifications, useReviewJustification, useRevertJustification } from '@/hooks/admin';
import { useAuth } from '@/auth/auth';
import { errorMessage } from '@/lib/api';
import { atDayTime, dayKeyOf, exitAfter, formatDateTime, formatDayKey, formatLate, formatMinutes, formatTime } from '@/lib/time';
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
  const [reverting, setReverting] = useState<Justification | null>(null);
  const isAdmin = useAuth().user?.role === 'ADMIN';

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
                <figure className="mt-3 flex-1">
                  <div className="rounded-xl border-l-4 border-brand-700 bg-brand-50 px-4 py-3">
                    <figcaption className="text-[11px] font-semibold uppercase tracking-wide text-brand-800">
                      Motivo del empleado
                    </figcaption>
                    <blockquote className="mt-1 whitespace-pre-line text-[15px] font-medium leading-relaxed text-ink">
                      {j.reason}
                    </blockquote>
                  </div>
                </figure>
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        Revisada el {formatDateTime(j.reviewedAt)} por {j.reviewer?.email ?? '—'}
                      </span>
                      {isAdmin && (
                        <Button variant="secondary" size="sm" className="ml-auto" onClick={() => setReverting(j)}>
                          Deshacer decisión
                        </Button>
                      )}
                    </div>
                    {j.reviewNote && <p className="mt-2 text-sm text-slate-700">Nota del jefe: “{j.reviewNote}”</p>}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ReviewModal state={reviewing} onClose={() => setReviewing(null)} />
      <RevertModal j={reverting} onClose={() => setReverting(null)} />
    </>
  );
}

function RevertModal({ j, onClose }: { j: Justification | null; onClose: () => void }) {
  const revert = useRevertJustification();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const close = () => {
    setError(null);
    onClose();
  };
  const confirm = () =>
    j &&
    revert.mutate(j.id, {
      onSuccess: () => {
        toast.success('Decisión deshecha', `La justificación de ${j.employee.fullName} volvió a Pendiente.`);
        close();
      },
      onError: (err) => setError(errorMessage(err)),
    });

  return (
    <Modal
      open={!!j}
      onClose={close}
      title="Deshacer decisión"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button variant="danger" loading={revert.isPending} onClick={confirm}>
            Deshacer
          </Button>
        </>
      }
    >
      {j && (
        <div className="space-y-3 text-sm">
          <p>
            La justificación de <strong>{j.employee.fullName}</strong> ({justificationTarget(j)}) estaba{' '}
            <strong>{justificationLabel[j.status].toLowerCase()}</strong>. Al deshacer:
          </p>
          <ul className="list-inside list-disc text-slate-600">
            <li>
              Vuelve a <strong>Pendiente</strong> para revisarla otra vez.
            </li>
            <li>Se borran las marcaciones que el jefe registró al aprobarla y se quita el ajuste de hora de llegada, si los hubo.</li>
            <li>El atraso o la ausencia vuelven a contar hasta que se decida de nuevo.</li>
            <li>El empleado recibe un aviso y queda registrado en la auditoría.</li>
          </ul>
          {error && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function ReviewModal({ state, onClose }: { state: { j: Justification; decision: 'APPROVED' | 'REJECTED' } | null; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const review = useReviewJustification();
  const toast = useToast();
  const approve = state?.decision === 'APPROVED';
  const correction = useJustificationCorrection(
    approve && (state?.j.attendance?.type === 'IN' || !!state?.j.date) ? (state?.j.id ?? null) : null,
  );
  const exitWindow = correction.data?.missingExit ?? null;
  const creditWin = correction.data?.credit ?? null;
  const [addCredit, setAddCredit] = useState<boolean | null>(null);
  const [creditTime, setCreditTime] = useState<string | null>(null);
  const useCredit = !!creditWin && (addCredit ?? !!state?.j.attendance?.isLate);
  const creditValue = creditTime ?? (creditWin?.suggested ? formatTime(creditWin.suggested) : '');
  const creditAt = creditWin && creditValue ? atDayTime(dayKeyOf(creditWin.inAt), creditValue) : null;
  const creditError =
    creditWin && useCredit
      ? !creditAt
        ? 'Indica la hora de llegada.'
        : creditAt > new Date(creditWin.latest)
          ? 'La hora de llegada debe ser antes de la hora en que marcó.'
          : creditAt < new Date(creditWin.earliest)
            ? `No puede ser antes de las ${formatTime(creditWin.earliest)} (inicio del turno o marcación anterior).`
            : null
      : null;
  const missingDay = correction.data?.missingDay ?? null;
  const [worked, setWorked] = useState(false);
  const [workedFrom, setWorkedFrom] = useState<string | null>(null);
  const [workedTo, setWorkedTo] = useState<string | null>(null);
  const from = workedFrom ?? missingDay?.shift?.startTime ?? '';
  const to = workedTo ?? missingDay?.shift?.endTime ?? '';
  const dayIn = missingDay && from ? atDayTime(missingDay.date, from) : null;
  const dayOut = dayIn && to ? exitAfter(dayIn.toISOString(), to) : null;
  const dayMinutes = dayIn && dayOut ? Math.round((dayOut.getTime() - dayIn.getTime()) / 60_000) : 0;
  const lateMinutes = (() => {
    const s = missingDay?.shift;
    if (!s || !from) return 0;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [fh, fm] = from.split(':').map(Number);
    const diff = fh * 60 + fm - (sh * 60 + sm);
    return diff > s.toleranceMinutes ? diff : 0;
  })();
  const dayError =
    missingDay && worked
      ? !dayIn || !dayOut
        ? 'Indica la hora de ingreso y la de salida.'
        : dayOut > new Date()
          ? 'La salida no puede estar en el futuro.'
          : dayMinutes > 16 * 60
            ? 'Una jornada no puede superar 16 horas.'
            : null
      : null;
  const [addExit, setAddExit] = useState(true);
  const [exitTime, setExitTime] = useState<string | null>(null);
  const time = exitTime ?? (exitWindow?.suggested ? formatTime(exitWindow.suggested) : '');
  const exitAt = exitWindow && time ? exitAfter(exitWindow.inAt, time) : null;
  const exitError =
    exitWindow && addExit
      ? !exitAt
        ? 'Indica la hora de salida.'
        : exitAt < new Date(exitWindow.earliest)
          ? 'La salida debe ser después del ingreso.'
          : exitAt > new Date(exitWindow.latest)
            ? `La salida puede ir hasta las ${formatTime(exitWindow.latest)} del ${formatDayKey(dayKeyOf(exitWindow.latest))}: no puede estar en el futuro ni pasar su siguiente marcación.`
            : null
      : null;

  const close = () => {
    setNote('');
    setError(null);
    setAddExit(true);
    setExitTime(null);
    setWorked(false);
    setWorkedFrom(null);
    setWorkedTo(null);
    setAddCredit(null);
    setCreditTime(null);
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!state) return;
    if (exitError) return setError(exitError);
    if (dayError) return setError(dayError);
    if (creditError) return setError(creditError);
    const sendExit = !!exitWindow && addExit;
    const sendDay = !!missingDay && worked;
    review.mutate(
      {
        id: state.j.id,
        status: state.decision,
        reviewNote: note.trim() || undefined,
        exitTime: sendExit ? time : undefined,
        workedFrom: sendDay ? from : undefined,
        workedTo: sendDay ? to : undefined,
        creditFrom: useCredit ? creditValue : undefined,
      },
      {
        onSuccess: () => {
          toast.success(
            approve ? 'Justificación aprobada' : 'Justificación rechazada',
            sendExit
              ? `Se registró la salida de las ${time} y se notificó a ${state.j.employee.fullName}.`
              : sendDay
                ? `Se registró la jornada de ${from} a ${to} y se notificó a ${state.j.employee.fullName}.`
                : `Se notificó a ${state.j.employee.fullName}.`,
          );
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
          {approve && correction.isPending && state.j.attendance?.type === 'IN' && (
            <div className="flex justify-center py-2 text-brand-700">
              <Spinner />
            </div>
          )}
          {creditWin && (
            <div className="space-y-3 rounded-2xl bg-slate-50 p-3 text-sm">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                  checked={useCredit}
                  onChange={(e) => setAddCredit(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Contar las horas desde la hora real de llegada</span>
                  <span className="block text-xs text-slate-600">
                    Marcó a las {formatTime(creditWin.inAt)}. La marca no cambia; solo las horas se cuentan desde la hora que indiques.
                  </span>
                </span>
              </label>
              {useCredit && (
                <div className="flex flex-wrap items-end gap-3 pl-6">
                  <Field label="Llegó a las" htmlFor="review-credit">
                    <input
                      id="review-credit"
                      type="time"
                      className={cn(inputClass, 'w-32')}
                      value={creditValue}
                      onChange={(e) => setCreditTime(e.target.value)}
                    />
                  </Field>
                  {creditAt && !creditError && (
                    <p className="pb-2 text-xs text-slate-600">
                      Se suman <strong>{formatLate(Math.round((new Date(creditWin.inAt).getTime() - creditAt.getTime()) / 60_000))}</strong>{' '}
                      a esa jornada.
                    </p>
                  )}
                </div>
              )}
              {useCredit && creditError && <p className="pl-6 text-xs text-red-700">{creditError}</p>}
            </div>
          )}
          {exitWindow && (
            <div className="space-y-3 rounded-2xl bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">Este ingreso no tiene marca de salida.</p>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                  checked={addExit}
                  onChange={(e) => setAddExit(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Registrar la salida que olvidó marcar</span>
                  <span className="block text-xs text-slate-600">
                    Así esas horas cuentan en los reportes. Quedará como "registrada por el jefe".
                  </span>
                </span>
              </label>
              {addExit && (
                <div className="flex flex-wrap items-end gap-3">
                  <Field label="Hora de salida" htmlFor="review-exit">
                    <input
                      id="review-exit"
                      type="time"
                      className={cn(inputClass, 'w-32')}
                      value={time}
                      onChange={(e) => setExitTime(e.target.value)}
                    />
                  </Field>
                  {exitAt && !exitError && (
                    <p className="pb-2 text-xs text-slate-600">
                      Ingreso {formatTime(exitWindow.inAt)} → salida {formatTime(exitAt)} del {formatDayKey(dayKeyOf(exitAt))} ·{' '}
                      <strong>{formatMinutes(Math.round((exitAt.getTime() - new Date(exitWindow.inAt).getTime()) / 60_000))}</strong>
                    </p>
                  )}
                </div>
              )}
              {addExit && exitError && <p className="text-xs text-red-700">{exitError}</p>}
            </div>
          )}
          {missingDay && (
            <fieldset className="space-y-3 rounded-2xl bg-slate-50 p-3 text-sm">
              <legend className="sr-only">¿Trabajó ese día?</legend>
              <p className="font-medium">¿Trabajó ese día?</p>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="worked"
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                  checked={!worked}
                  onChange={() => setWorked(false)}
                />
                <span>
                  <span className="font-medium">No trabajó (permiso)</span>
                  <span className="block text-xs text-slate-600">
                    Queda como "Ausencia justificada": no cuenta como falta y suma 0 horas.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="worked"
                  className="mt-0.5 h-4 w-4 accent-brand-700"
                  checked={worked}
                  onChange={() => setWorked(true)}
                />
                <span>
                  <span className="font-medium">Sí trabajó, olvidó marcar</span>
                  <span className="block text-xs text-slate-600">
                    Se registran el ingreso y la salida como "registrados por el jefe" y esas horas cuentan.
                  </span>
                </span>
              </label>
              {worked && (
                <div className="space-y-2 pl-6">
                  <div className="flex flex-wrap items-end gap-3">
                    <Field label="Ingreso" htmlFor="review-in">
                      <input
                        id="review-in"
                        type="time"
                        className={cn(inputClass, 'w-32')}
                        value={from}
                        onChange={(e) => setWorkedFrom(e.target.value)}
                      />
                    </Field>
                    <Field label="Salida" htmlFor="review-out">
                      <input
                        id="review-out"
                        type="time"
                        className={cn(inputClass, 'w-32')}
                        value={to}
                        onChange={(e) => setWorkedTo(e.target.value)}
                      />
                    </Field>
                  </div>
                  {dayIn && dayOut && !dayError && (
                    <p className="text-xs text-slate-600">
                      {formatDayKey(missingDay.date)} · {from} → {to}
                      {dayKeyOf(dayOut) !== missingDay.date && ' (del día siguiente)'} · <strong>{formatMinutes(dayMinutes)}</strong>
                      {lateMinutes > 0 && <span className="text-red-700"> · atraso {formatLate(lateMinutes)}</span>}
                    </p>
                  )}
                  {!missingDay.shift && <p className="text-xs text-slate-500">Ese día no tenía turno asignado: indica las horas a mano.</p>}
                  {dayError && <p className="text-xs text-red-700">{dayError}</p>}
                </div>
              )}
            </fieldset>
          )}
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
