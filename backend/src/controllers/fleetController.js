import { prisma } from '../db.js';
import { analyzeRoute } from '../jobs/analyticsJob.js';
import { getAllLatestDensity, getLatestDensity } from '../services/densityStore.js';
import { stopRush } from '../services/rushScenario.js';
import { broadcastAnnouncements } from '../services/announcements.js';
import { DEPOT, MIN_BUSES_PER_ROUTE, pickDonorBus, redistributeOccupancy, suggestDonors } from '../services/fleet.js';
import { broadcast, broadcastToOperators, EVENTS } from '../socket.js';
import { HttpError, notFound } from '../utils/httpError.js';

const routeSelect = { id: true, number: true, name: true, color: true, path: true };

async function routeSummaries() {
  const routes = await prisma.route.findMany({
    select: { id: true, number: true, name: true, color: true, buses: { where: { status: 'IN_SERVICE' } } },
    orderBy: { id: 'asc' },
  });
  return routes.map((r) => {
    const density = getLatestDensity(r.id);
    return {
      routeId: r.id,
      number: r.number,
      name: r.name,
      color: r.color,
      busCount: r.buses.length,
      level: density?.level ?? 'LOW',
      score: density?.score ?? 0,
      avgOccupancy: r.buses.length
        ? r.buses.reduce((s, b) => s + b.occupancy / b.capacity, 0) / r.buses.length
        : 0,
    };
  });
}

export async function getFleet(req, res) {
  const [reserve, routes, actions] = await Promise.all([
    prisma.bus.findMany({ where: { status: 'RESERVE' }, orderBy: { plate: 'asc' } }),
    routeSummaries(),
    prisma.dispatchAction.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        bus: { select: { plate: true } },
        fromRoute: { select: { number: true, color: true } },
        toRoute: { select: { number: true, color: true } },
        operator: { select: { name: true } },
      },
    }),
  ]);
  res.json({
    reserve: reserve.map((b) => ({ id: b.id, plate: b.plate, capacity: b.capacity })),
    routes,
    donorsFor: Object.fromEntries(routes.map((r) => [r.routeId, suggestDonors(routes, r.routeId).map((d) => d.routeId)])),
    minBusesPerRoute: MIN_BUSES_PER_ROUTE,
    actions,
  });
}

async function notifyFleetChange() {
  broadcastToOperators(EVENTS.FLEET_UPDATE, { at: new Date().toISOString() });
  broadcast(EVENTS.DENSITY_UPDATE, getAllLatestDensity());
}

/**
 * Add a bus to a crowded route: from the depot reserve, or taken from a quieter route (rebalancing).
 * Passengers spread over the larger fleet, open alerts on the route are resolved with a record of the
 * action, and passengers get an automatic announcement.
 */
export async function dispatchBus(req, res) {
  const { toRouteId, fromRouteId, busId } = req.body;
  if (fromRouteId && fromRouteId === toRouteId) throw new HttpError(400, 'Mənbə və hədəf xətt eyni ola bilməz');

  const toRoute = await prisma.route.findUnique({ where: { id: toRouteId }, select: routeSelect });
  if (!toRoute) throw notFound('Hədəf xətt');

  let bus;
  let fromRoute = null;
  if (fromRouteId) {
    fromRoute = await prisma.route.findUnique({ where: { id: fromRouteId }, select: routeSelect });
    if (!fromRoute) throw notFound('Mənbə xətt');
    const donorBuses = await prisma.bus.findMany({ where: { routeId: fromRouteId, status: 'IN_SERVICE' } });
    if (donorBuses.length <= MIN_BUSES_PER_ROUTE) {
      throw new HttpError(409, `Xətt №${fromRoute.number}-də ən azı ${MIN_BUSES_PER_ROUTE} avtobus qalmalıdır`);
    }
    bus = busId ? donorBuses.find((b) => b.id === busId) : pickDonorBus(donorBuses);
    if (!bus) throw new HttpError(400, 'Avtobus bu xəttə aid deyil');
  } else {
    bus = busId
      ? await prisma.bus.findFirst({ where: { id: busId, status: 'RESERVE' } })
      : await prisma.bus.findFirst({ where: { status: 'RESERVE' }, orderBy: { plate: 'asc' } });
    if (!bus) throw new HttpError(409, 'Depoda ehtiyat avtobus yoxdur');
  }

  const targetBuses = await prisma.bus.findMany({ where: { routeId: toRouteId, status: 'IN_SERVICE' } });
  const { existing, added } = redistributeOccupancy(targetBuses.map((b) => b.occupancy));
  const openAlerts = await prisma.alert.findMany({
    where: { routeId: toRouteId, status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
  });

  const type = fromRoute ? 'REBALANCE' : 'RESERVE_DISPATCH';
  const now = new Date();
  const [start] = toRoute.path;
  const note = fromRoute
    ? `${bus.plate}: №${fromRoute.number} → №${toRoute.number}`
    : `${bus.plate}: depo → №${toRoute.number}`;

  const [action] = await prisma.$transaction([
    prisma.dispatchAction.create({
      data: { type, busId: bus.id, fromRouteId: fromRoute?.id, toRouteId, operatorId: req.user.id, note },
    }),
    prisma.bus.update({
      where: { id: bus.id },
      data: {
        routeId: toRouteId,
        status: 'IN_SERVICE',
        progressM: 0,
        direction: 1,
        lat: start[0],
        lng: start[1],
        occupancy: added,
        speedKmh: 0,
      },
    }),
    ...targetBuses.map((b, i) => prisma.bus.update({ where: { id: b.id }, data: { occupancy: existing[i] } })),
    ...openAlerts.map((alert) =>
      prisma.alert.update({
        where: { id: alert.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: now,
          acknowledgedAt: alert.acknowledgedAt ?? now,
          details: { ...(alert.details ?? {}), resolution: { type, busPlate: bus.plate, fromRoute: fromRoute?.number ?? null, by: req.user.name } },
        },
      }),
    ),
    prisma.announcement.create({
      data: {
        routeId: toRouteId,
        severity: 'INFO',
        message: `Xətt №${toRoute.number}-ə əlavə avtobus (${bus.plate}) çıxdı. Sıxlığın azalması gözlənilir.`,
        expiresAt: new Date(now.getTime() + 30 * 60000),
        createdById: req.user.id,
      },
    }),
  ]);

  // The added capacity absorbs the simulated demand peak on that route
  stopRush(toRouteId);

  await analyzeRoute(toRoute, now);
  if (fromRoute) await analyzeRoute(fromRoute, now);

  const resolved = await prisma.alert.findMany({
    where: { id: { in: openAlerts.map((a) => a.id) } },
    include: { route: { select: { number: true, name: true, color: true } } },
  });
  resolved.forEach((alert) => broadcastToOperators(EVENTS.ALERT_UPDATED, alert));
  await broadcastAnnouncements();
  await notifyFleetChange();

  res.status(201).json({ action, bus: { id: bus.id, plate: bus.plate }, resolvedAlerts: resolved.length });
}

/** Take a bus off its route and park it in the depot as a reserve. */
export async function returnToDepot(req, res) {
  const bus = await prisma.bus.findUnique({ where: { id: req.params.id }, include: { route: { select: routeSelect } } });
  if (!bus || bus.status !== 'IN_SERVICE') throw notFound('Xəttdə olan avtobus');

  const count = await prisma.bus.count({ where: { routeId: bus.routeId, status: 'IN_SERVICE' } });
  if (count <= MIN_BUSES_PER_ROUTE) {
    throw new HttpError(409, `Xətt №${bus.route.number}-də ən azı ${MIN_BUSES_PER_ROUTE} avtobus qalmalıdır`);
  }

  const [action] = await prisma.$transaction([
    prisma.dispatchAction.create({
      data: {
        type: 'RETURN_TO_DEPOT',
        busId: bus.id,
        fromRouteId: bus.routeId,
        operatorId: req.user.id,
        note: `${bus.plate}: №${bus.route.number} → depo`,
      },
    }),
    prisma.bus.update({
      where: { id: bus.id },
      data: { routeId: null, status: 'RESERVE', lat: DEPOT.lat, lng: DEPOT.lng, occupancy: 0, speedKmh: 0, progressM: 0 },
    }),
  ]);

  await analyzeRoute(bus.route);
  await notifyFleetChange();
  res.json({ action });
}
