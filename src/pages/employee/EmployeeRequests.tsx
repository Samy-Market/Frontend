import { Badge, Card, EmptyState, ErrorState, justificationLabel, justificationTone, Spinner } from '@/components/ui';
import { useMyJustifications } from '@/hooks/employee';
import { errorMessage } from '@/lib/api';
import { formatDateTime } from '@/lib/time';

export default function EmployeeRequests() {
  const q = useMyJustifications();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Mis solicitudes</h1>
        <p className="text-sm text-slate-500">Para crear una, ve al Historial y toca “Justificar” en la marcación.</p>
      </div>

      {q.isPending ? (
        <div className="flex justify-center py-16 text-brand-700">
          <Spinner />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.data.length === 0 ? (
        <EmptyState title="Aún no tienes solicitudes" />
      ) : (
        <ul className="space-y-3">
          {q.data.map((j) => (
            <li key={j.id}>
              <Card>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      {j.attendance.type === 'IN' ? 'Ingreso' : 'Salida'} · {formatDateTime(j.attendance.timestamp)}
                    </p>
                    <p className="text-xs text-slate-500">Enviada el {formatDateTime(j.createdAt)}</p>
                  </div>
                  <Badge tone={justificationTone[j.status]}>{justificationLabel[j.status]}</Badge>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{j.reason}</p>
                {j.status !== 'PENDING' && (
                  <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <p className="text-xs text-slate-500">
                      Revisada el {formatDateTime(j.reviewedAt)}
                      {j.reviewer ? ` por ${j.reviewer.email}` : ''}
                    </p>
                    {j.reviewNote && <p className="mt-1 text-slate-700">“{j.reviewNote}”</p>}
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
