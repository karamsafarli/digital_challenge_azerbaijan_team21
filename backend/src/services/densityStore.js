// In-memory cache of the latest computed density per route (source of truth stays in DensitySnapshot).

const latest = new Map();

export function setLatestDensity(routeId, density) {
  latest.set(routeId, density);
}

export function getLatestDensity(routeId) {
  return latest.get(routeId);
}

export function getAllLatestDensity() {
  return [...latest.values()];
}
