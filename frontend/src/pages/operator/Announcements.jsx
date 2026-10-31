import { useState } from 'react';
import { Megaphone, Send, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import AnnouncementCard from '../../components/AnnouncementCard.jsx';
import { useOperator } from '../../context/OperatorContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAnnouncements } from '../../hooks/useAnnouncements.js';

const SEVERITIES = [
  { key: 'INFO', label: 'Məlumat' },
  { key: 'WARNING', label: 'Xəbərdarlıq' },
  { key: 'CRITICAL', label: 'Təcili' },
];
const DURATIONS = [
  { value: 30, label: '30 dəq' },
  { value: 60, label: '1 saat' },
  { value: 180, label: '3 saat' },
  { value: 0, label: 'Müddətsiz' },
];
const TEMPLATES = [
  'Tıxac səbəbindən 10–15 dəqiqəlik gecikmə gözlənilir.',
  'Xəttə əlavə avtobus çıxarıldı.',
  'Təmir işləri səbəbindən dayanacaq müvəqqəti dəyişdirilib.',
];

export default function Announcements() {
  const toast = useToast();
  const { routes } = useOperator();
  const announcements = useAnnouncements();
  const [routeId, setRouteId] = useState('');
  const [severity, setSeverity] = useState('INFO');
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const publish = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createAnnouncement({
        routeId: routeId ? Number(routeId) : null,
        message,
        severity,
        durationMinutes: duration || undefined,
      });
      toast.success('Elan dərc edildi', 'Sərnişinlər onu dərhal görəcək.');
      setMessage('');
    } catch (err) {
      toast.error('Elan dərc edilmədi', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    try {
      await api.removeAnnouncement(a.id);
      toast.info('Elan götürüldü');
    } catch (err) {
      toast.error('Əməliyyat alınmadı', errorMessage(err));
    }
  };

  const seg = (active) => `flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
      <form onSubmit={publish} className="card space-y-4 p-5 xl:self-start">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          <Megaphone className="h-4 w-4 text-brand-600" /> Yeni elan
        </h2>

        <div>
          <label htmlFor="ann-route" className="label">Xətt</label>
          <select id="ann-route" className="input" value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">Bütün xətlər</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                №{r.number} · {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="label">Növ</span>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {SEVERITIES.map((s) => (
              <button key={s.key} type="button" className={seg(severity === s.key)} onClick={() => setSeverity(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ann-msg" className="label">Mətn</label>
          <textarea
            id="ann-msg"
            rows={3}
            maxLength={280}
            required
            className="input resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Məs. Xətt 65-də tıxac səbəbindən gecikmə..."
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button key={t} type="button" onClick={() => setMessage(t)} className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200">
                {t.slice(0, 32)}…
              </button>
            ))}
          </div>
          <p className="mt-1 text-right text-[11px] text-slate-400">{message.length}/280</p>
        </div>

        <div>
          <span className="label">Müddət</span>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {DURATIONS.map((d) => (
              <button key={d.value} type="button" className={seg(duration === d.value)} onClick={() => setDuration(d.value)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={busy || message.trim().length < 5} className="btn-primary w-full">
          <Send className="h-4 w-4" /> {busy ? 'Dərc edilir...' : 'Dərc et'}
        </button>
      </form>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Aktiv elanlar · {announcements.length}</h2>
        {announcements.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aktiv elan yoxdur</p>
        ) : (
          <ul className="space-y-2">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <AnnouncementCard announcement={a} showMeta />
                </div>
                <button type="button" onClick={() => remove(a)} className="mt-2 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Elanı götür">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
