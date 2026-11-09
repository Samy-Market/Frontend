import { useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { homeFor, isAdminRole, useAuth } from '@/auth/auth';
import { Logo } from '@/components/Brand';
import { ThemeCycleButton } from '@/components/ThemeToggle';
import { Button, Field, FullScreenSpinner, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import type { SetupStatus } from '@/lib/types';
import InitialSetup from './InitialSetup';
import { PasswordInput } from '@/components/PasswordInput';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setupQ = useQuery({
    queryKey: ['auth', 'setup'],
    queryFn: () => api.get<SetupStatus>('/auth/setup'),
    enabled: !user,
    staleTime: 0,
  });

  if (user) return <Navigate to={homeFor(user.role)} replace />;
  if (setupQ.isPending) return <FullScreenSpinner />;
  if (setupQ.data?.needsSetup) {
    return <InitialSetup requiresCode={setupQ.data.requiresCode} onAlreadyConfigured={() => setupQ.refetch()} />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      const target = from && isAdminRole(me.role) === from.startsWith('/admin') ? from : homeFor(me.role);
      void navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-5 py-10 dark:bg-slate-50">
      <ThemeCycleButton className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-14 animate-scale-in" />
          <h1 className="mt-8 animate-fade-up text-[28px] font-semibold [animation-delay:120ms]">Control de asistencia</h1>
          <p className="mt-1 animate-fade-up text-[15px] text-slate-500 [animation-delay:180ms]">Ingresa con tu correo corporativo</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="animate-fade-up space-y-4 rounded-[26px] bg-slate-50 p-6 dark:bg-white [animation-delay:240ms]"
          noValidate
        >
          <Field label="Correo electrónico" htmlFor="email">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
            />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <PasswordInput
              id="password"
              autoComplete="current-password"
              required
              warnCapsLock
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full py-3 text-[15px]" loading={loading} disabled={!email || !password}>
            Ingresar
          </Button>
        </form>
      </div>
    </main>
  );
}
