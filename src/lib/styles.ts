export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export const justificationTone = { PENDING: 'amber', APPROVED: 'green', REJECTED: 'red' } as const;
export const justificationLabel = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as const;

export const presenceView = {
  INSIDE: { label: 'Dentro', tone: 'green' },
  OUTSIDE: { label: 'Fuera', tone: 'slate' },
  NOT_MARKED: { label: 'Sin marcar', tone: 'amber' },
} as const;
