import { PASSWORD_MAX, PASSWORD_MIN } from './field-rules';

export function passwordProblems(password: string, confirm: string, { required }: { required: boolean }): string[] {
  if (!password) return required ? ['La contraseña es obligatoria.'] : [];
  const problems: string[] = [];
  if (password.length < PASSWORD_MIN) problems.push(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
  if (password.length > PASSWORD_MAX) problems.push(`La contraseña no puede superar ${PASSWORD_MAX} caracteres.`);
  if (password !== password.trim()) problems.push('La contraseña no puede empezar ni terminar con espacios.');
  if (password !== confirm) problems.push('Las contraseñas no coinciden.');
  return problems;
}

const LETTERS = 'abcdefghjkmnpqrstuvwxyz';
const DIGITS = '23456789';

export function generatePassword(): string {
  const random = new Uint32Array(8);
  crypto.getRandomValues(random);
  const pick = (chars: string, n: number) => chars[n % chars.length];
  const word = Array.from(random.slice(0, 4), (n, i) => (i === 0 ? pick(LETTERS, n).toUpperCase() : pick(LETTERS, n))).join('');
  const number = Array.from(random.slice(4), (n) => pick(DIGITS, n)).join('');
  return `${word}-${number}`;
}
