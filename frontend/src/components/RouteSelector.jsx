import { LEVEL_META } from '../utils/format.js';

export function RouteNumber({ route, size = 'md', className = '' }) {
  const sizes = { sm: 'h-6 min-w-[2.25rem] text-xs', md: 'h-8 min-w-[2.75rem] text-sm', lg: 'h-11 min-w-[3.5rem] text-lg' };
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg px-1.5 font-bold text-white shadow-sm ${sizes[size]} ${className}`}
      style={{ backgroundColor: route.color }}
    >
      {route.number}
    </span>
  );
}

/** Horizontal route pills with a live density dot. */
export default function RouteSelector({ routes, selectedRouteId, onSelect, densityByRoute }) {
  const pill = (active) =>
    `flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium ring-1 transition ${
      active ? 'bg-brand-600 text-white ring-brand-600 shadow-sm' : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300'
    }`;

  return (
    <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button type="button" className={pill(selectedRouteId === null)} onClick={() => onSelect(null)}>
        <span className="px-1.5">Hamısı</span>
      </button>
      {routes.map((route) => {
        const level = densityByRoute[route.id];
        const active = selectedRouteId === route.id;
        return (
          <button
            key={route.id}
            type="button"
            className={pill(active)}
            onClick={() => onSelect(route.id)}
            aria-pressed={active}
            aria-label={`Xətt ${route.number}${level ? `, sıxlıq ${LEVEL_META[level].label}` : ''}`}
          >
            <RouteNumber route={route} size="sm" />
            {level && (
              <span
                className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: LEVEL_META[level].color }}
                title={`Sıxlıq: ${LEVEL_META[level].label}`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
