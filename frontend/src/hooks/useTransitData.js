import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import { useSocketEvent } from './useSocket.js';

/** Routes (static), live buses and live density per route, shared by passenger and operator pages. */
export function useTransitData() {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [densityByRoute, setDensityByRoute] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .routes()
      .then(async (loaded) => {
        const busLists = await Promise.all(loaded.map((r) => api.routeBuses(r.id)));
        if (cancelled) return;
        setRoutes(loaded);
        setBuses(busLists.flat());
        setDensityByRoute(Object.fromEntries(loaded.map((r) => [r.id, r.density?.level ?? null])));
      })
      .catch((err) => !cancelled && setError(errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  useSocketEvent('bus:positions', setBuses);
  useSocketEvent('density:update', (list) => {
    setDensityByRoute((prev) => ({ ...prev, ...Object.fromEntries(list.map((d) => [d.routeId, d.level])) }));
  });

  return { routes, buses, densityByRoute, loading, error };
}
