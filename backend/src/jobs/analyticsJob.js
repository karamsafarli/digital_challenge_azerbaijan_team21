import { prisma } from '../db.js';
import { config } from '../config.js';
import { computeRouteDensity } from '../services/density.js';
import { ALERT_TYPE, buildAlertMessage, evaluateAnomaly } from '../services/anomaly.js';
import { getAllLatestDensity, setLatestDensity } from '../services/densityStore.js';
import { broadcast, EVENTS } from '../socket.js';

const MAX_GAP_MINUTES = 2;

// Serialise work per route so a report-triggered run and the scheduled run can't both create an alert.
const routeLocks = new Map();
function withRouteLock(routeId, fn) {
  const previous = routeLocks.get(routeId) ?? Promise.resolve();
  const next = previous.catch(() => {}).then(fn);
  routeLocks.set(routeId, next);
  return next;
}

const minutesBefore = (date, minutes) => new Date(date.getTime() - minutes * 60000);

/** Recompute density for one route, store a snapshot and raise an alert if the anomaly rule fires. */
export function analyzeRoute(route, now = new Date()) {
  return withRouteLock(route.id, async () => {
    const lookbackMinutes = Math.max(config.densityWindowMinutes, config.alertWindowMinutes);
    const [reports, buses] = await Promise.all([
      prisma.crowdReport.findMany({
        where: { routeId: route.id, createdAt: { gte: minutesBefore(now, lookbackMinutes), lte: now } },
        select: { level: true, createdAt: true },
      }),
      prisma.bus.findMany({ where: { routeId: route.id }, select: { occupancy: true, capacity: true } }),
    ]);

    const density = computeRouteDensity({ reports, buses, now, windowMinutes: config.densityWindowMinutes });
    await prisma.densitySnapshot.create({ data: { routeId: route.id, ...density, createdAt: now } });

    const summary = {
      routeId: route.id,
      routeNumber: route.number,
      routeName: route.name,
      color: route.color,
      ...density,
      updatedAt: now.toISOString(),
    };
    setLatestDensity(route.id, summary);

    const [snapshots, activeAlert, lastResolved] = await Promise.all([
      prisma.densitySnapshot.findMany({
        where: {
          routeId: route.id,
          createdAt: { gte: minutesBefore(now, config.alertWindowMinutes + MAX_GAP_MINUTES), lte: now },
        },
        select: { level: true, createdAt: true },
      }),
      prisma.alert.findFirst({ where: { routeId: route.id, status: { in: ['OPEN', 'ACKNOWLEDGED'] } } }),
      prisma.alert.findFirst({
        where: { routeId: route.id, status: 'RESOLVED' },
        orderBy: { resolvedAt: 'desc' },
        select: { resolvedAt: true },
      }),
    ]);

    const result = evaluateAnomaly({
      snapshots,
      reports,
      now,
      windowMinutes: config.alertWindowMinutes,
      minHighReports: config.alertMinReports,
      maxGapMinutes: MAX_GAP_MINUTES,
      hasActiveAlert: Boolean(activeAlert),
      lastResolvedAt: lastResolved?.resolvedAt ?? null,
    });

    let alert = null;
    if (result.triggered) {
      alert = await prisma.alert.create({
        data: {
          routeId: route.id,
          type: ALERT_TYPE,
          message: buildAlertMessage(route.number, config.alertWindowMinutes),
          details: {
            highSince: result.highSince,
            highReportCount: result.highReportCount,
            score: density.score,
            avgOccupancy: density.avgOccupancy,
            windowMinutes: config.alertWindowMinutes,
          },
        },
        include: { route: { select: { number: true, name: true, color: true } } },
      });
      console.log(`ALERT: ${alert.message}`);
      broadcast(EVENTS.ALERT_NEW, alert);
    }

    return { density: summary, anomaly: result, alert };
  });
}

let running = false;

export async function analyticsTick(now = new Date()) {
  if (running) return;
  running = true;
  try {
    const routes = await prisma.route.findMany({ select: { id: true, number: true, name: true, color: true } });
    for (const route of routes) {
      await analyzeRoute(route, now);
    }
    broadcast(EVENTS.DENSITY_UPDATE, getAllLatestDensity());
  } catch (err) {
    console.error('Analytics tick failed:', err.message);
  } finally {
    running = false;
  }
}

export function startAnalytics() {
  analyticsTick(); // fill the density cache immediately on startup
  return setInterval(analyticsTick, config.analyticsTickMs);
}
