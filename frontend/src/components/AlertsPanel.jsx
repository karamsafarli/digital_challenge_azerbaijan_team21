import { useState } from 'react';
import { BellRing, Bus, CheckCheck, CheckCircle2, Clock3, Eye } from 'lucide-react';
import DispatchDialog from './DispatchDialog.jsx';
import { api, errorMessage } from '../api/client.js';
import { formatTime } from '../utils/format.js';

const STATUS_META = {
  OPEN: { label: 'Yeni', className: 'bg-red-600 text-white' },
  ACKNOWLEDGED: { label: 'İcradadır', className: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/20' },
};

function Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-white/70 px-2 py-1.5 text-center ring-1 ring-slate-900/5">
      <div className="text-sm font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function AlertItem({ alert, highlighted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dispatching, setDispatching] = useState(false);

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

  const open = alert.status === 'OPEN';
  const meta = STATUS_META[alert.status];
  return (
    <li
      className={`animate-fade-in rounded-2xl p-4 ring-1 ${open ? 'bg-red-50 ring-red-200' : 'bg-amber-50/50 ring-amber-200'} ${
        highlighted ? 'ring-2 ring-red-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 min-w-[2.75rem] items-center justify-center rounded-lg px-1.5 text-sm font-bold text-white shadow-sm"
          style={{ backgroundColor: alert.route?.color }}
        >
          {alert.route?.number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{alert.route?.name}</p>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <Clock3 className="h-3 w-3" /> {formatTime(alert.createdAt)}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta?.className}`}>{meta?.label}</span>
      </div>

      <p className="mt-3 text-sm font-medium leading-snug text-slate-800">{alert.message}</p>

      {alert.details && (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Yüksək bildiriş" value={alert.details.highReportCount} />
          <Metric label="Sıxlıq indeksi" value={`${Math.round(alert.details.score * 100)}%`} />
          <Metric label="Doluluq" value={`${Math.round(alert.details.avgOccupancy * 100)}%`} />
        </div>
      )}
      {alert.details?.highSince && (
        <p className="mt-2 text-xs text-slate-500">{formatTime(alert.details.highSince)}-dan bəri fasiləsiz Yüksək</p>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => setDispatching(true)} className="btn-primary px-3 py-1.5 text-xs">
          <Bus className="h-3.5 w-3.5" /> Avtobus göndər
        </button>
        {open && (
          <button type="button" disabled={busy} onClick={() => update('ACKNOWLEDGED')} className="btn-secondary px-3 py-1.5 text-xs">
            <Eye className="h-3.5 w-3.5" /> Qəbul et
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => update('RESOLVED')}
          className="btn-ghost px-3 py-1.5 text-xs"
          title="Əlavə tədbir görülmədən bağla"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Bağla
        </button>
      </div>
      {alert.details?.resolution && (
        <p className="mt-2 text-xs text-green-700">Həll: {alert.details.resolution.busPlate}</p>
      )}
      {dispatching && <DispatchDialog routeId={alert.routeId} onClose={() => setDispatching(false)} />}
    </li>
  );
}

export default function AlertsPanel({ alerts, highlightId }) {
  return (
    <section id="alerts" className="card scroll-mt-24 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <BellRing className="h-4 w-4 text-red-500" /> Anomaliya xəbərdarlıqları
        </h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${alerts.length ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
          {alerts.length} aktiv
        </span>
      </div>
      {alerts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl bg-slate-50 px-4 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
          <p className="mt-2 font-semibold text-slate-900">Hər şey qaydasındadır</p>
          <p className="mt-1 text-sm text-slate-500">Hazırda əlavə avtobus tələb edən xətt yoxdur.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} highlighted={alert.id === highlightId} />
          ))}
        </ul>
      )}
    </section>
  );
}
