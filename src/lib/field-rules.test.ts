import { describe, expect, it } from 'vitest';
import { cedulaProblem, emailProblem, onlyCedulaDigits } from './field-rules';

describe('Cédula ecuatoriana', () => {
  it('acepta cédulas válidas', () => {
    for (const c of ['0912345675', '1710034065', '0926687856']) expect(cedulaProblem(c)).toBeNull();
  });

  it('explica por qué una cédula no sirve', () => {
    expect(cedulaProblem('')).toMatch('obligatoria');
    expect(cedulaProblem('09123x5675')).toMatch('solo puede tener números');
    expect(cedulaProblem('091234567')).toMatch('exactamente 10');
    expect(cedulaProblem('2512345678')).toMatch('provincia');
    expect(cedulaProblem('0972345675')).toMatch('tercer dígito');
    expect(cedulaProblem('0912345676')).toMatch('dígito verificador');
  });

  it('al pegar deja solo los números y corta en 10', () => {
    expect(onlyCedulaDigits('0926-687-856')).toBe('0926687856');
    expect(onlyCedulaDigits('09266878561234')).toBe('0926687856');
  });
});

describe('Correo', () => {
  it('valida el formato y el largo', () => {
    expect(emailProblem(' ana@empresa.com ')).toBeNull();
    expect(emailProblem('')).toMatch('obligatorio');
    expect(emailProblem('ana@empresa')).toMatch('correo válido');
    expect(emailProblem('ana..torres@empresa.com')).toMatch('correo válido');
    expect(emailProblem(`${'a'.repeat(95)}@x.com`)).toMatch('100');
  });
});
