import { ButtonHTMLAttributes, forwardRef, ReactNode, useEffect, useRef } from 'react';
import { cn } from '@/lib/styles';
import type { ConnectionState } from '@/realtime/socket';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
const variants: Record<Variant, string> = {
  primary: 'bg-brand-700 text-on-accent shadow-sm shadow-brand-700/20 hover:bg-brand-800 focus-visible:outline-brand-700',
  success: 'bg-ink text-on-ink hover:bg-slate-700 focus-visible:outline-slate-700',
  danger: 'bg-red-600 text-on-accent hover:bg-red-700 focus-visible:outline-red-600',
  secondary: 'bg-white text-ink ring-1 ring-black/10 hover:bg-slate-50 focus-visible:outline-brand-700',
  ghost: 'text-slate-700 hover:bg-black/5 focus-visible:outline-brand-700',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-[var(--ease-apple)] focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        size === 'sm' ? 'px-3.5 py-1.5 text-[13px]' : 'px-5 py-2.5 text-sm',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
});

export function Spinner({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="4" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-brand-700" role="status">
      <Spinner className="h-8 w-8" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(surfaceClass, 'p-5', className)}>{children}</div>;
}

export const surfaceClass =
  'rounded-[22px] bg-white ring-1 ring-black/[0.04] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_28px_rgba(0,0,0,0.04)]';

type BadgeTone = 'green' | 'red' | 'amber' | 'slate' | 'sky' | 'brand';
const badgeTones: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-black/5',
  sky: 'bg-sky-50 text-sky-700 ring-sky-700/10',
  brand: 'bg-brand-50 text-brand-800 ring-brand-700/10',
};

export function Badge({ tone = 'slate', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const map = {
    online: { tone: 'green' as const, label: 'En vivo', dot: 'bg-emerald-500' },
    connecting: { tone: 'amber' as const, label: 'Conectando…', dot: 'bg-amber-500 animate-pulse' },
    offline: { tone: 'red' as const, label: 'Sin conexión en vivo', dot: 'bg-red-500' },
  }[state];
  return (
    <Badge tone={map.tone}>
      <span className={cn('h-1.5 w-1.5 rounded-full', map.dot)} aria-hidden />
      {map.label}
    </Badge>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="animate-fade-up rounded-[22px] border border-dashed border-slate-300 px-6 py-12 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="animate-fade-up rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
      <p>{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="modal-title"
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-[26px] bg-white p-0 shadow-[0_24px_70px_rgba(0,0,0,0.22)] ring-1 ring-black/5',
        size === 'lg' ? 'max-w-2xl' : 'max-w-md',
      )}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-center justify-between px-6 pb-2 pt-5">
            <h2 id="modal-title" className="text-xl font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-ink"
              aria-label="Cerrar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 px-6 pb-5 pt-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-slate-600">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const inputClass =
  'block w-full rounded-xl border-0 bg-white px-3.5 py-2.5 text-[15px] text-ink ring-1 ring-inset ring-black/10 transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-700/60 disabled:bg-slate-50 disabled:text-slate-400 dark:bg-slate-100';

export const tableClass = 'min-w-full divide-y divide-black/5 text-sm';
export const thClass = 'px-5 py-3 text-left text-xs font-medium text-slate-500';
export const tdClass = 'px-5 py-3.5 align-middle';

export function TableCard({ children }: { children: ReactNode }) {
  return <div className={cn(surfaceClass, 'animate-fade-up overflow-x-auto')}>{children}</div>;
}
