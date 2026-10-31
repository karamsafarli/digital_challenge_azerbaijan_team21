import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import { useSocketEvent } from './useSocket.js';

const POLL_MS = 30000;

/** Density list, active alerts, stats and rule config for the operator panel, kept live via sockets. */
export function useOperatorData({ onNewAlert } = {}) {
  const [density, setDensity] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState([]);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [d, a, s] = await Promise.all([api.density(), api.alerts('ACTIVE'), api.stats()]);
      setDensity(d);
      setAlerts(a);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    refresh();
    api.config().then(setConfig).catch(() => {});
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [refresh]);

  // Socket payload has no rush info, so keep rushUntil from the last REST fetch.
  useSocketEvent('density:update', (list) => {
    setDensity((prev) => {
      const rush = new Map(prev.map((d) => [d.routeId, d.rushUntil]));
      return [...list]
        .sort((a, b) => b.score - a.score)
        .map((d) => ({ ...d, rushUntil: rush.get(d.routeId) ?? null }));
    });
  });

  useSocketEvent('alert:new', (alert) => {
    setAlerts((prev) => (prev.some((a) => a.id === alert.id) ? prev : [alert, ...prev]));
    onNewAlert?.(alert);
  });

  useSocketEvent('alert:updated', (alert) => {
    setAlerts((prev) =>
      alert.status === 'RESOLVED' ? prev.filter((a) => a.id !== alert.id) : prev.map((a) => (a.id === alert.id ? alert : a)),
    );
  });

  useSocketEvent('fleet:update', () => refresh());

  return { density, alerts, stats, config, setConfig, error, refresh };
}
