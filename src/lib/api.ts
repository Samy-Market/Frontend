export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:3000';

const TOKEN_KEY = 'asistencia.token';

export const tokenStore = {
  key: TOKEN_KEY,
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export const setUnauthorizedHandler = (fn: UnauthorizedHandler | null) => {
  onUnauthorized = fn;
};

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const token = tokenStore.get();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Revisa tu conexión a internet.');
  }

  if (!res.ok) {
    let message = 'Ocurrió un error inesperado.';
    let details: string[] | undefined;
    try {
      const body = (await res.json()) as { message?: string; details?: string[] };
      message = body.message ?? message;
      details = body.details;
    } catch {
      /* respuesta sin JSON */
    }
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized?.();
    throw new ApiError(res.status, message, details);
  }
  return res;
}

export const api = {
  async get<T>(path: string): Promise<T> {
    return (await request(path)).json() as Promise<T>;
  },
  async post<T>(path: string, body?: unknown): Promise<T> {
    return (await request(path, { method: 'POST', body: JSON.stringify(body ?? {}) })).json() as Promise<T>;
  },
  async patch<T>(path: string, body: unknown): Promise<T> {
    return (await request(path, { method: 'PATCH', body: JSON.stringify(body) })).json() as Promise<T>;
  },
  async delete<T>(path: string): Promise<T> {
    return (await request(path, { method: 'DELETE' })).json() as Promise<T>;
  },
  async download(path: string, fallbackName: string): Promise<void> {
    const res = await request(path);
    const disposition = res.headers.get('content-disposition') ?? '';
    const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
    const name = match ? decodeURIComponent(match[1]) : fallbackName;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.details?.length ? `${err.message} ${err.details.join(' ')}` : err.message;
  if (err instanceof Error) return err.message;
  return 'Ocurrió un error inesperado.';
}
