import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { cn, ConnectionBadge } from '@/components/ui';
import { useSocket } from '@/realtime/SocketProvider';

const tabs = [
  { to: '/', label: 'Marcar', icon: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', end: true },
  { to: '/historial', label: 'Historial', icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z' },
  { to: '/solicitudes', label: 'Solicitudes', icon: 'M9 12h6m-6 4h6M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { state } = useSocket();
  const firstName = user?.employee?.fullName.split(' ')[0] ?? '';

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 pt-safe backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Hola, {firstName}</p>
            <p className="truncate text-xs text-slate-500">
              {user?.employee?.position} · {user?.employee?.shift ? `Turno ${user.employee.shift.name}` : 'Sin turno asignado'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ConnectionBadge state={state} />
            <button onClick={logout} className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav
        aria-label="Navegación principal"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {tabs.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs font-medium',
                    isActive ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
                  )
                }
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d={t.icon} />
                </svg>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
