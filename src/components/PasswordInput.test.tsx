import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { PasswordInput } from './PasswordInput';

function Controlled({ limit }: { limit?: number }) {
  const [v, setV] = useState('');
  return <PasswordInput id="p" aria-label="Contraseña" limit={limit} value={v} onChange={(e) => setV(e.target.value)} />;
}

describe('Campo de contraseña', () => {
  it('el ojo muestra y oculta lo escrito', async () => {
    render(<Controlled />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');
    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('no corta lo escrito: avisa cuántos caracteres sobran', async () => {
    render(<Controlled limit={15} />);
    await userEvent.type(screen.getByLabelText('Contraseña'), 'Clave-1234567890');
    expect(screen.getByLabelText('Contraseña')).toHaveValue('Clave-1234567890');
    expect(screen.getByText('Tiene 1 de más: máximo 15 caracteres.')).toBeInTheDocument();
  });
});
