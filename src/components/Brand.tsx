import { cn } from '@/lib/styles';

/** Logo SAMY completo a color (azul + cian). En modo oscuro se usa la versión blanca para que se lea sobre negro. */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/brand/samy-logo.svg" alt="SAMY" className={cn('h-8 w-auto select-none dark:hidden', className)} draggable={false} />
      <LogoMono className={cn('hidden h-8 text-ink dark:inline-block', className)} />
    </>
  );
}

/**
 * Logo SAMY de un solo color: toma el color del texto (currentColor),
 * así sirve en negro sobre claro o en blanco sobre fondos oscuros.
 */
function LogoMono({ className, mark }: { className?: string; mark?: boolean }) {
  const url = mark ? '/brand/samy-mark-mono.svg' : '/brand/samy-logo-mono.svg';
  return (
    <span
      role="img"
      aria-label="SAMY"
      className={cn(
        // Solo se fuerza "inline-block" si quien lo usa no controla la visibilidad (p. ej. "hidden dark:inline-block"),
        // porque dos clases de display a la vez compiten y gana la que Tailwind genere después.
        !/(^|\s)hidden(\s|$)/.test(className ?? '') && 'inline-block',
        'bg-current',
        mark ? 'aspect-[902/1628] h-8' : 'aspect-[4436/1628] h-8',
        className,
      )}
      style={{ WebkitMask: `url(${url}) center / contain no-repeat`, mask: `url(${url}) center / contain no-repeat` }}
    />
  );
}

/** Solo la "S" a color. */
export function Mark({ className }: { className?: string }) {
  return <img src="/brand/samy-mark.svg" alt="SAMY" className={cn('h-8 w-auto select-none', className)} draggable={false} />;
}
