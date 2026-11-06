import { useQueryClient } from '@tanstack/react-query';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { isAdminRole, useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toaster';
import { API_URL } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import { formatTime } from '@/lib/time';
import type { AttendanceMarkedEvent, Justification } from '@/lib/types';

export type ConnectionState = 'connecting' | 'online' | 'offline';

interface SocketCtx {
  socket: Socket | null;
  state: ConnectionState;
}
const SocketContext = createContext<SocketCtx>({ socket: null, state: 'offline' });

const statusLabel = { APPROVED: 'aprobada', REJECTED: 'rechazada', PENDING: 'pendiente' } as const;

/**
 * Mantiene la conexión Socket.IO mientras hay sesión. El socket solo notifica:
 * los eventos invalidan las consultas y, al (re)conectar, se vuelve a pedir todo
 * al servidor porque la base de datos es la fuente de verdad.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [state, setState] = useState<ConnectionState>('offline');
  const hasConnectedOnce = useRef(false);

  const role = user?.role;
  const myEmployeeId = user?.employee?.id;

  useEffect(() => {
    if (!token || !role) return;
    const admin = isAdminRole(role);
    const s = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });
    setSocket(s);
    setState('connecting');
    hasConnectedOnce.current = false;

    s.on('connect', () => {
      setState('online');
      // En la reconexión pudimos perder eventos: se resincroniza todo desde la BD.
      if (hasConnectedOnce.current) qc.invalidateQueries();
      hasConnectedOnce.current = true;
    });
    s.on('disconnect', () => setState('offline'));
    s.on('connect_error', () => setState('offline'));

    s.on('attendance:marked', (ev: AttendanceMarkedEvent) => {
      if (admin) {
        qc.invalidateQueries({ queryKey: qk.today });
        qc.invalidateQueries({ queryKey: ['reports'] });
      }
      if (ev.employee.id === myEmployeeId) {
        // Marcación hecha desde otro dispositivo del mismo empleado.
        qc.setQueryData(qk.myStatus, ev.status);
        qc.invalidateQueries({ queryKey: qk.myMonthAll });
      }
    });

    s.on('justification:created', (j: Justification) => {
      qc.invalidateQueries({ queryKey: qk.justificationsAll });
      if (admin) toast.info('Nueva justificación', `${j.employee.fullName} solicitó una corrección.`);
    });

    s.on('justification:reviewed', (j: Justification) => {
      qc.invalidateQueries({ queryKey: qk.justificationsAll });
      const label = statusLabel[j.status];
      const msg = `Tu solicitud sobre la marcación de las ${formatTime(j.attendance.timestamp)} fue ${label}.`;
      const note = j.reviewNote ? ` Nota: “${j.reviewNote}”` : '';
      if (j.status === 'APPROVED') toast.success('Justificación aprobada', msg + note);
      else toast.warning('Justificación rechazada', msg + note);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setState('offline');
    };
  }, [token, role, myEmployeeId, qc, toast]);

  return <SocketContext.Provider value={{ socket, state }}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

/** Suscribe un manejador a un evento del socket mientras el componente está montado. */
export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const { socket } = useSocket();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const fn = (p: T) => ref.current(p);
    socket.on(event, fn);
    return () => {
      socket.off(event, fn);
    };
  }, [socket, event]);
}
