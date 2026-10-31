import { prisma } from '../db.js';
import { computeStopEtas } from '../services/eta.js';
import { getLatestDensity } from '../services/densityStore.js';
import { notFound } from '../utils/httpError.js';

export async function listStops(req, res) {
  const stops = await prisma.stop.findMany({
    orderBy: { name: 'asc' },
    include: { routes: { include: { route: { select: { id: true, number: true, color: true } } } } },
  });
  res.json(
    stops.map((s) => ({
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      routes: s.routes.map((rs) => rs.route),
    })),
  );
}

/** Upcoming arrivals at a stop for every route serving it (or one route via ?routeId=). */
export async function getStopEta(req, res) {
  const stop = await prisma.stop.findUnique({
    where: { id: req.params.id },
    include: {
      routes: {
        where: req.query.routeId ? { routeId: req.query.routeId } : undefined,
        include: {
          route: {
            include: { stops: { select: { distanceM: true } }, buses: true },
          },
        },
      },
    },
  });
  if (!stop) throw notFound('Dayanacaq');

  const arrivals = stop.routes.flatMap((rs) => {
    const { route } = rs;
    const level = getLatestDensity(route.id)?.level ?? 'LOW';
    const etas = computeStopEtas(
      route.buses,
      { lengthM: route.lengthM, stopDistances: route.stops.map((s) => s.distanceM) },
      rs.distanceM,
      level,
    );
    const busById = new Map(route.buses.map((b) => [b.id, b]));
    return etas.map((eta) => {
      const bus = busById.get(eta.busId);
      return {
        ...eta,
        routeId: route.id,
        routeNumber: route.number,
        color: route.color,
        density: level,
        occupancy: bus.occupancy,
        capacity: bus.capacity,
      };
    });
  });

  arrivals.sort((a, b) => a.etaSeconds - b.etaSeconds);
  res.json({ stop: { id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng }, arrivals });
}
