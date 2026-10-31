import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { getAuthToken } from '../api/client.js';

// One shared connection (same origin; Vite/nginx proxy /socket.io to the API).
// The token is sent on every (re)connect so operators join the private alerts room.
const socket = io({ autoConnect: true, auth: (cb) => cb({ token: getAuthToken() }) });

/** Reconnect after login/logout so the server sees the new identity. */
export function reconnectSocket() {
  socket.disconnect();
  socket.connect();
}

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
