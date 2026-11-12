export const DEFAULT_RADIUS = 150;

export function parseCoordinates(text: string): { lat: number; lng: number } | 'invalid' | null {
  const t = text.trim();
  if (!t) return null;
  const m = /^(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:\.\d+)?)$/.exec(t);
  if (!m) return 'invalid';
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : 'invalid';
}
