import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { cumulativeDistances, pointAlong } from '../src/utils/geo.js';
import { routes, stops } from './data/baku.js';

const prisma = new PrismaClient();

// Demo accounts (values come from env; defaults are documented in .env.example)
const DEMO_USERS = [
  {
    name: 'Dispetçer',
    email: process.env.OPERATOR_EMAIL || 'operator@smarttransit.az',
    password: process.env.OPERATOR_PASSWORD || 'Operator2026!',
    role: 'OPERATOR',
  },
  {
    name: 'Demo Sərnişin',
    email: process.env.DEMO_PASSENGER_EMAIL || 'sernisin@smarttransit.az',
    password: process.env.DEMO_PASSENGER_PASSWORD || 'Sernisin2026!',
    role: 'PASSENGER',
  },
];

/** Accounts are created if missing on every start (independent of route data). */
async function seedUsers() {
  for (const user of DEMO_USERS) {
    const exists = await prisma.user.findUnique({ where: { email: user.email } });
    if (exists) continue;
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: await bcrypt.hash(user.password, 10),
      },
    });
    console.log(`Seed: ${user.role.toLowerCase()} account ${user.email} created.`);
  }
}

async function main() {
  await seedUsers();

  // Idempotent: skip when data already exists so container restarts keep history.
  if ((await prisma.route.count()) > 0 && !process.argv.includes('--force')) {
    console.log('Seed: data already present, skipping (use --force to reset).');
    await seedReserveBuses();
    return;
  }
  await seedNetwork();
  await seedReserveBuses();
}

/** Reserve buses waiting in the depot for the dispatcher (created once). */
async function seedReserveBuses() {
  if ((await prisma.bus.count({ where: { status: 'RESERVE' } })) > 0) return;
  if ((await prisma.dispatchAction.count()) > 0) return; // reserves already used/returned before
  for (let i = 1; i <= 4; i += 1) {
    await prisma.bus.create({
      data: {
        plate: `10-EH-${String(i).padStart(3, '0')}`,
        status: 'RESERVE',
        routeId: null,
        capacity: 90,
        lat: 40.4093,
        lng: 49.8671,
        occupancy: 0,
      },
    });
  }
  console.log('Seed: 4 reserve buses parked in the depot.');
}

async function seedNetwork() {

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
