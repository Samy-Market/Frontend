import { useEffect, useRef, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { useToast } from '@/components/toast';
import { useAuth } from './auth';
import { activityStore, tokenExpiry } from './session';

const WARNING_SECONDS = 60;
const TOUCH_EVERY_MS = 5_000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

export function SessionWatcher() {
  const { token, user, logout } = useAuth();
  const toast = useToast();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const lastTouch = useRef(0);

  const idleMinutes = user?.session?.idleMinutes ?? 0;
  const idleMs = idleMinutes * 60_000;
  const expiresAt = token ? tokenExpiry(token) : null;

  useEffect(() => {
    if (!token) return;
    if (!activityStore.get()) activityStore.touch();
    const onActivity = () => {
      const now = Date.now();
      if (now - lastTouch.current < TOUCH_EVERY_MS) return;
      lastTouch.current = now;
      activityStore.touch(now);
    };
    for (const e of ACTIVITY_EVENTS) window.addEventListener(e, onActivity, { passive: true, capture: true });
    return () => {
      for (const e of ACTIVITY_EVENTS) window.removeEventListener(e, onActivity, { capture: true });
    };
  }, [token]);

  useEffect(() => {
    if (!token || (!idleMs && !expiresAt)) return;
    const check = () => {
      const now = Date.now();
      if (expiresAt && now >= expiresAt) {
        setSecondsLeft(null);
        logout();
        toast.warning('Tu sesión terminó', 'Se cumplió el tiempo máximo de la sesión. Inicia sesión nuevamente.');
        return;
      }
      if (!idleMs) return;
      const last = activityStore.get() ?? now;
      const left = Math.ceil((last + idleMs - now) / 1000);
      if (left <= 0) {
        setSecondsLeft(null);
        logout();
        toast.warning('Sesión cerrada por inactividad', `Pasaron ${idleMinutes} min sin actividad. Inicia sesión nuevamente.`);
        return;
      }
      setSecondsLeft(left <= WARNING_SECONDS ? left : null);
    };
    check();
    const id = window.setInterval(check, 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [token, idleMs, idleMinutes, expiresAt, logout, toast]);

  const stay = () => {
    lastTouch.current = Date.now();
    activityStore.touch();
    setSecondsLeft(null);
  };

  return (
    <Modal
      open={!!token && secondsLeft !== null}
      onClose={stay}
      title="¿Sigues ahí?"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setSecondsLeft(null);
              logout();
            }}
          >
            Cerrar sesión
          </Button>
          <Button onClick={stay}>Seguir conectado</Button>
        </>
      }
    >
      <p className="text-[15px] text-slate-700">
        Por seguridad, tu sesión se cerrará en{' '}
        <strong className="tabular-nums">
          {secondsLeft ?? 0} {secondsLeft === 1 ? 'segundo' : 'segundos'}
        </strong>{' '}
        por inactividad.
      </p>
    </Modal>
  );
}
