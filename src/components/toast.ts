import { createContext, useContext } from 'react';

export type Tone = 'success' | 'error' | 'info' | 'warning';
export interface Toast {
  id: number;
  tone: Tone;
  title: string;
  description?: string;
}

export interface ToastApi {
  show: (t: Omit<Toast, 'id'>, ms?: number) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
