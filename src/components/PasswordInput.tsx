import { InputHTMLAttributes, KeyboardEvent, useState } from 'react';
import { inputClass } from './ui';
import { cn } from '@/lib/styles';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  warnCapsLock?: boolean;
  revealed?: boolean;
  onRevealedChange?: (revealed: boolean) => void;
  /**
   * Largo máximo permitido. No corta lo escrito (un corte silencioso guardaría una clave distinta
   * a la que la persona cree): muestra el contador y avisa si se pasa.
   */
  limit?: number;
}

export function PasswordInput({ warnCapsLock, revealed, onRevealedChange, limit, className, onKeyDown, onKeyUp, ...rest }: Props) {
  const [ownVisible, setOwnVisible] = useState(false);
  const visible = revealed ?? ownVisible;
  const setVisible = (v: boolean) => (onRevealedChange ? onRevealedChange(v) : setOwnVisible(v));
  const [capsLock, setCapsLock] = useState(false);
  const checkCaps = (e: KeyboardEvent<HTMLInputElement>) => {
    if (warnCapsLock) setCapsLock(e.getModifierState?.('CapsLock') ?? false);
  };

  return (
    <>
      <div className="relative">
        <input
          {...rest}
          type={visible ? 'text' : 'password'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={cn(inputClass, 'pr-11', className)}
          onKeyDown={(e) => {
            checkCaps(e);
            onKeyDown?.(e);
          }}
          onKeyUp={(e) => {
            checkCaps(e);
            onKeyUp?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            rest.onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute inset-y-0 right-1 my-auto flex h-8 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-black/5 hover:text-ink"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          aria-controls={rest.id}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
      {limit !== undefined && typeof rest.value === 'string' && rest.value.length > 0 && (
        <p
          className={cn(
            'flex justify-between gap-2 text-[11px] tabular-nums',
            rest.value.length > limit ? 'font-medium text-red-600' : 'text-slate-400',
          )}
          aria-live="polite"
        >
          <span>{rest.value.length > limit ? `Tiene ${rest.value.length - limit} de más: máximo ${limit} caracteres.` : ''}</span>
          <span>
            {rest.value.length}/{limit}
          </span>
        </p>
      )}
      {capsLock && (
        <p className="text-xs font-medium text-amber-700" role="status">
          Bloq Mayús está activado.
        </p>
      )}
    </>
  );
}
