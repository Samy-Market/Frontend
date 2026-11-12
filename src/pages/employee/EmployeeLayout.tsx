import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mark } from '@/components/Brand';
import { ThemeCycleButton } from '@/components/ThemeToggle';
import { useAuth } from '@/auth/auth';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { ConnectionBadge } from '@/components/ui';
import { cn } from '@/lib/styles';
import { useSocket } from '@/realtime/socket';

const tabs = [
  { to: '/', label: 'Marcar', icon: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', end: true },
  {
    to: '/historial',
    label: 'Historial',
    icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  },
  { to: '/solicitudes', label: 'Solicitudes', icon: 'M9 12h6m-6 4h6M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z' },
];

export default function EmployeeLayout() {
  const { user, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const { state } = useSocket();
  const firstName = user?.employee?.fullName.split(' ')[0] ?? '';
  const location = useLocation();

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col">
      <header className="glass sticky top-0 z-20 border-b border-black/5 px-4 py-3 pt-safe">
        <div className="flex items-center justify-between gap-3">
          <Mark className="h-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">Hola, {firstName}</p>
            <p className="truncate text-xs text-slate-500">
              {user?.employee?.position} · {user?.employee?.site.name}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ConnectionBadge state={state} />
            <ThemeCycleButton />
            <button
              onClick={() => setChangingPassword(true)}
              className="rounded-full p-2 text-slate-600 hover:bg-black/5"
              aria-label="Cambiar contraseña"
              title="Cambiar contraseña"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
                aria-hidden
              >
                <circle cx="8" cy="15" r="4" />
                <path d="m10.85 12.15 8.65-8.65M18 5l2 2M15 8l2 2" />
              </svg>
            </button>
            <button onClick={logout} className="rounded-full px-3 py-1 text-sm text-brand-700 hover:bg-black/5">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-5">
        <div key={location.pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>

      <nav aria-label="Navegación principal" className="glass fixed inset-x-0 bottom-0 z-20 border-t border-black/5 pb-safe">
        <ul className="mx-auto grid max-w-lg grid-cols-3">
          {tabs.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs font-medium',
                    isActive ? 'text-brand-700' : 'text-slate-400 hover:text-ink',
                  )
                }
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={t.icon} />
                </svg>
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </div>
  );
}
