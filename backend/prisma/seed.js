import { PrismaClient } from '@prisma/client';
import { cumulativeDistances, pointAlong } from '../src/utils/geo.js';
import { routes, stops } from './data/baku.js';

const prisma = new PrismaClient();

async function main() {
  // Idempotent: skip when data already exists so container restarts keep history.
  if ((await prisma.route.count()) > 0 && !process.argv.includes('--force')) {
    console.log('Seed: data already present, skipping (use --force to reset).');
    return;
  }

  await prisma.$transaction([
    prisma.alert.deleteMany(),
    prisma.densitySnapshot.deleteMany(),
    prisma.crowdReport.deleteMany(),
    prisma.gpsPing.deleteMany(),
    prisma.bus.deleteMany(),
    prisma.routeStop.deleteMany(),
    prisma.route.deleteMany(),
    prisma.stop.deleteMany(),
  ]);

  const stopIds = {};
  for (const [key, stop] of Object.entries(stops)) {
    const created = await prisma.stop.create({ data: stop });
    stopIds[key] = created.id;
  }

  let busCounter = 0;
  for (const route of routes) {
    const path = route.stops.map((key) => [stops[key].lat, stops[key].lng]);
    const distances = cumulativeDistances(path);
    const lengthM = distances[distances.length - 1];

    const created = await prisma.route.create({
      data: {
        number: route.number,
        name: route.name,
        color: route.color,
        lengthM,
        path,
        stops: {
          create: route.stops.map((key, order) => ({
            stopId: stopIds[key],
            order,
            distanceM: distances[order],
          })),
        },
      },
    });

    // Spread buses evenly along the route, alternating direction
    for (let i = 0; i < route.buses; i += 1) {
      busCounter += 1;
      const progressM = (lengthM * (i + 0.5)) / route.buses;
      const [lat, lng] = pointAlong(path, progressM);
      await prisma.bus.create({
        data: {
          plate: `10-BA-${String(busCounter).padStart(3, '0')}`,
          routeId: created.id,
          capacity: 90,
          lat,
          lng,
          progressM,
          direction: i % 2 === 0 ? 1 : -1,
          speedKmh: 25,
          occupancy: 20 + Math.floor(Math.random() * 40),
        },
      });
    }
  }

  console.log(`Seed: ${Object.keys(stops).length} stops, ${routes.length} routes, ${busCounter} buses created.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
