// GPS / occupancy simulator. There is no real AVL feed, so each tick moves every bus along its
// route polyline and nudges its passenger count, producing realistic-looking telemetry.

import { pointAlong } from '../utils/geo.js';
import { SPEED_FACTOR } from './eta.js';

export const SIM = {
  minSpeedKmh: 18,
  maxSpeedKmh: 38,
  stopChance: 0.1, // chance per tick the bus is held at a light / stop
  occupancyNoise: 4, // max random change in passengers per tick
  meanReversion: 0.08, // how quickly occupancy drifts towards the route's typical load
};

/** Move along [0, lengthM], bouncing back at either end. */
export function moveAlong(progressM, direction, distanceM, lengthM) {
  let p = progressM + direction * distanceM;
  let dir = direction;
  if (p > lengthM) {
    p = 2 * lengthM - p;
    dir = -1;
  } else if (p < 0) {
    p = -p;
    dir = 1;
  }
  return { progressM: Math.min(Math.max(p, 0), lengthM), direction: dir };
}

/**
 * Next state of one bus.
 * @param bus    { progressM, direction, occupancy, capacity }
 * @param route  { lengthM, path, typicalLoad (0..1) }
 * @param dtSeconds time since the last tick
 * @param level  current route density (congestion slows buses)
 * @param rng    injectable random source for tests
 */
export function advanceBus(bus, route, dtSeconds, level = 'LOW', rng = Math.random) {
  const stopped = rng() < SIM.stopChance;
  const cruise = SIM.minSpeedKmh + rng() * (SIM.maxSpeedKmh - SIM.minSpeedKmh);
  const speedKmh = stopped ? 0 : cruise * (SPEED_FACTOR[level] ?? 1);
  const distanceM = (speedKmh * 1000 * dtSeconds) / 3600;

  const { progressM, direction } = moveAlong(bus.progressM, bus.direction, distanceM, route.lengthM);
  const [lat, lng] = pointAlong(route.path, progressM);

  const target = (route.typicalLoad ?? 0.4) * bus.capacity;
  const drift = (target - bus.occupancy) * SIM.meanReversion;
  const noise = (rng() * 2 - 1) * SIM.occupancyNoise;
  const occupancy = Math.round(Math.min(Math.max(bus.occupancy + drift + noise, 0), bus.capacity * 1.2));

  return { progressM, direction, lat, lng, speedKmh: Math.round(speedKmh * 10) / 10, occupancy };
}
