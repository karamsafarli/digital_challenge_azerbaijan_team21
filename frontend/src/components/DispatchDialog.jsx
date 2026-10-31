import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Bus, Repeat, Warehouse, X } from 'lucide-react';
import { api, errorMessage } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import LevelBadge from './LevelBadge.jsx';

/**
 * Add a bus to a route: from the depot reserve or by moving one from a quieter route.
 * @param routeId target route, onClose(), onDone()
 */
export default function DispatchDialog({ routeId, onClose, onDone }) {
  const toast = useToast();
  const [fleet, setFleet] = useState(null);
  const [source, setSource] = useState('reserve'); // 'reserve' | donor routeId
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .fleet()
      .then((data) => {
        setFleet(data);
        if (data.reserve.length === 0 && data.donorsFor[routeId]?.length) setSource(data.donorsFor[routeId][0]);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [routeId]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const target = fleet?.routes.find((r) => r.routeId === routeId);
  const donors = (fleet?.donorsFor[routeId] ?? []).map((id) => fleet.routes.find((r) => r.routeId === id));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = source === 'reserve' ? { toRouteId: routeId } : { toRouteId: routeId, fromRouteId: source };
      const res = await api.dispatch(body);
      toast.success(
        `${res.bus.plate} xətt №${target.number}-ə göndərildi`,
        res.resolvedAlerts ? 'Açıq xəbərdarlıq bağlandı, sərnişinlərə elan göndərildi.' : 'Sərnişinlərə elan göndərildi.',
      );
      onDone?.();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const option = (active) =>
    `flex w-full items-center gap-3 rounded-xl p-3 text-left ring-1 transition ${
      active ? 'bg-brand-50 ring-2 ring-brand-600' : 'bg-white ring-slate-200 hover:ring-slate-300'
    }`;

  return createPortal(
    <div className="fixed inset-0 z-[1500] flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dispatch-title"
        className="w-full max-w-md animate-slide-down rounded-3xl bg-white p-5 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="dispatch-title" className="text-lg font-bold text-slate-900">
              Əlavə avtobus göndər
            </h2>
            {target && (
              <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                Xətt №{target.number} · {target.busCount} avtobus xəttdə <LevelBadge level={target.level} />
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Bağla">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!fleet && !error && <div className="mt-5 h-40 animate-pulse rounded-2xl bg-slate-100" />}

        {fleet && (
          <div className="mt-5 space-y-2">
            <p className="section-title">Mənbə</p>
            <button type="button" disabled={!fleet.reserve.length} onClick={() => setSource('reserve')} className={`${option(source === 'reserve')} disabled:opacity-50`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Warehouse className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900">Depodan ehtiyat avtobus</span>
                <span className="block text-xs text-slate-500">
                  {fleet.reserve.length ? `${fleet.reserve.length} avtobus hazırdır (${fleet.reserve[0].plate})` : 'Depoda ehtiyat yoxdur'}
                </span>
              </span>
            </button>

            {donors.map((d) => (
              <button key={d.routeId} type="button" onClick={() => setSource(d.routeId)} className={option(source === d.routeId)}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: d.color }}>
                  {d.number}
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Repeat className="h-3.5 w-3.5 text-slate-400" /> Xətt №{d.number}-dən köçür
                  </span>
                  <span className="block text-xs text-slate-500">
                    {d.busCount} avtobus · orta doluluq {Math.round(d.avgOccupancy * 100)}%
                  </span>
                </span>
                <LevelBadge level={d.level} />
              </button>
            ))}
            {donors.length === 0 && (
              <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                Avtobus köçürmək üçün uyğun sakit xətt yoxdur (hər xəttdə ən azı {fleet.minBusesPerRoute} avtobus qalmalıdır).
              </p>
            )}
          </div>
        )}

        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Ləğv et
          </button>
          <button type="button" disabled={busy || !fleet || (source === 'reserve' && !fleet.reserve.length)} onClick={submit} className="btn-primary flex-1">
            <Bus className="h-4 w-4" /> {busy ? 'Göndərilir...' : 'Göndər'} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
