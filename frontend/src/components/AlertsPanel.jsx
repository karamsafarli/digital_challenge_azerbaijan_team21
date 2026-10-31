import { useState } from 'react';
import { api, errorMessage } from '../api/client.js';
import { formatTime } from '../utils/format.js';

const STATUS_META = {
  OPEN: { label: 'Yeni', className: 'bg-red-600 text-white' },
  ACKNOWLEDGED: { label: 'Qəbul edilib', className: 'bg-amber-100 text-amber-800' },
};

function AlertItem({ alert, highlighted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const update = async (status) => {
    setBusy(true);
    setError(null);
    try {
      await api.updateAlert(alert.id, status); // list updates via the alert:updated socket event
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const meta = STATUS_META[alert.status];
  return (
    <li
      className={`rounded-lg border p-3 ${
        alert.status === 'OPEN' ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'
      } ${highlighted ? 'animate-pulse' : ''}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="inline-flex min-w-[2.5rem] justify-center rounded-md px-1.5 py-0.5 text-sm font-bold text-white"
          style={{ backgroundColor: alert.route?.color }}
        >
          {alert.route?.number}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta?.className}`}>{meta?.label}</span>
        <span className="ml-auto text-xs text-slate-500">{formatTime(alert.createdAt)}</span>
      </div>
      <p className="text-sm font-medium text-slate-900">{alert.message}</p>
      {alert.details && (
        <p className="mt-1 text-xs text-slate-500">
          {alert.details.highReportCount} Yüksək bildiriş · sıxlıq indeksi {Math.round(alert.details.score * 100)}% ·
          orta doluluq {Math.round(alert.details.avgOccupancy * 100)}%
          {alert.details.highSince && ` · ${formatTime(alert.details.highSince)}-dan bəri Yüksək`}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        {alert.status === 'OPEN' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => update('ACKNOWLEDGED')}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Qəbul et
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => update('RESOLVED')}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Əlavə avtobus ayrıldı · Bağla
        </button>
      </div>
    </li>
  );
}

export default function AlertsPanel({ alerts, highlightId }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">Anomaliya xəbərdarlıqları</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{alerts.length} aktiv</span>
      </div>
      {alerts.length === 0 ? (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Aktiv xəbərdarlıq yoxdur.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} highlighted={alert.id === highlightId} />
          ))}
        </ul>
      )}
    </section>
  );
}
