/**
 * Reglas de cédula, correo y contraseña. Son las mismas que valida el servidor
 * (backend/src/shared/domain/field-rules.ts): si cambias una, cambia la otra.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 15;
export const EMAIL_MAX = 100;
export const CEDULA_LENGTH = 10;

const isProvince = (code: number) => (code >= 1 && code <= 24) || code === 30;

export function cedulaProblem(value: string): string | null {
  if (!value) return 'La cédula es obligatoria.';
  if (!/^\d+$/.test(value)) return 'La cédula solo puede tener números.';
  if (value.length !== CEDULA_LENGTH) return 'La cédula debe tener exactamente 10 dígitos.';
  if (!isProvince(Number(value.slice(0, 2))))
    return 'La cédula no es válida: los dos primeros dígitos deben ser una provincia (01 a 24, o 30).';
  if (Number(value[2]) >= 6) return 'La cédula no es válida: el tercer dígito debe ser menor a 6.';
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = Number(value[i]) * (i % 2 === 0 ? 2 : 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  if ((10 - (sum % 10)) % 10 !== Number(value[9])) return 'La cédula no es válida: revisa los dígitos (no coincide el dígito verificador).';
  return null;
}

export function emailProblem(value: string): string | null {
  const v = value.trim();
  if (!v) return 'El correo es obligatorio.';
  if (v.length > EMAIL_MAX) return `El correo no puede superar ${EMAIL_MAX} caracteres.`;
  if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v) || /\.\./.test(v)) return 'Ingresa un correo válido, por ejemplo nombre@empresa.com.';
  return null;
}

export const onlyCedulaDigits = (value: string) => value.replace(/\D/g, '').slice(0, CEDULA_LENGTH);
