// Pure helpers for fleet dispatching (kept free of DB access so they are unit-testable).

export const DEPOT = { lat: 40.4093, lng: 49.8671 }; // central bus depot (demo location)
export const MIN_BUSES_PER_ROUTE = 2;

/**
 * Passengers spread over the buses of a route when one more bus joins.
 * @returns occupancies for the existing buses (same order) and for the new bus.
 */
export function redistributeOccupancy(occupancies) {
  const total = occupancies.reduce((sum, o) => sum + o, 0);
  const count = occupancies.length + 1;
  const share = Math.floor(total / count);
  const existing = occupancies.map(() => share);
  return { existing, added: total - share * occupancies.length };
}

/** The bus to take from a donor route: the emptiest one, so the fewest passengers are affected. */
export function pickDonorBus(buses) {
  if (buses.length <= MIN_BUSES_PER_ROUTE) return null;
  return [...buses].sort((a, b) => a.occupancy / a.capacity - b.occupancy / b.capacity)[0];
}

/**
 * Suggest donor routes for a crowded route: lowest density first, only routes that can spare a bus.
 * @param routes [{ routeId, level, score, busCount }]
 */
export function suggestDonors(routes, targetRouteId) {
  return routes
    .filter((r) => r.routeId !== targetRouteId && r.busCount > MIN_BUSES_PER_ROUTE && r.level !== 'HIGH')
    .sort((a, b) => a.score - b.score);
}
