const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance between two [lat, lng] points, in metres. */
export function haversineM([lat1, lng1], [lat2, lng2]) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Cumulative distance (m) at each vertex of a polyline; first element is 0. */
export function cumulativeDistances(path) {
  const result = [0];
  for (let i = 1; i < path.length; i += 1) {
    result.push(result[i - 1] + haversineM(path[i - 1], path[i]));
  }
  return result;
}

/** Point [lat, lng] located `distanceM` metres along the polyline (clamped to its ends). */
export function pointAlong(path, distanceM) {
  const cumulative = cumulativeDistances(path);
  const total = cumulative[cumulative.length - 1];
  const d = Math.min(Math.max(distanceM, 0), total);

  for (let i = 1; i < path.length; i += 1) {
    if (d <= cumulative[i]) {
      const segment = cumulative[i] - cumulative[i - 1];
      const t = segment === 0 ? 0 : (d - cumulative[i - 1]) / segment;
      const [lat1, lng1] = path[i - 1];
      const [lat2, lng2] = path[i];
      return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t];
    }
  }
  return path[path.length - 1];
}
