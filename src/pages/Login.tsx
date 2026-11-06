import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { homeFor, isAdminRole, useAuth } from '@/auth/AuthContext';
import { Button, Field, inputClass } from '@/components/ui';
import { errorMessage } from '@/lib/api';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      const target = from && (isAdminRole(me.role) === from.startsWith('/admin')) ? from : homeFor(me.role);
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/icon.svg" alt="" className="mx-auto h-16 w-16" />
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Control de Asistencia</h1>
          <p className="mt-1 text-sm text-slate-600">Ingresa con tu correo corporativo</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200" noValidate>
          <Field label="Correo electrónico" htmlFor="email">
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="username"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
            />
          </Field>
          <Field label="Contraseña" htmlFor="password">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full py-3" loading={loading} disabled={!email || !password}>
            Ingresar
          </Button>
        </form>
      </div>
    </main>
  );
}
