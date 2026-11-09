import { cn } from '@/lib/styles';

export function Logo({ className }: { className?: string }) {
  return (
    <>
      <img src="/brand/samy-logo.svg" alt="SAMY" className={cn('h-8 w-auto select-none dark:hidden', className)} draggable={false} />
      <LogoMono className={cn('hidden h-8 text-ink dark:inline-block', className)} />
    </>
  );
}

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

export function Mark({ className }: { className?: string }) {
  return <img src="/brand/samy-mark.svg" alt="SAMY" className={cn('h-8 w-auto select-none', className)} draggable={false} />;
}
