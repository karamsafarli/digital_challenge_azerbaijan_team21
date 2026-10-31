import { BusFront } from 'lucide-react';

export default function Logo({ inverted = false, compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          inverted ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-brand-600 text-white shadow-sm'
        }`}
      >
        <BusFront className="h-5 w-5" />
      </span>
      {!compact && (
        <div className="leading-tight">
          <div className={`text-[15px] font-bold tracking-tight ${inverted ? 'text-white' : 'text-slate-900'}`}>
            Smart Transit
          </div>
          <div className={`text-xs font-medium ${inverted ? 'text-brand-100' : 'text-brand-600'}`}>Bakı</div>
        </div>
      )}
    </div>
  );
}
