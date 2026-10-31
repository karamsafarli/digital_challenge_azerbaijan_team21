import { useMemo, useState } from 'react';
import TransitMap from '../components/TransitMap.jsx';
import RouteSelector from '../components/RouteSelector.jsx';
import StopEtaPanel from '../components/StopEtaPanel.jsx';
import ReportPanel from '../components/ReportPanel.jsx';
import { useTransitData } from '../hooks/useTransitData.js';

export default function Passenger() {
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
    // keep the stop only if the new route serves it
    if (route && !route.stops.some((s) => s.id === selectedStopId)) setSelectedStopId(null);
  };

  if (loading) return <p className="text-slate-500">Yüklənir...</p>;
  if (error) return <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <div className="order-2 space-y-4 lg:order-1">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">Marşrut</h2>
          <RouteSelector
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelect={selectRoute}
            densityByRoute={densityByRoute}
          />
        </section>
        <StopEtaPanel
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

      <div className="order-1 h-[55vh] overflow-hidden rounded-xl border border-slate-200 shadow-sm lg:order-2 lg:sticky lg:top-4 lg:h-[calc(100vh-7rem)]">
        <TransitMap
          routes={visibleRoutes}
          buses={visibleBuses}
          selectedStopId={selectedStopId}
          onSelectStop={(stop) => setSelectedStopId(stop.id)}
        />
      </div>
    </div>
  );
}
