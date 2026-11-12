import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PasswordInput } from './PasswordInput';
import { useToast } from './toast';
import { Button, Field, Modal } from './ui';
import { useAuth } from '@/auth/auth';
import { api, errorMessage } from '@/lib/api';
import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/field-rules';
import { passwordProblems } from '@/lib/password';

const empty = { current: '', next: '', confirm: '' };

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState(empty);
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const toast = useToast();
  const { replaceToken } = useAuth();
  const change = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.post<{ ok: true; accessToken: string }>('/auth/password', body),
  });

  const close = () => {
    setForm(empty);
    setErrors([]);
    setRevealed(false);
    onClose();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const problems = [
      ...(form.current ? [] : ['Escribe tu contraseña actual.']),
      ...passwordProblems(form.next, form.confirm, { required: true }),
      ...(form.next && form.next === form.current ? ['La nueva contraseña debe ser distinta de la actual.'] : []),
    ];
    setErrors(problems);
    if (problems.length) return;
    change.mutate(
      { currentPassword: form.current, newPassword: form.next },
      {
        onSuccess: (res) => {
          replaceToken(res.accessToken);
          toast.success('Contraseña actualizada', 'Se cerró tu sesión en los demás dispositivos.');
          close();
        },
        onError: (err) => setErrors([errorMessage(err)]),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Cambiar mi contraseña"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form="change-password-form" loading={change.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="change-password-form" onSubmit={submit} className="space-y-4">
        <Field label="Contraseña actual" htmlFor="cp-current">
          <PasswordInput
            id="cp-current"
            autoComplete="current-password"
            warnCapsLock
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            autoFocus
          />
        </Field>
        <Field label="Nueva contraseña" htmlFor="cp-next" hint={`De ${PASSWORD_MIN} a ${PASSWORD_MAX} caracteres.`}>
          <PasswordInput
            id="cp-next"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
          />
        </Field>
        <Field label="Repite la nueva contraseña" htmlFor="cp-confirm">
          <PasswordInput
            id="cp-confirm"
            autoComplete="new-password"
            limit={PASSWORD_MAX}
            revealed={revealed}
            onRevealedChange={setRevealed}
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          />
        </Field>
        {errors.length > 0 && (
          <ul role="alert" className="space-y-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </form>
    </Modal>
  );
}
