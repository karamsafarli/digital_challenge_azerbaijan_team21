import { useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Timer, Wrench } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import StatCard from '../../components/StatCard.jsx';
import { formatDate, formatTime } from '../../utils/format.js';

const minutesBetween = (a, b) => (a && b ? (new Date(b) - new Date(a)) / 60000 : null);
const fmtMinutes = (m) => (m === null ? '—' : m < 1 ? `${Math.round(m * 60)} san` : `${m.toFixed(1)} dəq`);
const avg = (values) => {
  const v = values.filter((x) => x !== null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

const RESOLUTION_LABEL = { RESERVE_DISPATCH: 'Depodan avtobus', REBALANCE: 'Xətlər arası köçürmə' };

export default function History() {
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .alerts('ALL')
      .then(setAlerts)
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!alerts) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />;

  const resolved = alerts.filter((a) => a.status === 'RESOLVED');
  const ackTimes = alerts.map((a) => minutesBetween(a.createdAt, a.acknowledgedAt));
  const resolveTimes = resolved.map((a) => minutesBetween(a.createdAt, a.resolvedAt));
  const withDispatch = resolved.filter((a) => a.details?.resolution).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Həll olunmuş" value={`${resolved.length} / ${alerts.length}`} tone="green" />
        <StatCard icon={Clock3} label="Orta reaksiya vaxtı" value={fmtMinutes(avg(ackTimes))} hint="Yaranma → qəbul" tone="amber" />
        <StatCard icon={Timer} label="Orta həll vaxtı" value={fmtMinutes(avg(resolveTimes))} hint="Yaranma → bağlanma" tone="brand" />
        <StatCard icon={Wrench} label="Avtobusla həll" value={withDispatch} hint="Dispetçer göndərişi ilə" tone="slate" />
      </div>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Bütün xəbərdarlıqlar</h2>
        {alerts.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Hələ xəbərdarlıq olmayıb</p>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pl-5 pr-2">Xətt</th>
                  <th className="py-2.5 pr-2">Yarandı</th>
                  <th className="py-2.5 pr-2">Status</th>
                  <th className="py-2.5 pr-2">Reaksiya</th>
                  <th className="py-2.5 pr-2">Həll müddəti</th>
                  <th className="py-2.5 pr-5">Həll yolu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((a) => {
                  const res = a.details?.resolution;
                  return (
                    <tr key={a.id}>
                      <td className="py-2.5 pl-5 pr-2">
                        <span className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 text-xs font-bold text-white" style={{ backgroundColor: a.route?.color }}>
                          {a.route?.number}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-xs tabular-nums text-slate-600">
                        {formatDate(a.createdAt)} · {formatTime(a.createdAt)}
                      </td>
                      <td className="py-2.5 pr-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            a.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : a.status === 'OPEN' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.status === 'RESOLVED' ? 'Həll olunub' : a.status === 'OPEN' ? 'Açıq' : 'İcradadır'}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 tabular-nums text-slate-700">{fmtMinutes(minutesBetween(a.createdAt, a.acknowledgedAt))}</td>
                      <td className="py-2.5 pr-2 tabular-nums text-slate-700">{fmtMinutes(minutesBetween(a.createdAt, a.resolvedAt))}</td>
                      <td className="py-2.5 pr-5 text-xs text-slate-600">
                        {res ? (
                          <>
                            {RESOLUTION_LABEL[res.type] ?? res.type}: <span className="font-medium">{res.busPlate}</span>
                            {res.fromRoute && ` (№${res.fromRoute}-dən)`}
                          </>
                        ) : a.status === 'RESOLVED' ? (
                          'Əl ilə bağlanıb'
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
