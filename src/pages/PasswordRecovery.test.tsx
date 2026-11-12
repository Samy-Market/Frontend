import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '@/lib/api';
import { ForgotPassword, ResetPassword } from './PasswordRecovery';

const renderAt = (ui: ReactElement, path = '/') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );

describe('¿Olvidaste tu contraseña?', () => {
  it('valida el correo y luego muestra el aviso sin revelar si existe', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ ok: true });
    renderAt(<ForgotPassword />);
    await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@empresa');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(screen.getByRole('alert')).toHaveTextContent('correo válido');
    expect(post).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Correo electrónico'), '.com');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(post).toHaveBeenCalledWith('/auth/password/forgot', { email: 'ana@empresa.com' });
    expect(await screen.findByText('Revisa tu correo')).toBeInTheDocument();
    expect(screen.getByText(/Si/)).toHaveTextContent('Si ana@empresa.com está registrado');
  });
});

describe('Restablecer contraseña', () => {
  it('un enlace vencido ofrece pedir otro', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ valid: false });
    renderAt(<ResetPassword />, '/restablecer?token=abc');
    expect(await screen.findByText('Enlace no válido')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pedir un enlace nuevo' })).toHaveAttribute('href', '/recuperar');
  });

  it('sin token no consulta al servidor', () => {
    const post = vi.spyOn(api, 'post');
    renderAt(<ResetPassword />, '/restablecer');
    expect(screen.getByText('Enlace no válido')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it('con un enlace válido guarda la nueva contraseña', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockImplementation((path: string) =>
        Promise.resolve(path.endsWith('/check') ? { valid: true, email: 'an•••@empresa.com' } : { ok: true }),
      );
    renderAt(<ResetPassword />, '/restablecer?token=abc');
    expect(await screen.findByText('Para an•••@empresa.com')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'Nueva-123');
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'Nueva-124');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Las contraseñas no coinciden.');

    await userEvent.clear(screen.getByLabelText('Repite la contraseña'));
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'Nueva-123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(post).toHaveBeenCalledWith('/auth/password/reset', { token: 'abc', newPassword: 'Nueva-123' });
    expect(await screen.findByText('Contraseña actualizada')).toBeInTheDocument();
  });

  it('si el servidor rechaza el enlace al guardar, lo explica', async () => {
    vi.spyOn(api, 'post').mockImplementation((path: string) =>
      path.endsWith('/check')
        ? Promise.resolve({ valid: true, email: 'x' })
        : Promise.reject(new ApiError(400, 'El enlace no es válido o ya venció.')),
    );
    renderAt(<ResetPassword />, '/restablecer?token=abc');
    await screen.findByText('Para x');
    await userEvent.type(screen.getByLabelText('Nueva contraseña'), 'Nueva-123');
    await userEvent.type(screen.getByLabelText('Repite la contraseña'), 'Nueva-123');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El enlace no es válido o ya venció.');
  });
});
