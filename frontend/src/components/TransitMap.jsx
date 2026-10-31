import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import { LEVEL_META, occupancyLevel } from '../utils/format.js';

const BAKU_CENTER = [40.395, 49.87];

function busIcon(bus, route) {
  const level = occupancyLevel(bus.occupancy, bus.capacity);
  return L.divIcon({
    className: '',
    iconSize: [38, 26],
    iconAnchor: [19, 13],
    html: `<div style="background:${route?.color ?? '#334155'};box-shadow:0 0 0 3px ${LEVEL_META[level].color}, 0 4px 10px rgba(15,23,42,.35)"
      class="flex h-[26px] w-[38px] items-center justify-center gap-0.5 rounded-lg border-2 border-white text-[11px] font-bold text-white">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M8 6v6M16 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
      ${route?.number ?? ''}</div>`,
  });
}

/** Zoom to the given routes whenever the selection changes. */
function FitBounds({ routes, padding }) {
  const map = useMap();
  const key = routes.map((r) => r.id).join(',');
  useEffect(() => {
    const points = routes.flatMap((r) => r.path);
    if (points.length === 0) return;
    const wide = window.matchMedia('(min-width: 1024px)').matches;
    map.fitBounds(points, {
      paddingTopLeft: wide && padding ? padding : [24, 24],
      paddingBottomRight: [24, 24],
      maxZoom: 14,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

/**
 * @param routes         routes to draw ({ id, number, color, path, stops })
 * @param buses          live buses to show
 * @param routeColors    optional { routeId: color } override (operator density colouring)
 * @param selectedStopId highlighted stop
 * @param onSelectStop   called with a stop when its marker is clicked
 * @param fitPadding     [x, y] top-left padding on wide screens (room for a floating panel)
 */
export default function TransitMap({ routes, buses, routeColors = {}, selectedStopId, onSelectStop, fitPadding, className = '' }) {
  const routeById = useMemo(() => new Map(routes.map((r) => [r.id, r])), [routes]);
  const stops = useMemo(() => {
    const unique = new Map();
    routes.forEach((r) => r.stops.forEach((s) => unique.set(s.id, s)));
    return [...unique.values()];
  }, [routes]);

  return (
    <MapContainer center={BAKU_CENTER} zoom={12} zoomControl={false} className={`z-0 h-full w-full ${className}`} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <FitBounds routes={routes} padding={fitPadding} />

      {routes.map((route) => (
        <Polyline
          key={`casing-${route.id}`}
          positions={route.path}
          pathOptions={{ color: '#ffffff', weight: routeColors[route.id] ? 11 : 9, opacity: 0.9 }}
        />
      ))}
      {routes.map((route) => (
        <Polyline
          key={route.id}
          positions={route.path}
          pathOptions={{ color: routeColors[route.id] ?? route.color, weight: routeColors[route.id] ? 7 : 5, opacity: 0.9 }}
        >
          <Tooltip sticky>
            <span className="font-semibold">№{route.number}</span> · {route.name}
          </Tooltip>
        </Polyline>
      ))}

      {stops.map((stop) => {
        const selected = stop.id === selectedStopId;
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={selected ? 10 : 6}
            pathOptions={{
              color: selected ? '#1d5ef1' : '#0f172a',
              fillColor: selected ? '#ffffff' : '#ffffff',
              fillOpacity: 1,
              weight: selected ? 4 : 2,
            }}
            eventHandlers={{ click: () => onSelectStop?.(stop) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <span className="font-medium">{stop.name}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}

      {buses.map((bus) => {
        const route = routeById.get(bus.routeId);
        if (!route) return null;
        const level = occupancyLevel(bus.occupancy, bus.capacity);
        return (
          <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon(bus, route)}>
            <Tooltip direction="top" offset={[0, -12]}>
              <div className="text-xs">
                <div className="font-semibold">
                  №{route.number} · {bus.plate}
                </div>
                <div>
                  Doluluq: {Math.round((bus.occupancy / bus.capacity) * 100)}% · {LEVEL_META[level].label}
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
