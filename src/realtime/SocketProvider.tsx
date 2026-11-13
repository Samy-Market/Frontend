import { useQueryClient } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { isAdminRole, useAuth } from '@/auth/auth';
import { useToast } from '@/components/toast';
import { API_URL } from '@/lib/api';
import { qk } from '@/lib/queryClient';
import { formatDayKey, formatTime } from '@/lib/time';
import type { AttendanceMarkedEvent, Justification } from '@/lib/types';
import { ConnectionState, SocketContext } from './socket';

const statusLabel = { APPROVED: 'aprobada', REJECTED: 'rechazada', PENDING: 'pendiente' } as const;

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const hasConnectedOnce = useRef(false);

  const role = user?.role;
  const myEmployeeId = user?.employee?.id;

  const socket = useMemo<Socket | null>(
    () =>
      token
        ? io(API_URL, {
            auth: { token },
            autoConnect: false,
            transports: ['websocket', 'polling'],
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
          })
        : null,
    [token],
  );
  const [status, setStatus] = useState<{ socket: Socket | null; state: ConnectionState }>({ socket: null, state: 'offline' });
  const state: ConnectionState = !socket ? 'offline' : status.socket === socket ? status.state : 'connecting';

  useEffect(() => {
    if (!socket || !role) return;
    const s = socket;
    const admin = isAdminRole(role);
    hasConnectedOnce.current = false;
    s.connect();

    s.on('connect', () => {
      setStatus({ socket: s, state: 'online' });
      // En la reconexión pudimos perder eventos: se resincroniza todo desde la BD.
      if (hasConnectedOnce.current) void qc.invalidateQueries();
      hasConnectedOnce.current = true;
    });
    s.on('disconnect', () => setStatus({ socket: s, state: 'offline' }));
    s.on('connect_error', () => setStatus({ socket: s, state: 'offline' }));

    s.on('attendance:marked', (ev: AttendanceMarkedEvent) => {
      if (admin) {
        void qc.invalidateQueries({ queryKey: qk.today });
        void qc.invalidateQueries({ queryKey: ['reports'] });
      }
      if (ev.employee.id === myEmployeeId) {
        qc.setQueryData(qk.myStatus, ev.status);
        void qc.invalidateQueries({ queryKey: qk.myMonthAll });
      }
    });

    s.on('justification:created', (j: Justification) => {
      void qc.invalidateQueries({ queryKey: qk.justificationsAll });
      if (admin) toast.info('Nueva justificación', `${j.employee.fullName} solicitó una corrección.`);
    });

    s.on('justification:reviewed', (j: Justification) => {
      void qc.invalidateQueries({ queryKey: qk.justificationsAll });
      void qc.invalidateQueries({ queryKey: qk.myMonthAll });
      const label = statusLabel[j.status];
      const about = j.attendance
        ? `la marcación de las ${formatTime(j.attendance.timestamp)}`
        : `la ausencia del ${j.date ? formatDayKey(j.date) : 'día'}`;
      if (j.status === 'PENDING') {
        toast.info('Justificación en revisión', `Tu solicitud sobre ${about} volvió a revisión.`);
        return;
      }
      const msg = `Tu solicitud sobre ${about} fue ${label}.`;
      const note = j.reviewNote ? ` Nota: “${j.reviewNote}”` : '';
      if (j.status === 'APPROVED') toast.success('Justificación aprobada', msg + note);
      else toast.warning('Justificación rechazada', msg + note);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, [socket, role, myEmployeeId, qc, toast]);

  return <SocketContext.Provider value={{ socket, state }}>{children}</SocketContext.Provider>;
}
