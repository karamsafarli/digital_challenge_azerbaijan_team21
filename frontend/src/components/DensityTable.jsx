import { useState } from 'react';
import { Gauge, Play, Square } from 'lucide-react';
import { api, errorMessage } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import LevelBadge from './LevelBadge.jsx';
import Sparkline from './Sparkline.jsx';
import { formatTime, LEVEL_META } from '../utils/format.js';

function RushButton({ row, onChanged }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const active = Boolean(row.rushUntil);

  const toggle = async () => {
    setBusy(true);
    try {
      if (active) {
        await api.cancelRush(row.routeId);
        toast.info(`Xətt №${row.routeNumber}`, 'Pik saat ssenarisi dayandırıldı');
      } else {
        const res = await api.simulateRush(row.routeId);
        toast.info(`Xətt №${row.routeNumber}: pik saat başladı`, res.message);
      }
      await onChanged();
    } catch (err) {
      toast.error('Əməliyyat alınmadı', errorMessage(err));
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
      className={`btn whitespace-nowrap px-2.5 py-1.5 text-xs ${
        active ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {active ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
      <span className="hidden 2xl:inline">{active ? 'Dayandır' : 'Pik saat'}</span>
    </button>
  );
}

/** Live per-route density list, busiest first. */
export default function DensityTable({ density, stats, onChanged }) {
  const timelineByRoute = new Map(stats.map((s) => [s.routeId, s]));

  return (
    <section id="density" className="card scroll-mt-24 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Gauge className="h-4 w-4 text-brand-600" /> Xətlər üzrə sıxlıq
        </h2>
        <span className="text-xs text-slate-500">Ən sıx xətlər yuxarıda · canlı</span>
      </div>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[540px] text-sm">
          <thead>
            <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <th className="py-2.5 pl-5 pr-2">Xətt</th>
              <th className="py-2.5 pr-2">Səviyyə</th>
              <th className="py-2.5 pr-2">Sıxlıq indeksi</th>
              <th className="py-2.5 pr-2">Son 30 dəqiqə</th>
              <th className="py-2.5 pr-2 text-right">Bildiriş</th>
              <th className="py-2.5 pr-2 text-right">Doluluq</th>
              <th className="py-2.5 pr-5 text-right">Demo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {density.map((row) => {
              const stat = timelineByRoute.get(row.routeId);
              const pct = Math.round(row.score * 100);
              return (
                <tr key={row.routeId} className={`transition ${row.level === 'HIGH' ? 'bg-red-50/50' : 'hover:bg-slate-50/60'}`}>
                  <td className="py-3 pl-5 pr-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-lg px-1.5 font-bold text-white shadow-sm"
                        style={{ backgroundColor: row.color }}
                      >
                        {row.routeNumber}
                      </span>
                      <span className="hidden max-w-[180px] truncate text-slate-600 2xl:inline">{row.routeName}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <LevelBadge level={row.level} />
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-14 overflow-hidden rounded-full bg-slate-100 2xl:w-20">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: LEVEL_META[row.level].color }} />
                      </div>
                      <span className="w-9 tabular-nums text-slate-700">{pct}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <Sparkline points={stat?.timeline} />
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums text-slate-700" title="Son 15 dəqiqədə sərnişin bildirişləri">
                    {row.reportCount}
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums text-slate-700">{Math.round(row.avgOccupancy * 100)}%</td>
                  <td className="py-3 pr-5 text-right">
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
