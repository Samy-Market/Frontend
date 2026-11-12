import { FormEvent, useState } from 'react';
import { useToast } from '@/components/toast';
import { Button, Field, inputClass, Modal } from '@/components/ui';
import { useCreateJustification } from '@/hooks/employee';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatDayKey, formatLate } from '@/lib/time';
import type { MarkRecord } from '@/lib/types';

export type JustifyTarget = { kind: 'mark'; record: MarkRecord } | { kind: 'absence'; date: string };

export function JustifyModal({ target, onClose }: { target: JustifyTarget | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateJustification();
  const toast = useToast();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!target) return;
    if (reason.trim().length < 10) {
      setError('Describe el motivo con al menos 10 caracteres.');
      return;
    }
    create.mutate(
      target.kind === 'mark' ? { attendanceId: target.record.id, reason: reason.trim() } : { date: target.date, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success('Solicitud enviada', 'Tu supervisor la revisará pronto.');
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <Modal
      open={!!target}
      onClose={onClose}
      title={target?.kind === 'absence' ? 'Justificar ausencia' : 'Solicitar corrección'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="justify-form" loading={create.isPending}>
            Enviar solicitud
          </Button>
        </>
      }
    >
      {target && (
        <form id="justify-form" onSubmit={submit} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            {target.kind === 'mark' ? (
              <>
                <span className="font-medium">{target.record.type === 'IN' ? 'Ingreso' : 'Salida'}</span> del{' '}
                {formatDateTime(target.record.timestamp)}
                {target.record.isLate && <span className="text-amber-700"> · {formatLate(target.record.lateMinutes)} de atraso</span>}
              </>
            ) : (
              <>
                <span className="font-medium">Ausencia</span> del {formatDayKey(target.date)} · no hay marcaciones
              </>
            )}
          </div>
          <Field
            label="Motivo"
            htmlFor="reason"
            hint={
              target.kind === 'absence'
                ? 'Explica por qué no asististe (por ejemplo: cita médica, calamidad doméstica, permiso acordado).'
                : 'Explica qué pasó (por ejemplo: cita médica, olvido de marcar salida, problema de transporte).'
            }
            error={error ?? undefined}
          >
            <textarea
              id="reason"
              rows={4}
              maxLength={1000}
              className={inputClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              autoFocus
            />
          </Field>
        </form>
      )}
    </Modal>
  );
}
