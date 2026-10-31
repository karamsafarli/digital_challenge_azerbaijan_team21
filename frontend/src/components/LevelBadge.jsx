import { LEVEL_META } from '../utils/format.js';

export default function LevelBadge({ level, className = '' }) {
  if (!level) return <span className="text-xs text-slate-400">—</span>;
  const meta = LEVEL_META[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
}
