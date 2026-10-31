import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// One shared connection for the whole app (same origin; Vite/nginx proxy /socket.io to the API).
const socket = io({ autoConnect: true });

/** Subscribe to a server event; the latest handler is always used without resubscribing. */
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}

export function useSocketStatus() {
  const [connected, setConnected] = useState(socket.connected);
  useEffect(() => {
    const on = () => setConnected(true);
    const off = () => setConnected(false);
    socket.on('connect', on);
    socket.on('disconnect', off);
    return () => {
      socket.off('connect', on);
      socket.off('disconnect', off);
    };
  }, []);
  return connected;
}
