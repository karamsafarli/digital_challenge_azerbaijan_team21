import { useEffect, useState } from 'react';
import { ChevronDown, Clock3, MapPin, Navigation } from 'lucide-react';
import { api, errorMessage } from '../api/client.js';
import { formatDistance, formatEta, LEVEL_META, occupancyLevel } from '../utils/format.js';

const REFRESH_MS = 5000;

function OccupancyBar({ occupancy, capacity }) {
  const level = occupancyLevel(occupancy, capacity);
  const pct = Math.min(Math.round((occupancy / capacity) * 100), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: LEVEL_META[level].color }} />
      </div>
      <span className="text-xs font-medium" style={{ color: LEVEL_META[level].color }}>
        {LEVEL_META[level].label}
      </span>
    </div>
  );
}

/** Stops of the selected route as a vertical line, or a dropdown of all stops. */
function StopPicker({ route, stops, selectedStopId, onSelectStop }) {
  if (route) {
    return (
      <ol className="relative max-h-56 overflow-y-auto pr-1">
        {route.stops.map((stop, i) => {
          const active = stop.id === selectedStopId;
          const last = i === route.stops.length - 1;
          return (
            <li key={stop.id} className="relative">
              {!last && <span className="absolute left-[11px] top-6 h-full w-0.5" style={{ backgroundColor: route.color, opacity: 0.35 }} />}
              <button
                type="button"
                onClick={() => onSelectStop(stop.id)}
                className={`relative flex w-full items-center gap-3 rounded-lg px-1 py-1.5 text-left text-sm transition ${
                  active ? 'font-semibold text-brand-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 bg-white ${active ? 'scale-110' : ''}`}
                  style={{ borderColor: active ? '#1d5ef1' : route.color }}
                >
                  {active && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                </span>
                {stop.name}
              </button>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <div className="relative">
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <select
        aria-label="Dayanacaq"
        className="input appearance-none pl-10 pr-9"
        value={selectedStopId ?? ''}
        onChange={(e) => onSelectStop(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Dayanacaq seçin...</option>
        {stops.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

/** Stop picker + live upcoming arrivals (ETA) at the chosen stop. */
export default function StopEtaPanel({ route, stops, selectedStopId, onSelectStop, routeId }) {
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

  const arrivals = eta?.arrivals.slice(0, 5) ?? [];
  const stopName = eta?.stop.name ?? stops.find((s) => s.id === selectedStopId)?.name;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <MapPin className="h-4 w-4 text-brand-600" /> Dayanacaq
        </h2>
        {!route && <span className="text-xs text-slate-400">və ya xəritədə toxunun</span>}
      </div>

      <StopPicker route={route} stops={stops} selectedStopId={selectedStopId} onSelectStop={onSelectStop} />

      {selectedStopId && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Clock3 className="h-4 w-4 text-slate-400" /> {stopName} · yaxınlaşan avtobuslar
            </h3>
          </div>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {!error && !eta && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          )}

          {!error && eta && arrivals.length === 0 && (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Yaxınlaşan avtobus yoxdur</p>
          )}

          <ul className="space-y-2">
            {arrivals.map((a, i) => (
              <li
                key={`${a.routeId}-${a.busId}`}
                className={`flex items-center gap-3 rounded-xl p-3 ring-1 ${i === 0 ? 'bg-brand-50 ring-brand-200' : 'bg-white ring-slate-200'}`}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-sm"
                  style={{ backgroundColor: a.color }}
                >
                  {a.routeNumber}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Navigation className="h-3 w-3" /> {formatDistance(a.distanceM)} · {a.plate}
                  </div>
                  <div className="mt-1">
                    <OccupancyBar occupancy={a.occupancy} capacity={a.capacity} />
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold tabular-nums leading-none ${i === 0 ? 'text-brand-700' : 'text-slate-900'}`}>
                    {formatEta(a.etaSeconds)}
                  </div>
                  {i === 0 && <div className="mt-1 text-[11px] font-medium text-brand-600">ən yaxın</div>}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-slate-400">ETA xəttin sıxlığına görə düzəldilir · hər 5 saniyədə yenilənir</p>
        </div>
      )}
    </section>
  );
}
