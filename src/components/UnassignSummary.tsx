import { Spinner } from './ui';
import { errorMessage } from '@/lib/api';
import { formatDayKeyNumeric } from '@/lib/time';
import type { UnassignPreviewItem } from '@/lib/types';

const range = (g: { from: string; to: string | null }) =>
  g.to
    ? `del ${formatDayKeyNumeric(g.from)} al ${formatDayKeyNumeric(g.to)}`
    : `desde el ${formatDayKeyNumeric(g.from)} (sin fecha de fin)`;

export function UnassignSummary({
  query,
  restore,
  onRestoreChange,
}: {
  query: { isPending: boolean; isError: boolean; error: unknown; data?: UnassignPreviewItem[] };
  restore: boolean;
  onRestoreChange: (v: boolean) => void;
}) {
  if (query.isPending) {
    return (
      <div className="flex justify-center py-6 text-brand-700">
        <Spinner />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        {errorMessage(query.error)}
      </p>
    );
  }
  const items = query.data;
  const restorable = items.filter((i) => i.action !== 'none' && i.previous?.canRestore);

  return (
    <div className="space-y-3 text-sm">
      <ul className="max-h-64 space-y-2 overflow-y-auto">
        {items.map((i) => (
          <li key={i.id} className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="font-medium">{i.employee.fullName}</p>
            {i.action === 'none' || !i.gap ? (
              <p className="text-slate-500">No se quita: ya termina hoy o ya terminó.</p>
            ) : (
              <p className="text-slate-600">
                {i.action === 'delete' ? 'Se elimina' : 'Lo conserva hasta hoy'}.{' '}
                {restore && i.previous?.canRestore ? (
                  <span className="text-emerald-700">
                    Vuelve a <strong>{i.previous.schedule.name}</strong> {range({ from: i.gap.from, to: i.previous.until })}.
                    {i.previous.until && i.previous.until !== i.gap.to && (
                      <span className="block text-xs text-amber-700">
                        Después del {formatDayKeyNumeric(i.previous.until)} queda sin horario, como estaba antes.
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-amber-700">Quedará sin horario {range(i.gap)}.</span>
                )}
                {i.previous && !i.previous.canRestore && (
                  <span className="block text-xs text-slate-500">
                    Su horario anterior ({i.previous.schedule.name}) está desactivado y no se puede restaurar.
                  </span>
                )}
              </p>
            )}
          </li>
        ))}
      </ul>
      {restorable.length > 0 && (
        <label className="flex cursor-pointer items-start gap-2 rounded-xl px-1">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-700"
            checked={restore}
            onChange={(e) => onRestoreChange(e.target.checked)}
          />
          <span>
            <span className="font-medium">Volver a su horario anterior</span>
            <span className="block text-xs text-slate-500">
              {restorable.length === 1 ? 'Tenía' : `${restorable.length} personas tenían`} otro horario justo antes de este. Así no quedan
              días sin horario.
            </span>
          </span>
        </label>
      )}
      <p className="text-xs text-slate-500">Las marcaciones y el historial no se tocan.</p>
    </div>
  );
}
