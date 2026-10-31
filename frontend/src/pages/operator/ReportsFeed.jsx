import { useCallback, useEffect, useState } from 'react';
import { Ban, Flag, FlagOff, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import LevelBadge from '../../components/LevelBadge.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useSocketEvent } from '../../hooks/useSocket.js';
import { formatTime } from '../../utils/format.js';

const FILTERS = [
  { key: 'all', label: 'Hamısı' },
  { key: 'HIGH', label: 'Yüksək' },
  { key: 'flagged', label: 'İşarələnmiş' },
];

export default function ReportsFeed() {
  const toast = useToast();
  const [reports, setReports] = useState(null);
  const [filter, setFilter] = useState('all');
  const [freshIds, setFreshIds] = useState(new Set());

  const load = useCallback(() => {
    api.reports(80).then(setReports).catch((err) => toast.error('Bildirişlər yüklənmədi', errorMessage(err)));
  }, [toast]);
  useEffect(load, [load]);

  useSocketEvent('report:new', (report) => {
    setReports((list) => (list ? [report, ...list].slice(0, 80) : list));
    setFreshIds((ids) => new Set(ids).add(report.id));
    setTimeout(() => setFreshIds((ids) => {
      const next = new Set(ids);
      next.delete(report.id);
      return next;
    }), 4000);
  });

  const toggleFlag = async (report) => {
    try {
      const updated = await api.moderateReport(report.id, !report.flagged);
      setReports((list) => list.map((r) => (r.id === report.id ? updated : r)));
      toast.info(updated.flagged ? 'Bildiriş işarələndi' : 'İşarə götürüldü', 'Xəttin sıxlığı yenidən hesablandı.');
    } catch (err) {
      toast.error('Əməliyyat alınmadı', errorMessage(err));
    }
  };

  const toggleBlock = async (user) => {
    const blocked = !user.blocked;
    if (blocked && !window.confirm(`${user.name} hesabı bloklansın? Son 1 saatın bildirişləri nəzərə alınmayacaq.`)) return;
    try {
      const res = await api.setUserBlocked(user.id, blocked);
      toast.info(blocked ? `${user.name} bloklandı` : `${user.name} blokdan çıxarıldı`, blocked ? `${res.flaggedCount} bildiriş işarələndi.` : undefined);
      load();
    } catch (err) {
      toast.error('Əməliyyat alınmadı', errorMessage(err));
    }
  };

  const visible = (reports ?? []).filter((r) => (filter === 'all' ? true : filter === 'flagged' ? r.flagged : r.level === filter));

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Canlı bildiriş axını</h2>
          <p className="text-xs text-slate-500">İşarələnmiş bildirişlər və bloklanmış hesabların bildirişləri sıxlıq hesabına daxil edilmir.</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${filter === f.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!reports && <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />}
      {reports && visible.length === 0 && <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Bildiriş yoxdur</p>}

      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <tbody className="divide-y divide-slate-100">
            {visible.map((r) => (
              <tr key={r.id} className={`transition ${freshIds.has(r.id) ? 'bg-brand-50' : ''} ${r.flagged ? 'opacity-50' : ''}`}>
                <td className="py-2.5 pl-5 pr-2 text-xs tabular-nums text-slate-500">{formatTime(r.createdAt)}</td>
                <td className="py-2.5 pr-2">
                  <span className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-md px-1.5 text-xs font-bold text-white" style={{ backgroundColor: r.route.color }}>
                    {r.route.number}
                  </span>
                </td>
                <td className="py-2.5 pr-2">
                  <LevelBadge level={r.level} />
                </td>
                <td className="py-2.5 pr-2 text-xs text-slate-500">{r.bus?.plate ?? 'Bütün xətt'}</td>
                <td className="py-2.5 pr-2">
                  {r.user ? (
                    <div className="leading-tight">
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-800">
                        {r.user.name} {r.user.blocked && <Ban className="h-3.5 w-3.5 text-red-500" aria-label="bloklanıb" />}
                      </div>
                      <div className="text-xs text-slate-400">{r.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">{r.clientId === 'rush-simulator' ? 'Pik saat simulyasiyası' : 'Anonim'}</span>
                  )}
                </td>
                <td className="py-2.5 pr-5 text-right">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => toggleFlag(r)} className="btn-ghost px-2 py-1 text-xs" title={r.flagged ? 'İşarəni götür' : 'Saxta/spam kimi işarələ'}>
                      {r.flagged ? <FlagOff className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                      {r.flagged ? 'Bərpa et' : 'İşarələ'}
                    </button>
                    {r.user && (
                      <button
                        type="button"
                        onClick={() => toggleBlock(r.user)}
                        className={`btn px-2 py-1 text-xs ${r.user.blocked ? 'text-green-700 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                      >
                        {r.user.blocked ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        {r.user.blocked ? 'Blokdan çıxar' : 'Blokla'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
