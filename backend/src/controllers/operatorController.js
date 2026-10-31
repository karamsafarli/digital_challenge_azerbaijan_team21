import { prisma } from '../db.js';
import { config } from '../config.js';
import { analyzeRoute } from '../jobs/analyticsJob.js';
import { getAllLatestDensity, setLatestDensity } from '../services/densityStore.js';
import { listRushes, startRush, stopRush } from '../services/rushScenario.js';
import { broadcast, broadcastToOperators, EVENTS } from '../socket.js';
import { HttpError, notFound } from '../utils/httpError.js';

const alertInclude = { route: { select: { number: true, name: true, color: true } } };

/** Current density for every route, busiest first. Falls back to the DB if the cache is cold. */
export async function getDensity(req, res) {
  let densities = getAllLatestDensity();
  if (densities.length === 0) {
    const routes = await prisma.route.findMany({
      include: { snapshots: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    densities = routes
      .filter((r) => r.snapshots.length > 0)
      .map((r) => {
        const s = r.snapshots[0];
        const summary = {
          routeId: r.id,
          routeNumber: r.number,
          routeName: r.name,
          color: r.color,
          score: s.score,
          level: s.level,
          reportCount: s.reportCount,
          avgOccupancy: s.avgOccupancy,
          updatedAt: s.createdAt.toISOString(),
        };
        setLatestDensity(r.id, summary);
        return summary;
      });
  }
  const rushes = new Map(listRushes().map((r) => [r.routeId, r.endsAt]));
  res.json(
    [...densities]
      .sort((a, b) => b.score - a.score)
      .map((d) => ({ ...d, rushUntil: rushes.get(d.routeId) ?? null })),
  );
}

export async function listAlerts(req, res) {
  const { status, limit } = req.query;
  let where = {};
  if (status === 'ACTIVE') where = { status: { in: ['OPEN', 'ACKNOWLEDGED'] } };
  else if (status !== 'ALL') where = { status };

  const alerts = await prisma.alert.findMany({
    where,
    include: alertInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json(alerts);
}

const ALLOWED_TRANSITIONS = {
  OPEN: ['ACKNOWLEDGED', 'RESOLVED'],
  ACKNOWLEDGED: ['RESOLVED'],
  RESOLVED: [],
};

export async function updateAlert(req, res) {
  const alert = await prisma.alert.findUnique({ where: { id: req.params.id } });
  if (!alert) throw notFound('Bildiriş');

  const next = req.body.status;
  if (!ALLOWED_TRANSITIONS[alert.status].includes(next)) {
    throw new HttpError(409, `Status ${alert.status} → ${next} keçidi mümkün deyil`);
  }

  const now = new Date();
  const updated = await prisma.alert.update({
    where: { id: alert.id },
    data: {
      status: next,
      acknowledgedAt: next === 'ACKNOWLEDGED' ? now : alert.acknowledgedAt ?? now,
      resolvedAt: next === 'RESOLVED' ? now : null,
    },
    include: alertInclude,
  });
  broadcastToOperators(EVENTS.ALERT_UPDATED, updated);
  res.json(updated);
}

/** Reports per route and level over the last hour + density timeline for charts. */
export async function getStats(req, res) {
  const since = new Date(Date.now() - 60 * 60000);
  const [reportGroups, snapshots, routes] = await Promise.all([
    prisma.crowdReport.groupBy({
      by: ['routeId', 'level'],
      where: { createdAt: { gte: since }, flagged: false },
      _count: { _all: true },
    }),
    prisma.densitySnapshot.findMany({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 60000) } },
      orderBy: { createdAt: 'asc' },
      select: { routeId: true, score: true, level: true, createdAt: true },
    }),
    prisma.route.findMany({ select: { id: true, number: true, color: true }, orderBy: { id: 'asc' } }),
  ]);

  res.json(
    routes.map((route) => {
      const counts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
      reportGroups
        .filter((g) => g.routeId === route.id)
        .forEach((g) => {
          counts[g.level] = g._count._all;
        });
      return {
        routeId: route.id,
        routeNumber: route.number,
        color: route.color,
        reportsLastHour: counts,
        timeline: snapshots
          .filter((s) => s.routeId === route.id)
          .map((s) => ({ t: s.createdAt, score: s.score, level: s.level })),
      };
    }),
  );
}

export async function simulateRush(req, res) {
  const route = await prisma.route.findUnique({
    where: { id: req.body.routeId },
    select: { id: true, number: true, name: true, color: true },
  });
  if (!route) throw notFound('Marşrut');

  // Default: long enough for the anomaly rule to fire (window + time for density to climb)
  const durationMinutes = req.body.durationMinutes ?? config.alertWindowMinutes + 3;
  const scenario = await startRush(route.id, durationMinutes);
  await analyzeRoute(route);
  broadcast(EVENTS.DENSITY_UPDATE, getAllLatestDensity());

  res.status(202).json({
    ...scenario,
    routeNumber: route.number,
    message: `Xətt №${route.number} üçün pik saat ssenarisi ${durationMinutes} dəqiqəlik başladıldı. Sıxlıq ${config.alertWindowMinutes} dəqiqə Yüksək qalarsa, xəbərdarlıq yaranacaq.`,
  });
}

export async function cancelRush(req, res) {
  const stopped = stopRush(req.params.id);
  if (!stopped) throw notFound('Aktiv ssenari');
  res.status(204).end();
}

export function getConfig(req, res) {
  res.json({
    alertWindowMinutes: config.alertWindowMinutes,
    alertMinReports: config.alertMinReports,
    densityWindowMinutes: config.densityWindowMinutes,
    reportCooldownSeconds: config.reportCooldownSeconds,
  });
}
