import { Server } from 'socket.io';
import { config } from './config.js';
import { verifyToken } from './services/auth.js';

// Events pushed to clients
export const EVENTS = {
  BUS_POSITIONS: 'bus:positions',
  DENSITY_UPDATE: 'density:update',
  ALERT_NEW: 'alert:new',
  ALERT_UPDATED: 'alert:updated',
  ANNOUNCEMENTS_UPDATE: 'announcements:update',
  // operator-only
  FLEET_UPDATE: 'fleet:update',
  REPORT_NEW: 'report:new',
};

const OPERATORS_ROOM = 'operators';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: config.corsOrigin } });

  // Bus positions and density are public; operator sockets (valid operator token) also join a private room.
  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;
    let role = 'GUEST';
    if (token) {
      try {
        role = verifyToken(token).role;
      } catch {
        role = 'GUEST';
      }
    }
    if (role === 'OPERATOR') socket.join(OPERATORS_ROOM);
    console.log(`Socket connected: ${socket.id} (${role})`);
  });
  return io;
}

/** Emit to every connected client; no-op when sockets are not initialised (e.g. in tests). */
export function broadcast(event, payload) {
  if (io) io.emit(event, payload);
}

/** Emit only to authenticated operators (alerts are internal dispatcher information). */
export function broadcastToOperators(event, payload) {
  if (io) io.to(OPERATORS_ROOM).emit(event, payload);
}
