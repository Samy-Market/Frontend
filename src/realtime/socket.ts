import { createContext, useContext, useEffect, useEffectEvent } from 'react';
import type { Socket } from 'socket.io-client';

export type ConnectionState = 'connecting' | 'online' | 'offline';

export interface SocketCtx {
  socket: Socket | null;
  state: ConnectionState;
}

export const SocketContext = createContext<SocketCtx>({ socket: null, state: 'offline' });

export const useSocket = () => useContext(SocketContext);

export function useSocketEvent<T>(event: string, handler: (payload: T) => void) {
  const { socket } = useSocket();
  const onEvent = useEffectEvent((payload: T) => handler(payload));
  useEffect(() => {
    if (!socket) return;
    const fn = (p: T) => onEvent(p);
    socket.on(event, fn);
    return () => {
      socket.off(event, fn);
    };
  }, [socket, event]);
}
