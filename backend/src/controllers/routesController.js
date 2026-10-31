import { prisma } from '../db.js';
import { getLatestDensity } from '../services/densityStore.js';
import { notFound } from '../utils/httpError.js';

const routeInclude = {
  stops: { orderBy: { order: 'asc' }, include: { stop: true } },
};

export function serializeRoute(route) {
  const density = getLatestDensity(route.id);
  return {
    id: route.id,
    number: route.number,
    name: route.name,
    color: route.color,
    lengthM: Math.round(route.lengthM),
    path: route.path,
    density: density ? { level: density.level, score: density.score } : null,
    stops: route.stops.map((rs) => ({
      id: rs.stop.id,
      name: rs.stop.name,
      lat: rs.stop.lat,
      lng: rs.stop.lng,
      order: rs.order,
      distanceM: Math.round(rs.distanceM),
    })),
  };
}

export function serializeBus(bus) {
  return {
    id: bus.id,
    plate: bus.plate,
    routeId: bus.routeId,
    lat: bus.lat,
    lng: bus.lng,
    progressM: Math.round(bus.progressM),
    direction: bus.direction,
    speedKmh: bus.speedKmh,
    occupancy: bus.occupancy,
    capacity: bus.capacity,
    updatedAt: bus.updatedAt,
  };
}

export async function listRoutes(req, res) {
  const routes = await prisma.route.findMany({ include: routeInclude, orderBy: { id: 'asc' } });
  res.json(routes.map(serializeRoute));
}

export async function getRoute(req, res) {
  const route = await prisma.route.findUnique({ where: { id: req.params.id }, include: routeInclude });
  if (!route) throw notFound('Marşrut');
  res.json(serializeRoute(route));
}

export async function listRouteBuses(req, res) {
  const route = await prisma.route.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!route) throw notFound('Marşrut');
  const buses = await prisma.bus.findMany({ where: { routeId: route.id }, orderBy: { id: 'asc' } });
  res.json(buses.map(serializeBus));
}
