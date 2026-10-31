import { useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import LevelBadge from './LevelBadge.jsx';
import Sparkline from './Sparkline.jsx';
import { formatTime, LEVEL_META } from '../utils/format.js';

function RushButton({ row, onChanged }) {
  const [busy, setBusy] = useState(false);
  const active = Boolean(row.rushUntil);

  const toggle = async () => {
    setBusy(true);
    try {
      if (active) await api.cancelRush(row.routeId);
      else await api.simulateRush(row.routeId);
      await onChanged();
    } catch (err) {
      window.alert(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      disabled={busy}
      onClick={toggle}
      aria-label={active ? `Xətt ${row.routeNumber}: pik saat ssenarisini dayandır` : `Xətt ${row.routeNumber}: pik saat ssenarisini başlat`}
      title={active ? `Ssenari ${formatTime(row.rushUntil)}-dək aktivdir` : 'Pik saat ssenarisini başlat (demo)'}
      className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50 ${
        active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {active ? '■ Dayandır' : '▶ Pik saat'}
    </button>
  );
}

/** Live per-route density list, busiest first. */
export default function DensityTable({ density, stats, onChanged }) {
  const timelineByRoute = new Map(stats.map((s) => [s.routeId, s]));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Xətlər üzrə sıxlıq</h2>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">Xətt</th>
              <th className="py-2 pr-2">Səviyyə</th>
              <th className="py-2 pr-2">İndeks</th>
              <th className="py-2 pr-2">Son 30 dəq</th>
              <th className="py-2 pr-2 text-right">Bildiriş</th>
              <th className="py-2 pr-2 text-right">Doluluq</th>
              <th className="py-2 text-right">Demo</th>
            </tr>
          </thead>
          <tbody>
            {density.map((row) => {
              const stat = timelineByRoute.get(row.routeId);
              return (
                <tr key={row.routeId} className={`border-b last:border-0 ${row.level === 'HIGH' ? 'bg-red-50/60' : ''}`}>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 font-bold text-white"
                        style={{ backgroundColor: row.color }}
                      >
                        {row.routeNumber}
                      </span>
                      <span className="hidden truncate text-slate-600 xl:inline">{row.routeName}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="py-2 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round(row.score * 100)}%`, backgroundColor: LEVEL_META[row.level].color }}
                        />
                      </div>
                      <span className="tabular-nums text-slate-600">{Math.round(row.score * 100)}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-2">
                    <Sparkline points={stat?.timeline} />
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums" title="Son 15 dəqiqədə sərnişin bildirişləri">
                    {row.reportCount}
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums">{Math.round(row.avgOccupancy * 100)}%</td>
                  <td className="py-2 text-right">
                    <RushButton row={row} onChanged={onChanged} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
