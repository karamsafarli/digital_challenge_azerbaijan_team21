import { AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { formatTime } from '../utils/format.js';

const SEVERITY = {
  INFO: { icon: Info, className: 'bg-brand-50 text-brand-900 ring-brand-200', iconClass: 'text-brand-600' },
  WARNING: { icon: AlertTriangle, className: 'bg-amber-50 text-amber-900 ring-amber-200', iconClass: 'text-amber-600' },
  CRITICAL: { icon: AlertOctagon, className: 'bg-red-50 text-red-900 ring-red-200', iconClass: 'text-red-600' },
};

export default function AnnouncementCard({ announcement: a, showMeta = false }) {
  const meta = SEVERITY[a.severity] ?? SEVERITY.INFO;
  const Icon = meta.icon;
  return (
    <div className={`flex items-start gap-2.5 rounded-xl p-3 text-sm ring-1 ring-inset ${meta.className}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.iconClass}`} />
      <div className="min-w-0 flex-1">
        <p className="leading-snug">
          {a.route && (
            <span
              className="mr-1.5 inline-flex h-5 min-w-[2rem] items-center justify-center rounded px-1 align-middle text-[11px] font-bold text-white"
              style={{ backgroundColor: a.route.color }}
            >
              {a.route.number}
            </span>
          )}
          {a.message}
        </p>
        {showMeta && (
          <p className="mt-1 text-[11px] opacity-70">
            {a.route ? `Xətt №${a.route.number}` : 'Bütün xətlər'} · {formatTime(a.createdAt)}
            {a.expiresAt ? ` · ${formatTime(a.expiresAt)}-dək` : ' · müddətsiz'}
          </p>
        )}
      </div>
    </div>
  );
}
