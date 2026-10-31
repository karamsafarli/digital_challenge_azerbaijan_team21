import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Bus, History, Repeat, Undo2, Warehouse } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import DispatchDialog from '../../components/DispatchDialog.jsx';
import LevelBadge from '../../components/LevelBadge.jsx';
import StatCard from '../../components/StatCard.jsx';
import { useOperator } from '../../context/OperatorContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocket.js';
import { formatTime } from '../../utils/format.js';

const ACTION_META = {
  RESERVE_DISPATCH: { label: 'Depodan göndərildi', icon: Warehouse, className: 'bg-brand-50 text-brand-700' },
  REBALANCE: { label: 'Xətlər arası köçürmə', icon: Repeat, className: 'bg-purple-50 text-purple-700' },
  RETURN_TO_DEPOT: { label: 'Depoya qaytarıldı', icon: Undo2, className: 'bg-slate-100 text-slate-700' },
};

function RouteBadge({ route }) {
  if (!route) return <span className="text-xs font-medium text-slate-500">Depo</span>;
  return (
    <span className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 text-xs font-bold text-white" style={{ backgroundColor: route.color }}>
      {route.number}
    </span>
  );
}

export default function Fleet() {
  const toast = useToast();
  const { buses, density } = useOperator();
  const [fleet, setFleet] = useState(null);
  const [error, setError] = useState(null);
  const [dispatchTo, setDispatchTo] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    api
      .fleet()
      .then((data) => {
        setFleet(data);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(load, [load]);
  useSocketEvent('fleet:update', load);

  const levelByRoute = Object.fromEntries(density.map((d) => [d.routeId, d.level]));

  const sendToDepot = async (bus) => {
    try {
      await api.returnToDepot(bus.id);
      toast.info(`${bus.plate} depoya qaytarıldı`);
      load();
    } catch (err) {
      toast.error('Əməliyyat alınmadı', errorMessage(err));
    }
  };

  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!fleet) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />;

  const inService = fleet.routes.reduce((s, r) => s + r.busCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Bus} label="Xəttdə avtobus" value={inService} tone="brand" />
        <StatCard icon={Warehouse} label="Depoda ehtiyat" value={fleet.reserve.length} tone={fleet.reserve.length ? 'green' : 'red'} hint={fleet.reserve.map((b) => b.plate).join(', ') || 'Ehtiyat qalmayıb'} />
        <StatCard icon={History} label="Son əməliyyatlar" value={fleet.actions.length} tone="slate" hint="Dispetçer jurnalı" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card p-5">
          <h2 className="mb-1 font-semibold text-slate-900">Xətlər üzrə park</h2>
          <p className="mb-4 text-xs text-slate-500">
            Sıx xəttə depodan və ya sakit xətdən avtobus göndərin. Hər xəttdə ən azı {fleet.minBusesPerRoute} avtobus qalır.
          </p>
          <ul className="divide-y divide-slate-100">
            {fleet.routes.map((r) => {
              const routeBuses = buses.filter((b) => b.routeId === r.routeId);
              const open = expanded === r.routeId;
              return (
                <li key={r.routeId} className="py-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-10 w-12 items-center justify-center rounded-xl font-bold text-white shadow-sm" style={{ backgroundColor: r.color }}>
                      {r.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {r.busCount} avtobus · orta doluluq {Math.round(r.avgOccupancy * 100)}%
                      </p>
                    </div>
                    <LevelBadge level={levelByRoute[r.routeId] ?? r.level} />
                    <button type="button" className="btn-ghost px-2.5 py-1.5 text-xs" onClick={() => setExpanded(open ? null : r.routeId)}>
                      {open ? 'Gizlət' : 'Avtobuslar'}
                    </button>
                    <button type="button" className="btn-primary px-3 py-1.5 text-xs" onClick={() => setDispatchTo(r.routeId)}>
                      <Bus className="h-3.5 w-3.5" /> Avtobus göndər
                    </button>
                  </div>
                  {open && (
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {routeBuses.map((b) => (
                        <li key={b.id} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200/70">
                          <span className="font-medium text-slate-800">{b.plate}</span>
                          <span className="text-xs text-slate-500">{Math.round((b.occupancy / b.capacity) * 100)}% dolu</span>
                          <button
                            type="button"
                            className="ml-auto rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-40"
                            disabled={r.busCount <= fleet.minBusesPerRoute}
                            onClick={() => sendToDepot(b)}
                            title={r.busCount <= fleet.minBusesPerRoute ? 'Minimum avtobus sayı' : 'Depoya qaytar'}
                          >
                            <Undo2 className="inline h-3.5 w-3.5" /> Depoya
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="card p-5 xl:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
            <History className="h-4 w-4 text-brand-600" /> Dispetçer jurnalı
          </h2>
          {fleet.actions.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">Hələ əməliyyat yoxdur</p>
          ) : (
            <ol className="space-y-3">
              {fleet.actions.map((a) => {
                const meta = ACTION_META[a.type] ?? ACTION_META.REBALANCE;
                const Icon = meta.icon;
                return (
                  <li key={a.id} className="flex gap-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.className}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-medium text-slate-900">{meta.label}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{a.bus.plate}</span>
                        <RouteBadge route={a.fromRoute} /> <ArrowRight className="h-3 w-3" /> <RouteBadge route={a.toRoute} />
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {formatTime(a.createdAt)} · {a.operator?.name ?? '—'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      {dispatchTo && <DispatchDialog routeId={dispatchTo} onClose={() => setDispatchTo(null)} onDone={load} />}
    </div>
  );
}
