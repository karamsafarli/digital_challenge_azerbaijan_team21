import { useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import LevelBadge from './LevelBadge.jsx';
import { formatDistance, formatEta, occupancyLevel } from '../utils/format.js';

const REFRESH_MS = 5000;

/** Stop picker + live list of upcoming arrivals (ETA) at the chosen stop. */
export default function StopEtaPanel({ stops, selectedStopId, onSelectStop, routeId }) {
  const [eta, setEta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedStopId) {
      setEta(null);
      return undefined;
    }
    let cancelled = false;
    const load = () =>
      api
        .stopEta(selectedStopId, routeId ?? undefined)
        .then((data) => {
          if (!cancelled) {
            setEta(data);
            setError(null);
          }
        })
        .catch((err) => !cancelled && setError(errorMessage(err)));

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [selectedStopId, routeId]);

  const arrivals = eta?.arrivals.slice(0, 6) ?? [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Dayanacaq və gəliş vaxtı</h2>

      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="stop-select">
        Dayanacaq seçin (və ya xəritədə klikləyin)
      </label>
      <select
        id="stop-select"
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        value={selectedStopId ?? ''}
        onChange={(e) => onSelectStop(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— seçilməyib —</option>
        {stops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      {selectedStopId && !error && (
        <ul className="mt-3 divide-y divide-slate-100">
          {arrivals.length === 0 && <li className="py-2 text-sm text-slate-500">Yaxınlaşan avtobus yoxdur</li>}
          {arrivals.map((a) => (
            <li key={`${a.routeId}-${a.busId}`} className="flex items-center gap-3 py-2">
              <span
                className="inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 text-sm font-bold text-white"
                style={{ backgroundColor: a.color }}
              >
                {a.routeNumber}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium">{a.plate}</div>
                <div className="text-xs text-slate-500">{formatDistance(a.distanceM)}</div>
              </div>
              <LevelBadge level={occupancyLevel(a.occupancy, a.capacity)} />
              <span className="w-16 text-right text-sm font-semibold tabular-nums text-blue-700">
                {formatEta(a.etaSeconds)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {selectedStopId && (
        <p className="mt-2 text-[11px] text-slate-400">
          ETA marşrut sıxlığına görə düzəldilir · hər {REFRESH_MS / 1000} saniyədən bir yenilənir
        </p>
      )}
    </section>
  );
}
