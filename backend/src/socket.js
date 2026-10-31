import { Server } from 'socket.io';
import { config } from './config.js';

// Events pushed to clients
export const EVENTS = {
  BUS_POSITIONS: 'bus:positions',
  DENSITY_UPDATE: 'density:update',
  ALERT_NEW: 'alert:new',
  ALERT_UPDATED: 'alert:updated',
};

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.corsOrigin } });
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
  });
  return io;
}

/** Emit to every connected client; no-op when sockets are not initialised (e.g. in tests). */
export function broadcast(event, payload) {
  if (io) io.emit(event, payload);
}
