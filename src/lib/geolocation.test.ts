import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDeviceLocation } from './geolocation';

const mockGeo = (impl: Geolocation['getCurrentPosition']) =>
  vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition: impl } });

afterEach(() => vi.unstubAllGlobals());

describe('Ubicación del celular', () => {
  it('devuelve latitud, longitud y precisión', async () => {
    mockGeo((ok) => ok({ coords: { latitude: -2.17, longitude: -79.92, accuracy: 12 } } as GeolocationPosition));
    await expect(getDeviceLocation()).resolves.toEqual({ latitude: -2.17, longitude: -79.92, accuracy: 12 });
  });

  it('explica cómo resolver cada error', async () => {
    mockGeo((_ok, fail) => fail?.({ code: 1 } as GeolocationPositionError));
    await expect(getDeviceLocation()).rejects.toThrow('Bloqueaste el permiso de ubicación');
    mockGeo((_ok, fail) => fail?.({ code: 3 } as GeolocationPositionError));
    await expect(getDeviceLocation()).rejects.toThrow('Tardó demasiado');
    mockGeo((_ok, fail) => fail?.({ code: 2 } as GeolocationPositionError));
    await expect(getDeviceLocation()).rejects.toThrow('Activa el GPS');
  });

  it('avisa si el navegador no tiene ubicación', async () => {
    vi.stubGlobal('navigator', {});
    await expect(getDeviceLocation()).rejects.toThrow('no permite obtener la ubicación');
  });
});
