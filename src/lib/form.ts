export const formKey = (prefix: string, value: { id: string } | 'new' | boolean | null) =>
  `${prefix}:${value === 'new' ? 'new' : typeof value === 'boolean' ? (value ? 'open' : 'closed') : (value?.id ?? 'closed')}`;
