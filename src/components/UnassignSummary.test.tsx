import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { UnassignPreviewItem } from '@/lib/types';
import { UnassignSummary } from './UnassignSummary';

const item = (over: Partial<UnassignPreviewItem> = {}): UnassignPreviewItem => ({
  id: '1',
  employee: { id: 'e', fullName: 'María Vera' },
  schedule: { id: 's', name: 'Rotación A' },
  action: 'delete',
  gap: { from: '2026-11-16', to: null },
  previous: { schedule: { id: 'p', name: 'Rotación B' }, until: '2027-01-21', canRestore: true },
  ...over,
});
const ok = (data: UnassignPreviewItem[]) => ({ isPending: false, isError: false, error: null, data });

describe('Resumen al quitar un horario', () => {
  it('con "volver al anterior" muestra hasta cuándo y qué queda después', () => {
    render(<UnassignSummary query={ok([item()])} restore onRestoreChange={() => {}} />);
    expect(screen.getByText(/Vuelve a/)).toHaveTextContent('Vuelve a Rotación B del 16/11/2026 al 21/01/2027.');
    expect(screen.getByText(/Después del 21\/01\/2027 queda sin horario/)).toBeInTheDocument();
  });

  it('sin restaurar avisa del hueco y el check permite cambiarlo', async () => {
    const onChange = vi.fn();
    render(<UnassignSummary query={ok([item()])} restore={false} onRestoreChange={onChange} />);
    expect(screen.getByText(/Quedará sin horario desde el 16\/11\/2026 \(sin fecha de fin\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /Volver a su horario anterior/ }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('si no hay horario anterior, o está desactivado, no ofrece restaurar', () => {
    render(
      <UnassignSummary
        query={ok([
          item({ id: '1', previous: null }),
          item({
            id: '2',
            employee: { id: 'x', fullName: 'Luis' },
            previous: { schedule: { id: 'p', name: 'Vieja' }, until: null, canRestore: false },
          }),
        ])}
        restore
        onRestoreChange={() => {}}
      />,
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/Su horario anterior \(Vieja\) está desactivado/)).toBeInTheDocument();
  });
});
