import { useState } from 'react';
import { Megaphone, User } from 'lucide-react';
import { api, errorMessage } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { useHorizontalWheel } from '../hooks/useHorizontalWheel.js';
import { LEVEL_META, LEVELS } from '../utils/format.js';

const TILES = {
  LOW: { people: 1, hint: 'Boş yerlər var', idle: 'hover:bg-green-50 hover:ring-green-300', icon: 'text-green-600' },
  MEDIUM: { people: 2, hint: 'Ayaqda durmaq olar', idle: 'hover:bg-amber-50 hover:ring-amber-300', icon: 'text-amber-600' },
  HIGH: { people: 3, hint: 'Çox sıxdır', idle: 'hover:bg-red-50 hover:ring-red-300', icon: 'text-red-600' },
};

function CrowdIcon({ count, className }) {
  return (
    <span className={`flex -space-x-2 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <User key={i} className="h-6 w-6 rounded-full bg-white" strokeWidth={2.5} />
      ))}
    </span>
  );
}

/** Passenger crowd report: pick a bus (optional) and tap one of three levels. */
export default function ReportPanel({ route, buses, stopId }) {
  const toast = useToast();
  const [busId, setBusId] = useState(null);
  const [sending, setSending] = useState(null);
  const [lastSent, setLastSent] = useState(null);
  const chipsRef = useHorizontalWheel();

  if (!route) {
    return (
      <section className="card flex items-center gap-3 p-4 text-sm text-slate-500">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
          <Megaphone className="h-5 w-5 text-slate-400" />
        </span>
        Avtobusun nə qədər dolu olduğunu bildirmək üçün yuxarıdan marşrut seçin.
      </section>
    );
  }

  const send = async (level) => {
    setSending(level);
    try {
      const { density } = await api.createReport({
        routeId: route.id,
        level,
        busId: busId ?? undefined,
        stopId: stopId && route.stops.some((s) => s.id === stopId) ? stopId : undefined,
      });
      setLastSent(level);
      toast.success('Təşəkkürlər! Bildirişiniz qeydə alındı', `Xətt №${route.number} üzrə cari sıxlıq: ${LEVEL_META[density.level].label}`);
    } catch (err) {
      toast.error('Bildiriş göndərilmədi', errorMessage(err));
    } finally {
      setSending(null);
    }
  };

  const chip = (active) =>
    `shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 transition ${
      active ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-300'
    }`;

  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Megaphone className="h-4 w-4 text-brand-600" /> Avtobus nə qədər doludur?
      </h2>
      <p className="mt-1 text-xs text-slate-500">Bildirişiniz digər sərnişinlərə və dispetçerlərə kömək edir.</p>

      {buses.length > 0 && (
        <div ref={chipsRef} className="scrollbar-none -mx-1 mt-3 flex select-none gap-1.5 overflow-x-auto px-1 py-0.5">
          <button type="button" className={chip(busId === null)} onClick={() => setBusId(null)}>
            Bütün xətt
          </button>
          {buses.map((b) => (
            <button key={b.id} type="button" className={chip(busId === b.id)} onClick={() => setBusId(b.id)}>
              {b.plate}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {LEVELS.map((level) => {
          const tile = TILES[level];
          const sent = lastSent === level;
          return (
            <button
              key={level}
              type="button"
              disabled={sending !== null}
              onClick={() => send(level)}
              className={`flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 ring-1 transition active:scale-95 disabled:opacity-60 ${
                sent ? 'ring-2' : `ring-slate-200 ${tile.idle}`
              }`}
              style={sent ? { '--tw-ring-color': LEVEL_META[level].color } : undefined}
            >
              <CrowdIcon count={tile.people} className={tile.icon} />
              <span className="text-sm font-semibold text-slate-900">{sending === level ? '...' : LEVEL_META[level].label}</span>
              <span className="text-[11px] leading-tight text-slate-500">{tile.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
