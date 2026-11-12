import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { renderWithToast } from '@/test/render';
import { ConfirmDelete } from './ConfirmDelete';

describe('Confirmar eliminación', () => {
  it('pide confirmación y avisa al terminar', async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    const { toast } = renderWithToast(<ConfirmDelete what="sede" feminine name="Sede Norte" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar sede Sede Norte' }));
    expect(screen.getByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Eliminar' });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(onDelete).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Sede eliminada', 'Sede Norte');
  });

  it('si está bloqueado explica el motivo y no deja eliminar', async () => {
    const onDelete = vi.fn(() => Promise.resolve());
    renderWithToast(
      <ConfirmDelete what="usuario" name="yo@x.com" blockedReason="No puedes eliminar tu propio usuario." onDelete={onDelete} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar usuario yo@x.com' }));
    expect(screen.getByText('No se puede eliminar')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No puedes eliminar tu propio usuario.');
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entendido' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('muestra el motivo que da el servidor cuando rechaza', async () => {
    const onDelete = vi.fn(() => Promise.reject(new ApiError(400, 'Tiene marcaciones. Desactívalo en su lugar.')));
    renderWithToast(<ConfirmDelete what="empleado" name="Ana" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar empleado Ana' }));
    const buttons = screen.getAllByRole('button', { name: 'Eliminar' });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(await screen.findByRole('alert')).toHaveTextContent('Tiene marcaciones. Desactívalo en su lugar.');
  });
});
