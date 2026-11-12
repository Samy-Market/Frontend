import { useMutation, useQuery } from '@tanstack/react-query';
import { FormEvent, ReactNode, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Logo } from '@/components/Brand';
import { PasswordInput } from '@/components/PasswordInput';
import { ThemeCycleButton } from '@/components/ThemeToggle';
import { Button, Field, inputClass, Spinner } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { emailProblem, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/field-rules';
import { passwordProblems } from '@/lib/password';

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-5 py-10 dark:bg-slate-50">
      <ThemeCycleButton className="absolute right-4 top-4" />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo className="mx-auto h-14 animate-scale-in" />
          <h1 className="mt-8 animate-fade-up text-[28px] font-semibold [animation-delay:120ms]">{title}</h1>
          <p className="mt-1 animate-fade-up text-[15px] text-slate-500 [animation-delay:180ms]">{subtitle}</p>
        </div>
        <div className="animate-fade-up space-y-4 rounded-[26px] bg-slate-50 p-6 dark:bg-white [animation-delay:240ms]">{children}</div>
        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const send = useMutation({ mutationFn: (e: string) => api.post<{ ok: true }>('/auth/password/forgot', { email: e }) });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problem = emailProblem(email);
    if (problem) return setError(problem);
    setError(null);
    send.mutate(email.trim(), { onError: (err) => setError(errorMessage(err)) });
  };

  if (send.isSuccess) {
    return (
      <Shell title="Revisa tu correo" subtitle="Te enviamos las instrucciones">
        <p className="text-sm text-slate-600">
          Si <strong className="text-ink">{email.trim()}</strong> está registrado, te llegará un correo con un enlace para crear una nueva
          contraseña. Vence en 30 minutos y se puede usar una sola vez.
        </p>
        <p className="text-xs text-slate-500">¿No llega? Revisa la carpeta de spam o pide otro en unos minutos.</p>
        <Button variant="secondary" className="w-full" onClick={() => send.reset()}>
          Enviar de nuevo
        </Button>
      </Shell>
    );
  }

  return (
    <Shell title="¿Olvidaste tu contraseña?" subtitle="Te enviaremos un enlace para crear una nueva">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Correo electrónico" htmlFor="fp-email">
          <input
            id="fp-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className={inputClass}
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
        </Field>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full py-3 text-[15px]" loading={send.isPending} disabled={!email.trim()}>
          Enviar enlace
        </Button>
      </form>
    </Shell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const check = useQuery({
    queryKey: ['password-reset', token],
    queryFn: () => api.post<{ valid: boolean; email?: string }>('/auth/password/reset/check', { token }),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });
  const reset = useMutation({
    mutationFn: (newPassword: string) => api.post<{ ok: true }>('/auth/password/reset', { token, newPassword }),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problems = passwordProblems(password, confirm, { required: true });
    setErrors(problems);
    if (problems.length) return;
    reset.mutate(password, { onError: (err) => setErrors([errorMessage(err)]) });
  };

  if (token && check.isPending) {
    return (
      <Shell title="Nueva contraseña" subtitle="Revisando el enlace…">
        <div className="flex justify-center py-6 text-brand-700">
          <Spinner />
        </div>
      </Shell>
    );
  }

  if (!token || check.isError || !check.data?.valid) {
    return (
      <Shell title="Enlace no válido" subtitle="Ya se usó, venció o está incompleto">
        <p className="text-sm text-slate-600">
          Los enlaces para restablecer la contraseña valen 30 minutos y se pueden usar una sola vez. Pide uno nuevo.
        </p>
        <Link
          to="/recuperar"
          className="block rounded-full bg-brand-700 px-5 py-3 text-center text-[15px] font-medium text-on-accent hover:opacity-90"
        >
          Pedir un enlace nuevo
        </Link>
      </Shell>
    );
  }

  if (reset.isSuccess) {
    return (
      <Shell title="Contraseña actualizada" subtitle="Ya puedes ingresar con la nueva">
        <p className="text-sm text-slate-600">Por seguridad, se cerraron las sesiones que estaban abiertas en otros dispositivos.</p>
        <Link
          to="/login"
          className="block rounded-full bg-brand-700 px-5 py-3 text-center text-[15px] font-medium text-on-accent hover:opacity-90"
        >
          Iniciar sesión
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title="Nueva contraseña" subtitle={`Para ${check.data.email ?? 'tu cuenta'}`}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nueva contraseña" htmlFor="rp-new" hint={`De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.`}>
          <PasswordInput
            id="rp-new"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Repite la contraseña" htmlFor="rp-confirm">
          <PasswordInput
            id="rp-confirm"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        {errors.length > 0 && (
          <ul role="alert" className="space-y-1 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
        <Button type="submit" className="w-full py-3 text-[15px]" loading={reset.isPending}>
          Guardar contraseña
        </Button>
      </form>
    </Shell>
  );
}
