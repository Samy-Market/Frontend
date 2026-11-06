import { FormEvent, useEffect, useState } from 'react';
import { useToast } from '@/components/Toaster';
import { Button, Field, inputClass, Modal } from '@/components/ui';
import { useCreateJustification } from '@/hooks/employee';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatLate } from '@/lib/time';
import type { MarkRecord } from '@/lib/types';

export function JustifyModal({ record, onClose }: { record: MarkRecord | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const create = useCreateJustification();
  const toast = useToast();

  useEffect(() => {
    setReason('');
    setError(null);
  }, [record]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!record) return;
    if (reason.trim().length < 10) {
      setError('Describe el motivo con al menos 10 caracteres.');
      return;
    }
    create.mutate(
      { attendanceId: record.id, reason: reason.trim() },
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
      open={!!record}
      onClose={onClose}
      title="Solicitar corrección"
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
      {record && (
        <form id="justify-form" onSubmit={submit} className="space-y-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="font-medium">{record.type === 'IN' ? 'Ingreso' : 'Salida'}</span> del{' '}
            {formatDateTime(record.timestamp)}
            {record.isLate && <span className="text-amber-700"> · {formatLate(record.lateMinutes)} de atraso</span>}
          </div>
          <Field
            label="Motivo"
            htmlFor="reason"
            hint="Explica qué pasó (por ejemplo: cita médica, olvido de marcar salida, problema de transporte)."
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
