import { Link } from 'react-router-dom';
import { surfaceClass } from '@/components/ui';
import { cn } from '@/lib/styles';
import { useEmployees, useSchedules, useShifts, useSites } from '@/hooks/admin';

interface Step {
  title: string;
  description: string;
  to: string;
  action: string;
  done: boolean;
  detail?: string;
}

/**
 * Guía de configuración inicial para el administrador: muestra en orden lo que
 * hay que preparar antes de que los empleados empiecen a marcar.
 * Se oculta sola cuando todos los pasos están completos.
 */
export function SetupGuide() {
  const sites = useSites();
  const shifts = useShifts();
  const schedules = useSchedules();
  const employees = useEmployees({ active: 'true' });

  if (sites.isPending || shifts.isPending || schedules.isPending || employees.isPending) return null;
  if (sites.isError || shifts.isError || schedules.isError || employees.isError) return null;

  const activeSites = sites.data.filter((s) => s.active).length;
  const activeSchedules = schedules.data.filter((s) => s.active).length;
  const emp = employees.data;
  const withoutSchedule = emp.filter((e) => !e.currentSchedule).length;

  const steps: Step[] = [
    {
      title: 'Crea las sedes',
      description: 'Los locales de la empresa donde trabaja el personal.',
      to: '/admin/sedes',
      action: 'Ir a Sedes',
      done: activeSites > 0,
      detail: activeSites ? `${activeSites} ${activeSites === 1 ? 'sede' : 'sedes'}` : undefined,
    },
    {
      title: 'Define los turnos',
      description: 'Bloques horarios con su tolerancia, por ejemplo “Mañana 08:00–18:00”.',
      to: '/admin/turnos',
      action: 'Ir a Turnos',
      done: shifts.data.length > 0,
      detail: shifts.data.length ? `${shifts.data.length} ${shifts.data.length === 1 ? 'turno' : 'turnos'}` : undefined,
    },
    {
      title: 'Arma los horarios',
      description: 'Qué turno toca cada día de la semana (rotaciones).',
      to: '/admin/horarios',
      action: 'Ir a Horarios',
      done: activeSchedules > 0,
      detail: activeSchedules ? `${activeSchedules} ${activeSchedules === 1 ? 'horario' : 'horarios'}` : undefined,
    },
    {
      title: 'Registra a los empleados',
      description: 'Cada uno con su sede y su contraseña para entrar desde el celular.',
      to: '/admin/empleados',
      action: 'Ir a Empleados',
      done: emp.length > 0,
      detail: emp.length ? `${emp.length} ${emp.length === 1 ? 'empleado' : 'empleados'}` : undefined,
    },
    {
      title: 'Asigna los horarios',
      description: 'Indica qué horario sigue cada empleado y desde qué fecha.',
      to: '/admin/horarios',
      action: 'Asignar horarios',
      done: emp.length > 0 && withoutSchedule === 0,
      detail: emp.length && withoutSchedule ? `${withoutSchedule} sin horario` : undefined,
    },
  ];

  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;
  // El paso actual es el primero sin completar; los siguientes quedan en espera.
  const current = steps.findIndex((s) => !s.done);

  return (
    <section aria-labelledby="setup-title" className={cn(surfaceClass, 'mb-8 overflow-hidden')}>
      <div className="flex flex-col gap-3 px-6 pb-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-brand-700">Primeros pasos</p>
          <h2 id="setup-title" className="text-2xl font-semibold">
            Configura SAMY en {steps.length} pasos
          </h2>
          <p className="mt-1 text-sm text-slate-500">Sigue el orden: cada paso usa lo que preparaste en el anterior.</p>
        </div>
        <div className="sm:w-48">
          <p className="mb-1.5 text-right text-xs text-slate-500">
            {completed} de {steps.length} completados
          </p>
          <div
            className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={completed}
          >
            <div
              className="h-full rounded-full bg-brand-700 transition-[width] duration-700 ease-[var(--ease-apple)]"
              style={{ width: `${(completed / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <ol className="stagger divide-y divide-black/5 border-t border-black/5">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const locked = i > current;
          return (
            <li key={s.title} className={cn('flex items-center gap-4 px-6 py-4', isCurrent && 'bg-brand-50/60')}>
              <span
                aria-hidden
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  s.done
                    ? 'bg-brand-700 text-on-accent'
                    : isCurrent
                      ? 'bg-white text-brand-700 ring-2 ring-brand-700'
                      : 'bg-black/[0.05] text-slate-400',
                )}
              >
                {s.done ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('font-medium', locked && 'text-slate-400')}>
                  <span className="sr-only">
                    Paso {i + 1}
                    {s.done ? ', completado' : isCurrent ? ', siguiente' : ', pendiente'}:{' '}
                  </span>
                  {s.title}
                  {s.detail && (
                    <span className={cn('ml-2 text-sm font-normal', s.done ? 'text-slate-500' : 'text-amber-700')}>· {s.detail}</span>
                  )}
                </p>
                <p className={cn('text-sm', locked ? 'text-slate-400' : 'text-slate-500')}>{s.description}</p>
              </div>
              {isCurrent ? (
                <Link
                  to={s.to}
                  className="shrink-0 rounded-full bg-brand-700 px-4 py-2 text-sm font-medium text-on-accent transition-all duration-200 hover:bg-brand-800 active:scale-[0.97]"
                >
                  {s.action}
                </Link>
              ) : s.done ? (
                <Link to={s.to} className="shrink-0 rounded-full px-3 py-1.5 text-sm text-brand-700 hover:bg-black/5">
                  Ver
                </Link>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
