import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import { LEVEL_META, occupancyLevel } from '../utils/format.js';

const BAKU_CENTER = [40.395, 49.87];

function busIcon(bus, route) {
  const level = occupancyLevel(bus.occupancy, bus.capacity);
  return L.divIcon({
    className: '',
    iconSize: [34, 22],
    iconAnchor: [17, 11],
    html: `<div style="background:${route?.color ?? '#334155'};border:3px solid ${LEVEL_META[level].color}"
      class="flex h-[22px] w-[34px] items-center justify-center rounded-md text-[11px] font-bold text-white shadow">
      ${route?.number ?? ''}</div>`,
  });
}

/** Zoom to the selected route (or all routes) when the selection changes. */
function FitBounds({ routes }) {
  const map = useMap();
  const key = routes.map((r) => r.id).join(',');
  useEffect(() => {
    const points = routes.flatMap((r) => r.path);
    if (points.length > 0) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/**
 * @param routes        routes to draw ({ id, number, color, path, stops })
 * @param buses         live buses to show
 * @param routeColors   optional { routeId: color } override (operator density colouring)
 * @param selectedStopId highlighted stop
 * @param onSelectStop  called with a stop when its marker is clicked
 */
export default function TransitMap({ routes, buses, routeColors = {}, selectedStopId, onSelectStop, className = '' }) {
  const routeById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);
  const stops = useMemo(() => {
    const unique = new Map();
    routes.forEach((r) => r.stops.forEach((s) => unique.set(s.id, s)));
    return [...unique.values()];
  }, [routes]);

  return (
    <MapContainer center={BAKU_CENTER} zoom={12} className={`z-0 h-full w-full ${className}`} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds routes={routes} />

      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.path}
          pathOptions={{ color: routeColors[route.id] ?? route.color, weight: routeColors[route.id] ? 7 : 5, opacity: 0.8 }}
        >
          <Tooltip sticky>
            №{route.number} · {route.name}
          </Tooltip>
        </Polyline>
      ))}

      {stops.map((stop) => {
        const selected = stop.id === selectedStopId;
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={selected ? 9 : 6}
            pathOptions={{
              color: selected ? '#1d4ed8' : '#0f172a',
              fillColor: selected ? '#3b82f6' : '#ffffff',
              fillOpacity: 1,
              weight: selected ? 3 : 2,
            }}
            eventHandlers={{ click: () => onSelectStop?.(stop) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              {stop.name}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {buses.map((bus) => {
        const route = routeById.get(bus.routeId);
        if (!route) return null;
        return (
          <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon(bus, route)}>
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs">
                <div className="font-semibold">
                  №{route.number} · {bus.plate}
                </div>
                <div>
                  Doluluq: {bus.occupancy}/{bus.capacity} · {LEVEL_META[occupancyLevel(bus.occupancy, bus.capacity)].label}
                </div>
                <div>Sürət: {Math.round(bus.speedKmh)} km/s</div>
              </div>
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
