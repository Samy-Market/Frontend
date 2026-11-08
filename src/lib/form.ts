/**
 * Clave para volver a montar un formulario modal cada vez que se abre (nuevo, otro registro o cerrado),
 * así su estado inicial sale de las props sin efectos que lo reinicien.
 * El prefijo evita claves repetidas cuando hay varios formularios en la misma pantalla.
 */
export const formKey = (prefix: string, value: { id: string } | 'new' | boolean | null) =>
  `${prefix}:${value === 'new' ? 'new' : typeof value === 'boolean' ? (value ? 'open' : 'closed') : (value?.id ?? 'closed')}`;
