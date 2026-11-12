import { describe, expect, it } from 'vitest';
import { parseCoordinates } from './geo';

describe('Ubicación pegada desde Google Maps', () => {
  it('entiende "latitud, longitud" con o sin espacios', () => {
    expect(parseCoordinates('-2.170998, -79.922359')).toEqual({ lat: -2.170998, lng: -79.922359 });
    expect(parseCoordinates('  -2.17,-79.92 ')).toEqual({ lat: -2.17, lng: -79.92 });
    expect(parseCoordinates('-2.17 -79.92')).toEqual({ lat: -2.17, lng: -79.92 });
  });

  it('vacío no es error; texto o rangos imposibles sí', () => {
    expect(parseCoordinates('')).toBeNull();
    expect(parseCoordinates('Guayaquil')).toBe('invalid');
    expect(parseCoordinates('95, -79')).toBe('invalid');
    expect(parseCoordinates('-2, -190')).toBe('invalid');
  });
});
