import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertTriangle, BellRing, Bus, Info, Map as MapIcon, MessageSquareText } from 'lucide-react';
import TransitMap from '../../components/TransitMap.jsx';
import AlertsPanel from '../../components/AlertsPanel.jsx';
import DensityTable from '../../components/DensityTable.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useOperator } from '../../context/OperatorContext.jsx';
import { LEVEL_META } from '../../utils/format.js';

export default function Overview() {
  const { routes, buses, density, alerts, stats, config, error, refresh, banner } = useOperator();
  const location = useLocation();

  // Support links like /operator#alerts from the new-alert banner
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth' });
  }, [location.hash]);

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
    <>
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
              «Əlavə avtobus ehtiyatı ayrılmalıdır» xəbərdarlığı yaranır.
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
    </>
  );
}
