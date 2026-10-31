import { prisma } from '../db.js';
import { config } from '../config.js';
import { advanceBus } from '../services/simulator.js';
import { getLatestDensity } from '../services/densityStore.js';
import { broadcast, EVENTS } from '../socket.js';

// Typical passenger load per route (0..1); busier lines drift towards higher occupancy.
const TYPICAL_LOAD = { 1: 0.35, 3: 0.5, 14: 0.3, 65: 0.25, 88: 0.45 };

let tickCount = 0;
let running = false;
let lastTick = Date.now();

export async function simulatorTick() {
  if (running) return; // never overlap ticks
  running = true;
  try {
    const now = Date.now();
    const dtSeconds = Math.min((now - lastTick) / 1000, 10);
    lastTick = now;
    tickCount += 1;

    const buses = await prisma.bus.findMany({ include: { route: true } });
    const updates = buses.map((bus) => {
      const route = { ...bus.route, typicalLoad: TYPICAL_LOAD[bus.route.number] };
      const level = getLatestDensity(bus.routeId)?.level ?? 'LOW';
      return { bus, next: advanceBus(bus, route, dtSeconds, level) };
    });

    const writes = updates.map(({ bus, next }) => prisma.bus.update({ where: { id: bus.id }, data: next }));
    if (tickCount % config.gpsPingEveryTicks === 0) {
      writes.push(
        prisma.gpsPing.createMany({
          data: updates.map(({ bus, next }) => ({
            busId: bus.id,
            lat: next.lat,
            lng: next.lng,
            speedKmh: next.speedKmh,
            occupancy: next.occupancy,
          })),
        }),
      );
    }
    await prisma.$transaction(writes);

    broadcast(
      EVENTS.BUS_POSITIONS,
      updates.map(({ bus, next }) => ({
        id: bus.id,
        plate: bus.plate,
        routeId: bus.routeId,
        capacity: bus.capacity,
        ...next,
      })),
    );
  } catch (err) {
    console.error('Simulator tick failed:', err.message);
  } finally {
    running = false;
  }
}

export function startSimulator() {
  lastTick = Date.now();
  return setInterval(simulatorTick, config.simulatorTickMs);
}
