import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Logo } from '@/components/Brand';
import { ThemeCycleButton, ThemeSegmented } from '@/components/ThemeToggle';
import { useAuth } from '@/auth/auth';
import { ChangePasswordModal } from '@/components/ChangePasswordModal';
import { ConnectionBadge } from '@/components/ui';
import { cn } from '@/lib/styles';
import { useJustifications } from '@/hooks/admin';
import { useSocket } from '@/realtime/socket';

type NavItem = { to: string; label: string; icon: string; end?: boolean; badge?: boolean; adminOnly?: boolean; step?: number };

const sections: { title?: string; items: NavItem[] }[] = [
  { items: [{ to: '/admin', label: 'Dashboard', end: true, icon: 'M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7v-9h-7v9Zm0-18v6h7V3h-7Z' }] },
  {
    title: 'Configuración',
    items: [
      { to: '/admin/sedes', label: 'Sedes', step: 1, icon: 'M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6' },
      { to: '/admin/turnos', label: 'Turnos', step: 2, icon: 'M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z' },
      {
        to: '/admin/horarios',
        label: 'Horarios',
        step: 3,
        icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 10h2m4 0h2',
      },
      {
        to: '/admin/empleados',
        label: 'Empleados',
        step: 4,
        icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
      },
    ],
  },
  {
    title: 'Seguimiento',
    items: [
      {
        to: '/admin/justificaciones',
        label: 'Justificaciones',
        badge: true,
        icon: 'M9 12h6m-6 4h6M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
      },
      {
        to: '/admin/feriados',
        label: 'Feriados y permisos',
        icon: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 9 2 2 4-4',
      },
      { to: '/admin/reportes', label: 'Reportes', icon: 'M4 19V5m0 14h16M8 15v-4m4 4V8m4 7v-6' },
    ],
  },
  {
    title: 'Administración',
    items: [
      {
        to: '/admin/usuarios',
        label: 'Usuarios',
        adminOnly: true,
        icon: 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 10v-1a7 7 0 0 1 14 0v1M19 8v6m3-3h-6',
      },
      {
        to: '/admin/auditoria',
        label: 'Auditoría',
        adminOnly: true,
        icon: 'M12 3 4 6v6c0 4.4 3.4 8.3 8 9 4.6-.7 8-4.6 8-9V6l-8-3Zm-3 9 2 2 4-4',
      },
    ],
  },
];

const roleLabel = { ADMIN: 'Administrador', SUPERVISOR: 'Supervisor', EMPLOYEE: 'Empleado' } as const;

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const { state } = useSocket();
  const pending = useJustifications('PENDING');
  const pendingCount = pending.data?.length ?? 0;
  const location = useLocation();

  return (
    <div className="min-h-screen lg:flex">
      <aside className="glass sticky top-0 z-30 border-b border-black/5 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-5 py-4 lg:px-6 lg:py-6">
          <Logo className="h-6" />
        </div>
        <nav aria-label="Administración" className="overflow-x-auto px-3 pb-2 lg:flex-1 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {sections.map((sec) => {
              const items = sec.items.filter((n) => !n.adminOnly || user?.role === 'ADMIN');
              if (!items.length) return null;
              return (
                <li key={sec.title ?? 'main'} className="contents lg:block">
                  {sec.title && (
                    <p className="hidden px-3 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 lg:block">
                      {sec.title}
                    </p>
                  )}
                  <ul className="contents lg:flex lg:flex-col lg:gap-0.5">
                    {items.map((n) => (
                      <li key={n.to}>
                        <NavLink
                          to={n.to}
                          end={n.end}
                          className={({ isActive }) =>
                            cn(
                              'flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-200',
                              isActive ? 'bg-black/[0.05] text-ink' : 'text-slate-500 hover:bg-black/[0.03] hover:text-ink',
                            )
                          }
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="h-[18px] w-[18px] shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d={n.icon} />
                          </svg>
                          <span className="flex-1">{n.label}</span>
                          {n.step && (
                            <span
                              className="hidden h-5 w-5 items-center justify-center rounded-full bg-black/[0.05] text-[11px] font-semibold text-slate-500 lg:flex"
                              aria-label={`Paso ${n.step}`}
                            >
                              {n.step}
                            </span>
                          )}
                          {n.badge && pendingCount > 0 && (
                            <span
                              className="min-w-5 rounded-full bg-brand-700 px-1.5 text-center text-[11px] font-semibold leading-5 text-on-accent"
                              aria-label={`${pendingCount} pendientes`}
                            >
                              {pendingCount}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="hidden border-t border-black/5 p-5 lg:block">
          <ThemeSegmented className="mb-4" />
          <p className="truncate text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-slate-500">{user ? roleLabel[user.role] : ''}</p>
          <div className="mt-3 flex flex-col items-start gap-1.5">
            <button onClick={() => setChangingPassword(true)} className="text-sm text-brand-700 hover:underline">
              Cambiar contraseña
            </button>
            <button onClick={logout} className="text-sm text-brand-700 hover:underline">
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="glass sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-black/5 px-6 py-3 lg:flex">
          <ConnectionBadge state={state} />
        </header>
        <header className="flex items-center justify-end gap-2 px-4 pt-3 lg:hidden">
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
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
          <div key={location.pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-[32px] font-semibold leading-tight">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
