import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Button, ErrorState, FullScreenSpinner } from '@/components/ui';
import { errorMessage } from '@/lib/api';
import type { Role } from '@/lib/types';
import { homeFor, useAuth } from './auth';

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { token, user, loading, error, retry, logout } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (error && !user) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
        <ErrorState message={errorMessage(error)} onRetry={retry} />
        <p className="text-center text-xs text-slate-500">Reintentando automáticamente…</p>
        <Button variant="ghost" onClick={logout}>
          Cerrar sesión
        </Button>
      </main>
    );
  }
  if (loading || !user) return <FullScreenSpinner />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
}
