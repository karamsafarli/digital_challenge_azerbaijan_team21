import { useEffect, useState } from 'react';
import { BellRing, Gauge, LayoutDashboard, Map } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import LiveBadge from '../components/LiveBadge.jsx';
import UserMenu from '../components/UserMenu.jsx';
import { formatDate, formatTime } from '../utils/format.js';

const NAV = [
  { href: '#overview', label: 'İcmal', icon: LayoutDashboard },
  { href: '#density', label: 'Xətlər üzrə sıxlıq', icon: Gauge },
  { href: '#map', label: 'Sıxlıq xəritəsi', icon: Map },
  { href: '#alerts', label: 'Xəbərdarlıqlar', icon: BellRing, badgeKey: 'alerts' },
];

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="tabular-nums">
      {formatDate(now)} · {formatTime(now)}
    </span>
  );
}

export default function OperatorLayout({ children, badges = {} }) {
  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-[700] hidden w-64 flex-col bg-slate-900 px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo inverted />
        </div>
        <p className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dispetçer mərkəzi</p>
        <nav className="mt-2 space-y-1">
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => (
            <a
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <Icon className="h-4 w-4 text-slate-500 group-hover:text-brand-400" />
              <span className="flex-1">{label}</span>
              {badgeKey && badges[badgeKey] > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{badges[badgeKey]}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
          <UserMenu inverted />
        </div>
      </aside>

      <header className="sticky top-0 z-[600] border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="hidden lg:block">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Dispetçer paneli</h1>
            <p className="text-xs text-slate-500">
              <Clock />
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LiveBadge />
            <div className="lg:hidden">
              <UserMenu showName={false} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
