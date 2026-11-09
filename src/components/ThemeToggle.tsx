import { ThemePref, useTheme } from '@/lib/theme';
import { cn } from '@/lib/styles';

const options: { value: ThemePref; label: string; icon: string }[] = [
  {
    value: 'light',
    label: 'Claro',
    icon: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  },
  { value: 'dark', label: 'Oscuro', icon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z' },
  { value: 'system', label: 'Sistema', icon: 'M4 5h16v11H4zM8 20h8M12 16v4' },
];

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export function ThemeSegmented({ className }: { className?: string }) {
  const { pref, setPref } = useTheme();
  return (
    <div role="radiogroup" aria-label="Apariencia" className={cn('grid grid-cols-3 gap-0.5 rounded-xl bg-black/[0.05] p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={pref === o.value}
          onClick={() => setPref(o.value)}
          title={o.label}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-[10px] py-1.5 text-xs font-medium transition-all duration-300 ease-[var(--ease-apple)]',
            pref === o.value ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-slate-500 hover:text-ink',
          )}
        >
          <Icon d={o.icon} />
          <span className="sr-only sm:not-sr-only">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ThemeCycleButton({ className }: { className?: string }) {
  const { pref, setPref } = useTheme();
  const i = options.findIndex((o) => o.value === pref);
  const next = options[(i + 1) % options.length];
  const current = options[i];
  return (
    <button
      onClick={() => setPref(next.value)}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-black/5 hover:text-ink',
        className,
      )}
      aria-label={`Apariencia: ${current.label}. Cambiar a ${next.label}`}
      title={`Apariencia: ${current.label}`}
    >
      <Icon d={current.icon} />
    </button>
  );
}
