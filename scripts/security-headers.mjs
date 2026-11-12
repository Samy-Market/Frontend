const raw = process.env.VITE_API_URL;
if (!raw) throw new Error('Falta VITE_API_URL');
const api = new URL(raw);
const ws = `${api.protocol === 'https:' ? 'wss:' : 'ws:'}//${api.host}`;

const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${api.origin} ${ws}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const headers = {
  'Content-Security-Policy': csp,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()',
  'Strict-Transport-Security': 'max-age=31536000',
};

process.stdout.write(
  Object.entries(headers)
    .map(([k, v]) => `add_header ${k} "${v}" always;`)
    .join('\n') + '\n',
);
