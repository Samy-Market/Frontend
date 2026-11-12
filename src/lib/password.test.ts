import { describe, expect, it } from 'vitest';
import { generatePassword, passwordProblems } from './password';

describe('Contraseña nueva', () => {
  it('exige de 8 a 15 caracteres, sin espacios en los extremos y que coincida', () => {
    expect(passwordProblems('Clave-123', 'Clave-123', { required: true })).toEqual([]);
    expect(passwordProblems('', '', { required: false })).toEqual([]);
    expect(passwordProblems('', '', { required: true })).toEqual(['La contraseña es obligatoria.']);
    expect(passwordProblems('corta', 'corta', { required: true })[0]).toMatch('al menos 8');
    expect(passwordProblems('Clave-1234567890', 'Clave-1234567890', { required: true })[0]).toMatch('15');
    expect(passwordProblems(' Clave-123', ' Clave-123', { required: true })[0]).toMatch('espacios');
    expect(passwordProblems('Clave-123', 'Clave-124', { required: true })).toEqual(['Las contraseñas no coinciden.']);
  });

  it('genera contraseñas fáciles de dictar que cumplen las reglas', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword();
      expect(p).toMatch(/^[A-Z][a-z]{3}-[2-9]{4}$/);
      expect(passwordProblems(p, p, { required: true })).toEqual([]);
    }
  });
});
