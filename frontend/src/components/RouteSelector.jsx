import LevelBadge from './LevelBadge.jsx';

export function RouteNumber({ route, className = '' }) {
  return (
    <span
      className={`inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 text-sm font-bold text-white ${className}`}
      style={{ backgroundColor: route.color }}
    >
      {route.number}
    </span>
  );
}

export default function RouteSelector({ routes, selectedRouteId, onSelect, densityByRoute }) {
  const itemClass = (active) =>
    `flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
      active ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:bg-slate-50'
    }`;

  return (
    <div className="space-y-2">
      <button type="button" className={itemClass(selectedRouteId === null)} onClick={() => onSelect(null)}>
        <span className="inline-flex min-w-[2.5rem] justify-center rounded-md bg-slate-700 px-1.5 py-0.5 text-sm font-bold text-white">
          ∗
        </span>
        <span className="flex-1 font-medium">Bütün marşrutlar</span>
      </button>
      {routes.map((route) => (
        <button
          key={route.id}
          type="button"
          className={itemClass(selectedRouteId === route.id)}
          onClick={() => onSelect(route.id)}
        >
          <RouteNumber route={route} />
          <span className="flex-1 truncate">{route.name}</span>
          <LevelBadge level={densityByRoute[route.id]} />
        </button>
      ))}
    </div>
  );
}
