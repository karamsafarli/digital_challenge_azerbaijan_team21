import { prisma } from '../db.js';
import { config } from '../config.js';
import { advanceBus } from '../services/simulator.js';
import { getLatestDensity } from '../services/densityStore.js';
import { getRushLoad } from '../services/rushScenario.js';
import { broadcast, EVENTS } from '../socket.js';
import { routes as plannedRoutes } from '../../prisma/data/baku.js';

// Typical passenger load per route (0..1); busier lines drift towards higher occupancy.
const TYPICAL_LOAD = { 1: 0.35, 3: 0.5, 14: 0.3, 65: 0.25, 88: 0.45 };
// Buses planned per route; extra buses spread the same demand thinner (and fewer buses concentrate it)
const PLANNED_BUSES = Object.fromEntries(plannedRoutes.map((r) => [r.number, r.buses]));

function typicalLoadFor(route, activeCount) {
  const base = TYPICAL_LOAD[route.number] ?? 0.4;
  const planned = PLANNED_BUSES[route.number] ?? activeCount;
  return Math.min((base * planned) / Math.max(activeCount, 1), 1);
}

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

    const buses = await prisma.bus.findMany({ where: { status: 'IN_SERVICE', routeId: { not: null } }, include: { route: true } });
    const activeCount = {};
    buses.forEach((b) => {
      activeCount[b.routeId] = (activeCount[b.routeId] ?? 0) + 1;
    });
    const updates = buses.map((bus) => {
      const typicalLoad = getRushLoad(bus.routeId) ?? typicalLoadFor(bus.route, activeCount[bus.routeId]);
      const route = { ...bus.route, typicalLoad };
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
