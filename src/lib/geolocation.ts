export interface DeviceLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getDeviceLocation(): Promise<DeviceLocation> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Este navegador no permite obtener la ubicación. Usa Chrome o Safari actualizados.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => reject(new Error(locationErrorMessage(err.code))),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  });
}

function locationErrorMessage(code: number): string {
  if (code === 1) {
    return 'Bloqueaste el permiso de ubicación. Actívalo en la configuración del navegador para este sitio (ícono del candado junto a la dirección) e inténtalo de nuevo.';
  }
  if (code === 3) return 'Tardó demasiado en obtener tu ubicación. Activa el GPS e inténtalo de nuevo.';
  return 'No se pudo obtener tu ubicación. Activa el GPS o la ubicación del celular e inténtalo de nuevo.';
}
