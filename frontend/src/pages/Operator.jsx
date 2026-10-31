import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Bus, Info, Map as MapIcon, MessageSquareText, X } from 'lucide-react';
import TransitMap from '../components/TransitMap.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import DensityTable from '../components/DensityTable.jsx';
import OperatorLayout from '../layouts/OperatorLayout.jsx';
import { useTransitData } from '../hooks/useTransitData.js';
import { useOperatorData } from '../hooks/useOperatorData.js';
import { LEVEL_META } from '../utils/format.js';

const TONES = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  brand: 'bg-brand-50 text-brand-600',
};

function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONES[tone]}`}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">{value}</div>
        <div className="truncate text-sm text-slate-500">{label}</div>
        {hint && <div className="truncate text-xs text-slate-400">{hint}</div>}
      </div>
    </div>
  );
}

function NewAlertBanner({ alert, onClose }) {
  return (
    <div role="alert" className="fixed inset-x-4 top-4 z-[2000] mx-auto max-w-xl animate-slide-down">
      <div className="flex items-start gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-float ring-1 ring-red-700">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Yeni anomaliya · Xətt №{alert.route?.number}</p>
          <p className="mt-0.5 text-sm text-red-50">{alert.message}</p>
          <a href="#alerts" onClick={onClose} className="mt-2 inline-block text-sm font-semibold underline underline-offset-2">
            Xəbərdarlığa keç
          </a>
        </div>
        <button type="button" onClick={onClose} className="text-white/80 hover:text-white" aria-label="Bağla">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function Operator() {
  const { routes, buses } = useTransitData();
  const [banner, setBanner] = useState(null);
  const { density, alerts, stats, config, error, refresh } = useOperatorData({ onNewAlert: setBanner });

  useEffect(() => {
    if (!banner) return undefined;
    const timer = setTimeout(() => setBanner(null), 12000);
    return () => clearTimeout(timer);
  }, [banner]);

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
    <OperatorLayout badges={{ alerts: alerts.length }}>
      {banner && <NewAlertBanner alert={banner} onClose={() => setBanner(null)} />}

      <section id="overview" className="scroll-mt-24">
        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={BellRing}
            label="Aktiv xəbərdarlıq"
            value={alerts.length}
            hint={alerts.length ? 'Əlavə avtobus tələb olunur' : 'Hamısı qaydasındadır'}
            tone={alerts.length ? 'red' : 'green'}
          />
          <StatCard
            icon={AlertTriangle}
            label="Yüksək sıxlıqlı xətt"
            value={`${highRoutes} / ${density.length}`}
            hint="Real vaxt analitikası"
            tone={highRoutes ? 'amber' : 'green'}
          />
          <StatCard icon={MessageSquareText} label="Sərnişin bildirişi" value={reportsLastHour} hint="Son 1 saat" />
          <StatCard icon={Bus} label="Xəttdə avtobus" value={buses.length} hint={`Orta doluluq ${avgOccupancy}%`} />
        </div>

        {config && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl bg-brand-50 p-4 text-sm text-brand-900 ring-1 ring-inset ring-brand-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <p>
              <span className="font-semibold">Anomaliya qaydası:</span> xətt üzrə sıxlıq <b>{config.alertWindowMinutes} dəqiqə</b>{' '}
              fasiləsiz <b>Yüksək</b> qalarsa və bu müddətdə ən azı <b>{config.alertMinReports}</b> Yüksək bildiriş daxil olarsa,
              «Əlavə avtobus ehtiyatı ayrılmalıdır» xəbərdarlığı yaranır. Analitika hər 30 saniyədə yenilənir.
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-6">
          <DensityTable density={density} stats={stats} onChanged={refresh} />

          <section id="map" className="card scroll-mt-24 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <MapIcon className="h-4 w-4 text-brand-600" /> Sıxlıq xəritəsi
              </h2>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                {Object.entries(LEVEL_META).map(([level, meta]) => (
                  <span key={level} className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-5 rounded-full" style={{ backgroundColor: meta.color }} />
                    {meta.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="h-[460px]">
              <TransitMap routes={routes} buses={buses} routeColors={routeColors} />
            </div>
          </section>
        </div>

        <div className="order-first xl:order-none xl:sticky xl:top-24 xl:self-start">
          <AlertsPanel alerts={alerts} highlightId={banner?.id} />
        </div>
      </div>
    </OperatorLayout>
  );
}
