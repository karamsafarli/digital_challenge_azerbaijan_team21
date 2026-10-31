import { useEffect, useState } from 'react';
import { RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { api, errorMessage } from '../../api/client.js';
import { useOperator } from '../../context/OperatorContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const FIELDS = [
  {
    key: 'alertWindowMinutes',
    label: 'Anomaliya pəncərəsi',
    unit: 'dəq',
    min: 1,
    max: 60,
    help: 'Xətt bu qədər müddət fasiləsiz Yüksək qalarsa xəbərdarlıq yaranır. Tapşırıq tələbi: 10 dəqiqə.',
  },
  {
    key: 'alertMinReports',
    label: 'Minimum Yüksək bildiriş',
    unit: 'ədəd',
    min: 1,
    max: 50,
    help: 'Pəncərə ərzində ən azı bu qədər sərnişin "Yüksək" bildirməlidir (tək GPS məlumatı ilə yalançı həyəcanın qarşısını alır).',
  },
  {
    key: 'densityWindowMinutes',
    label: 'Bildirişlərin aktuallıq müddəti',
    unit: 'dəq',
    min: 5,
    max: 120,
    help: 'Bundan köhnə sərnişin bildirişləri sıxlıq hesabına daxil edilmir.',
  },
  {
    key: 'reportCooldownSeconds',
    label: 'Bildiriş fasiləsi',
    unit: 'san',
    min: 0,
    max: 3600,
    help: 'Eyni sərnişin eyni xətt üçün bu müddətdə yalnız bir bildiriş göndərə bilər (spam qoruması).',
  },
];

export default function Settings() {
  const toast = useToast();
  const { config, setConfig } = useOperator();
  const [values, setValues] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (config && !values) setValues(config);
  }, [config, values]);

  if (!values) return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/60" />;

  const changed = FIELDS.filter((f) => Number(values[f.key]) !== config[f.key]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = Object.fromEntries(changed.map((f) => [f.key, Number(values[f.key])]));
      const saved = await api.saveConfig(body);
      setConfig(saved);
      setValues(saved);
      toast.success('Ayarlar yadda saxlanıldı', 'Analitika mühərriki yeni qaydaları dərhal tətbiq edir.');
    } catch (err) {
      toast.error('Ayarlar saxlanmadı', errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="card max-w-3xl p-5">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <SlidersHorizontal className="h-4 w-4 text-brand-600" /> Analitika və anomaliya qaydaları
      </h2>
      <p className="mt-1 text-sm text-slate-500">Dəyişikliklər serverdə saxlanılır və yenidən başlatmadan qüvvəyə minir.</p>

      <div className="mt-6 space-y-6">
        {FIELDS.map((f) => (
          <div key={f.key} className="grid gap-2 sm:grid-cols-[1fr_200px] sm:items-center">
            <div>
              <label htmlFor={f.key} className="text-sm font-semibold text-slate-900">
                {f.label}
              </label>
              <p className="mt-0.5 text-xs text-slate-500">{f.help}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                id={f.key}
                type="number"
                min={f.min}
                max={f.max}
                required
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="input text-right tabular-nums"
              />
              <span className="w-10 text-xs text-slate-500">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-end gap-2 border-t border-slate-100 pt-5">
        <button type="button" disabled={!changed.length} onClick={() => setValues(config)} className="btn-secondary">
          <RotateCcw className="h-4 w-4" /> Geri qaytar
        </button>
        <button type="submit" disabled={busy || !changed.length} className="btn-primary">
          <Save className="h-4 w-4" /> {busy ? 'Saxlanılır...' : `Yadda saxla${changed.length ? ` (${changed.length})` : ''}`}
        </button>
      </div>
    </form>
  );
}
