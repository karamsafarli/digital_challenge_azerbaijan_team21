const TONES = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-green-50 text-green-600',
  brand: 'bg-brand-50 text-brand-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
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
