// Demo "rush hour" scenario: for a while, a route receives a steady stream of HIGH crowd reports and
// its buses fill up. The analytics engine processes this exactly like real data, so the alert fires
// only after density has stayed HIGH for the configured window.

import { prisma } from '../db.js';

const REPORT_INTERVAL_MS = 20000;
const REPORTS_PER_INTERVAL = 2;
export const RUSH_LOAD = 0.95;
export const RUSH_CLIENT_ID = 'rush-simulator';

const active = new Map(); // routeId -> { endsAt, timer }

async function injectReports(routeId) {
  await prisma.crowdReport.createMany({
    data: Array.from({ length: REPORTS_PER_INTERVAL }, () => ({
      routeId,
      level: 'HIGH',
      clientId: RUSH_CLIENT_ID,
    })),
  });
}

export function stopRush(routeId) {
  const scenario = active.get(routeId);
  if (!scenario) return false;
  clearInterval(scenario.timer);
  active.delete(routeId);
  return true;
}

export async function startRush(routeId, durationMinutes) {
  stopRush(routeId);
  const endsAt = new Date(Date.now() + durationMinutes * 60000);
  const timer = setInterval(() => {
    if (Date.now() >= endsAt.getTime()) {
      stopRush(routeId);
      return;
    }
    injectReports(routeId).catch((err) => console.error('Rush injection failed:', err.message));
  }, REPORT_INTERVAL_MS);
  active.set(routeId, { endsAt, timer });
  await injectReports(routeId);
  return { routeId, endsAt };
}

/** Occupancy target override used by the GPS simulator while a rush is active. */
export function getRushLoad(routeId) {
  return active.has(routeId) ? RUSH_LOAD : null;
}

export function listRushes() {
  return [...active.entries()].map(([routeId, { endsAt }]) => ({ routeId, endsAt }));
}
