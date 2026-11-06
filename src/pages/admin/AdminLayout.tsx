import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { cn, ConnectionBadge } from '@/components/ui';
import { useJustifications } from '@/hooks/admin';
import { useSocket } from '@/realtime/SocketProvider';

const nav = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7v-9h-7v9Zm0-18v6h7V3h-7Z' },
  { to: '/admin/empleados', label: 'Empleados', icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8' },
  { to: '/admin/turnos', label: 'Turnos', icon: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z' },
  { to: '/admin/justificaciones', label: 'Justificaciones', badge: true, icon: 'M9 12h6m-6 4h6M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z' },
  { to: '/admin/reportes', label: 'Reportes', icon: 'M4 19V5m0 14h16M8 15v-4m4 4V8m4 7v-6' },
];

const roleLabel = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', EMPLOYEE: 'Empleado' } as const;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { state } = useSocket();
  const pending = useJustifications('PENDING');
  const pendingCount = pending.data?.length ?? 0;

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-4 py-4">
          <img src="/icon.svg" alt="" className="h-8 w-8" />
          <span className="font-semibold">Asistencia</span>
        </div>
        <nav aria-label="Administración" className="overflow-x-auto px-2 pb-2 lg:flex-1 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {nav.map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium',
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                    )
                  }
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={n.icon} />
                  </svg>
                  <span className="flex-1">{n.label}</span>
                  {n.badge && pendingCount > 0 && (
                    <span className="rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white" aria-label={`${pendingCount} pendientes`}>
                      {pendingCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden border-t border-slate-200 p-4 lg:block">
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-slate-500">{user ? roleLabel[user.role] : ''}</p>
          <button onClick={logout} className="mt-3 text-sm text-slate-600 hover:text-slate-900 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <ConnectionBadge state={state} />
          <button onClick={logout} className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 lg:hidden">
            Salir
          </button>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
