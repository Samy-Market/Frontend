import { EMAIL_MAX, emailProblem, PASSWORD_MAX, PASSWORD_MIN } from '@/lib/field-rules';
import { PasswordInput } from '@/components/PasswordInput';
import { passwordProblems } from '@/lib/password';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
import { Logo } from '@/components/Brand';
import { ThemeCycleButton } from '@/components/ThemeToggle';
import { Button, Field, inputClass } from '@/components/ui';
import { ApiError, errorMessage } from '@/lib/api';

export default function InitialSetup({ requiresCode, onAlreadyConfigured }: { requiresCode: boolean; onAlreadyConfigured: () => void }) {
  const { setupAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const local: string[] = [];
    const emailIssue = emailProblem(email);
    if (emailIssue) local.push(emailIssue);
    local.push(...passwordProblems(password, confirm, { required: true }));
    if (requiresCode && !code.trim()) local.push('Ingresa el código de instalación.');
    if (local.length) return setErrors(local);

    setErrors([]);
    setLoading(true);
    try {
      await setupAdmin({
        email: email.trim(),
        password,
        siteName: siteName.trim() || undefined,
        code: requiresCode ? code.trim() : undefined,
      });
      toast.success('¡Sistema configurado!', 'Ya eres administrador. Empieza creando los turnos y los empleados.');
      void navigate('/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && err.message.includes('ya tiene un administrador')) {
        toast.info('El sistema ya está configurado', 'Inicia sesión con tu usuario.');
        onAlreadyConfigured();
        return;
      }
      setErrors(err instanceof ApiError && err.details ? err.details : [errorMessage(err)]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-white px-5 py-10 dark:bg-slate-50">
      <ThemeCycleButton className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo className="mx-auto h-12 animate-scale-in" />
          <h1 className="mt-8 animate-fade-up text-[28px] font-semibold [animation-delay:120ms]">Configuración inicial</h1>
          <p className="mt-1 text-sm text-slate-600">Aún no hay ningún administrador. Crea el tuyo para empezar a usar el sistema.</p>
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="animate-fade-up space-y-4 rounded-[26px] bg-slate-50 p-6 dark:bg-white [animation-delay:200ms]"
        >
          <Field label="Correo del administrador" htmlFor="s-email" error={emailTouched ? (emailProblem(email) ?? undefined) : undefined}>
            <input
              id="s-email"
              type="email"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={EMAIL_MAX}
              onBlur={() => setEmailTouched(true)}
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuempresa.com"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contraseña" htmlFor="s-pass" hint={`De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.`}>
              <PasswordInput
                id="s-pass"
                autoComplete="new-password"
                limit={PASSWORD_MAX}
                required
                warnCapsLock
                revealed={revealed}
                onRevealedChange={setRevealed}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Field label="Repite la contraseña" htmlFor="s-pass2">
              <PasswordInput
                id="s-pass2"
                autoComplete="new-password"
                limit={PASSWORD_MAX}
                required
                revealed={revealed}
                onRevealedChange={setRevealed}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Nombre de la sede (opcional)" htmlFor="s-site" hint="Si lo dejas vacío se llamará “Sede principal”.">
            <input
              id="s-site"
              className={inputClass}
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Matriz Guayaquil"
              maxLength={120}
            />
          </Field>
          {requiresCode && (
            <Field label="Código de instalación" htmlFor="s-code" hint="Es el valor de la variable SETUP_CODE del servidor.">
              <input
                id="s-code"
                type="password"
                autoComplete="off"
                required
                className={inputClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
          )}

          {errors.length > 0 && (
            <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {errors.map((er) => (
                <li key={er}>{er}</li>
              ))}
            </ul>
          )}

          <Button type="submit" className="w-full py-3" loading={loading} disabled={!email || !password || !confirm}>
            Crear administrador
          </Button>
          <p className="text-center text-xs text-slate-500">
            Este formulario solo aparece una vez: cuando ya existe un administrador, se desactiva.
          </p>
        </form>
      </div>
    </main>
  );
}
