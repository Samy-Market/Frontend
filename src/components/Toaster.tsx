import { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { Toast, ToastContext, Tone, type ToastApi } from './toast';

const toneStyles: Record<Tone, string> = {
  success: 'bg-emerald-500 text-on-accent',
  error: 'bg-red-500 text-on-accent',
  info: 'bg-brand-700 text-on-accent',
  warning: 'bg-amber-500 text-on-accent',
};
const toneIcon: Record<Tone, string> = { success: '✓', error: '!', info: 'i', warning: '!' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (t: Omit<Toast, 'id'>, ms = 5000) => {
      const id = nextId.current++;
      setToasts((ts) => [...ts.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) => show({ tone: 'success', title, description }),
      error: (title, description) => show({ tone: 'error', title, description }, 7000),
      info: (title, description) => show({ tone: 'info', title, description }),
      warning: (title, description) => show({ tone: 'warning', title, description }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-3 pt-safe sm:items-end sm:p-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="glass pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-2xl px-4 py-3 text-ink shadow-[0_12px_40px_rgba(0,0,0,0.16)] ring-1 ring-black/5"
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${toneStyles[t.tone]}`}
            >
              {toneIcon[t.tone]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[13px] text-slate-600">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="-m-1 rounded-full p-1 text-sm text-slate-400 hover:text-ink focus-visible:outline-2"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
