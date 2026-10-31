import { useMemo, useState } from 'react';
import { Bus, Route as RouteIcon } from 'lucide-react';
import TransitMap from '../components/TransitMap.jsx';
import RouteSelector, { RouteNumber } from '../components/RouteSelector.jsx';
import StopEtaPanel from '../components/StopEtaPanel.jsx';
import ReportPanel from '../components/ReportPanel.jsx';
import LevelBadge from '../components/LevelBadge.jsx';
import PassengerLayout from '../layouts/PassengerLayout.jsx';
import { useTransitData } from '../hooks/useTransitData.js';
import { useAuth } from '../context/AuthContext.jsx';

function SelectedRouteCard({ route, busCount, level }) {
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
      <RouteNumber route={route} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{route.name}</p>
        <p className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <RouteIcon className="h-3 w-3" /> {(route.lengthM / 1000).toFixed(1)} km
          </span>
          <span className="inline-flex items-center gap-1">
            <Bus className="h-3 w-3" /> {busCount} avtobus xəttdə
          </span>
        </p>
      </div>
      <LevelBadge level={level} />
    </div>
  );
}

export default function Passenger() {
  const { user } = useAuth();
  const { routes, buses, densityByRoute, loading, error } = useTransitData();
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedStopId, setSelectedStopId] = useState(null);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;
  const visibleRoutes = selectedRoute ? [selectedRoute] : routes;
  const visibleBuses = selectedRoute ? buses.filter((b) => b.routeId === selectedRoute.id) : buses;

  const stops = useMemo(() => {
    if (selectedRoute) return selectedRoute.stops;
    const unique = new Map();
    routes.forEach((r) => r.stops.forEach((s) => unique.set(s.id, s)));
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, 'az'));
  }, [routes, selectedRoute]);

  const selectRoute = (routeId) => {
    setSelectedRouteId(routeId);
    const route = routes.find((r) => r.id === routeId);
    if (route && !route.stops.some((s) => s.id === selectedStopId)) setSelectedStopId(null);
  };

  const firstName = user?.name.split(' ')[0];

  return (
    <PassengerLayout>
      <div className="flex h-full flex-col lg:block">
        <div className="h-[42vh] shrink-0 lg:absolute lg:inset-0 lg:h-auto">
          <TransitMap
            routes={visibleRoutes}
            buses={visibleBuses}
            selectedStopId={selectedStopId}
            onSelectStop={(stop) => setSelectedStopId(stop.id)}
            fitPadding={[440, 40]}
          />
        </div>

        <aside className="relative z-[500] -mt-5 min-h-0 flex-1 overflow-y-auto rounded-t-3xl bg-slate-50 px-4 pb-6 pt-5 shadow-float lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:mt-0 lg:w-[410px] lg:flex-none lg:rounded-3xl lg:bg-slate-50/95 lg:backdrop-blur">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-300 lg:hidden" aria-hidden />

          <div className="mb-4">
            <p className="text-sm text-slate-500">Salam, {firstName}</p>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Hara gedirsiniz?</h1>
          </div>

          {loading && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200/70" />
              ))}
            </div>
          )}
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {!loading && !error && (
            <div className="space-y-3">
              <section className="card p-4">
                <h2 className="mb-3 font-semibold text-slate-900">Marşrut</h2>
                <RouteSelector
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelect={selectRoute}
                  densityByRoute={densityByRoute}
                />
                {selectedRoute && (
                  <SelectedRouteCard
                    route={selectedRoute}
                    busCount={visibleBuses.length}
                    level={densityByRoute[selectedRoute.id]}
                  />
                )}
              </section>

              <StopEtaPanel
                route={selectedRoute}
                stops={stops}
                selectedStopId={selectedStopId}
                onSelectStop={setSelectedStopId}
                routeId={selectedRouteId}
              />

              <ReportPanel
                key={selectedRouteId ?? 'none'}
                route={selectedRoute}
                buses={visibleBuses}
                stopId={selectedStopId}
              />
            </div>
          )}
        </aside>
      </div>
    </PassengerLayout>
  );
}
