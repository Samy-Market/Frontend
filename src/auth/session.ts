const ACTIVITY_KEY = 'asistencia.lastActivity';

export const activityStore = {
  get(): number | null {
    try {
      const n = Number(localStorage.getItem(ACTIVITY_KEY));
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  },
  touch(at = Date.now()) {
    try {
      localStorage.setItem(ACTIVITY_KEY, String(at));
    } catch {
      /* almacenamiento bloqueado: el control queda solo en esta pestaña */
    }
  },
};

export function tokenExpiry(token: string): number | null {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}
