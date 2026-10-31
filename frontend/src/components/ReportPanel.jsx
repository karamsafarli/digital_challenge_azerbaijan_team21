import { useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import { getClientId, LEVEL_META, LEVELS } from '../utils/format.js';

const BUTTON_STYLES = {
  LOW: 'bg-green-600 hover:bg-green-700',
  MEDIUM: 'bg-amber-500 hover:bg-amber-600',
  HIGH: 'bg-red-600 hover:bg-red-700',
};

/** Passenger crowd report: pick a bus (optional) and tap Aşağı / Orta / Yüksək. */
export default function ReportPanel({ route, buses, stopId }) {
  const [busId, setBusId] = useState('');
  const [status, setStatus] = useState(null); // { type: 'ok' | 'error', text }
  const [sending, setSending] = useState(false);

  if (!route) {
    return (
      <section className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
        Sıxlıq bildirmək üçün əvvəlcə marşrut seçin.
      </section>
    );
  }

  const send = async (level) => {
    setSending(true);
    setStatus(null);
    try {
      const { density } = await api.createReport({
        routeId: route.id,
        level,
        busId: busId ? Number(busId) : undefined,
        stopId: stopId && route.stops.some((s) => s.id === stopId) ? stopId : undefined,
        clientId: getClientId(),
      });
      setStatus({
        type: 'ok',
        text: `Təşəkkürlər! Bildirişiniz qeydə alındı. Xətt №${route.number} üzrə cari sıxlıq: ${LEVEL_META[density.level].label}.`,
      });
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err) });
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-base font-semibold">Sıxlığı bildir · №{route.number}</h2>
      <p className="mb-3 text-xs text-slate-500">Avtobusda və ya dayanacaqda nə qədər sıxlıq var?</p>

      <label className="mb-1 block text-xs font-medium text-slate-500" htmlFor="bus-select">
        Avtobus (istəyə görə)
      </label>
      <select
        id="bus-select"
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        value={busId}
        onChange={(e) => setBusId(e.target.value)}
      >
        <option value="">Bütün xətt üzrə</option>
        {buses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.plate}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-2">
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            disabled={sending}
            onClick={() => send(level)}
            className={`rounded-lg px-2 py-3 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${BUTTON_STYLES[level]}`}
          >
            {LEVEL_META[level].label}
          </button>
        ))}
      </div>

      {status && (
        <p
          role="status"
          className={`mt-3 rounded p-2 text-sm ${status.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}
