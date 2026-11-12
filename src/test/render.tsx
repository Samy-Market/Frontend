import { render } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';
import { ToastApi, ToastContext } from '@/components/toast';

export function renderWithToast(ui: ReactElement) {
  const toast: ToastApi = { show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  return { toast, ...render(<ToastContext.Provider value={toast}>{ui}</ToastContext.Provider>) };
}
