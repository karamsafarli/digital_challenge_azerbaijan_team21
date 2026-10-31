import { useEffect, useMemo, useState } from 'react';
import TransitMap from '../components/TransitMap.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import DensityTable from '../components/DensityTable.jsx';
import { useTransitData } from '../hooks/useTransitData.js';
import { useOperatorData } from '../hooks/useOperatorData.js';
import { LEVEL_META } from '../utils/format.js';

function StatCard({ label, value, tone = 'slate' }) {
  const tones = {
    slate: 'text-slate-900',
    red: 'text-red-600',
    amber: 'text-amber-600',
    green: 'text-green-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
    </div>
  );
}

export default function Operator() {
  const { routes, buses } = useTransitData();
  const [toast, setToast] = useState(null);
  const { density, alerts, stats, config, error, refresh } = useOperatorData({ onNewAlert: setToast });

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Colour every route line on the map by its live density level
  const routeColors = useMemo(
    () => Object.fromEntries(density.map((d) => [d.routeId, LEVEL_META[d.level].color])),
    [density],
  );

  const highRoutes = density.filter((d) => d.level === 'HIGH').length;
  const reportsLastHour = stats.reduce(
    (sum, s) => sum + s.reportsLastHour.LOW + s.reportsLastHour.MEDIUM + s.reportsLastHour.HIGH,
    0,
  );
  const avgOccupancy = buses.length
    ? Math.round((buses.reduce((sum, b) => sum + b.occupancy / b.capacity, 0) / buses.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {toast && (
        <div
          role="alert"
          className="fixed inset-x-4 top-4 z-[1000] mx-auto max-w-xl rounded-xl border border-red-300 bg-red-600 p-4 text-white shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl" aria-hidden>
              ⚠
            </span>
            <div className="flex-1">
              <div className="font-semibold">Yeni anomaliya · Xətt №{toast.route?.number}</div>
              <div className="text-sm">{toast.message}</div>
            </div>
            <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white" aria-label="Bağla">
              ✕
            </button>
          </div>
        </div>
      )}

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Aktiv xəbərdarlıq" value={alerts.length} tone={alerts.length ? 'red' : 'green'} />
        <StatCard label="Yüksək sıxlıqlı xətt" value={`${highRoutes} / ${density.length}`} tone={highRoutes ? 'amber' : 'green'} />
        <StatCard label="Bildiriş (son 1 saat)" value={reportsLastHour} />
        <StatCard label="Orta doluluq · avtobus" value={`${avgOccupancy}% · ${buses.length}`} />
      </div>

      {config && (
        <p className="text-xs text-slate-500">
          Qayda: xətt üzrə sıxlıq <b>{config.alertWindowMinutes} dəqiqə</b> fasiləsiz <b>Yüksək</b> qalarsa və bu müddətdə ən
          azı <b>{config.alertMinReports}</b> Yüksək bildiriş daxil olarsa → «Əlavə avtobus ehtiyatı ayrılmalıdır». Analitika
          hər 30 saniyədən bir yenilənir.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <DensityTable density={density} stats={stats} onChanged={refresh} />
          <div className="h-[420px] overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <TransitMap routes={routes} buses={buses} routeColors={routeColors} />
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="font-medium">Xəritə: xəttin rəngi sıxlığı göstərir —</span>
            {Object.entries(LEVEL_META).map(([level, meta]) => (
              <span key={level} className="inline-flex items-center gap-1">
                <span className="h-1.5 w-5 rounded" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>
        <div>
          <AlertsPanel alerts={alerts} highlightId={toast?.id} />
        </div>
      </div>
    </div>
  );
}
