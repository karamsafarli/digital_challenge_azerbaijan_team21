// ETA = distance the bus still has to drive to reach the stop / congestion-adjusted speed + dwell time.
// Buses shuttle back and forth along the route polyline (direction 1 = forward, -1 = backward).

export const SPEED_FACTOR = { LOW: 1, MEDIUM: 0.85, HIGH: 0.7 };
export const DEFAULT_SPEED_KMH = 22;
export const MIN_SPEED_KMH = 8;
export const DWELL_SECONDS_PER_STOP = 20;

/** Metres the bus must travel to reach a stop, including turning around at the route end. */
export function distanceToStop({ progressM, direction }, stopDistanceM, lengthM) {
  if (direction >= 0) {
    return stopDistanceM >= progressM
      ? stopDistanceM - progressM
      : lengthM - progressM + (lengthM - stopDistanceM);
  }
  return stopDistanceM <= progressM ? progressM - stopDistanceM : progressM + stopDistanceM;
}

/** Number of intermediate stops the bus will pass before the target (for dwell time). */
export function stopsBetween(bus, stopDistanceM, lengthM, allStopDistances) {
  const total = distanceToStop(bus, stopDistanceM, lengthM);
  return allStopDistances.filter((d) => {
    if (d === stopDistanceM) return false;
    const toD = distanceToStop(bus, d, lengthM);
    return toD > 0 && toD < total;
  }).length;
}

/** Speed (km/h) used for the estimate, slowed down by route congestion. */
export function effectiveSpeedKmh(speedKmh, level = 'LOW') {
  const base = speedKmh > MIN_SPEED_KMH ? speedKmh : DEFAULT_SPEED_KMH;
  return Math.max(base * (SPEED_FACTOR[level] ?? 1), MIN_SPEED_KMH);
}

export function etaSeconds(distanceM, speedKmh, intermediateStops = 0) {
  const metresPerSecond = (speedKmh * 1000) / 3600;
  return Math.round(distanceM / metresPerSecond + intermediateStops * DWELL_SECONDS_PER_STOP);
}

/**
 * Upcoming arrivals at a stop, soonest first.
 * @param buses   [{ id, plate, progressM, direction, speedKmh, ... }]
 * @param route   { lengthM, stopDistances: number[] }
 * @param stopDistanceM distance of the target stop from the route start
 * @param level   current route density level
 */
export function computeStopEtas(buses, route, stopDistanceM, level = 'LOW') {
  return buses
    .map((bus) => {
      const distanceM = distanceToStop(bus, stopDistanceM, route.lengthM);
      const speed = effectiveSpeedKmh(bus.speedKmh, level);
      const between = stopsBetween(bus, stopDistanceM, route.lengthM, route.stopDistances ?? []);
      return {
        busId: bus.id,
        plate: bus.plate,
        distanceM: Math.round(distanceM),
        etaSeconds: etaSeconds(distanceM, speed, between),
      };
    })
    .sort((a, b) => a.etaSeconds - b.etaSeconds);
}
