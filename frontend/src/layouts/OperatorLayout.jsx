import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle, BellRing, Bus, History, LayoutDashboard, Megaphone, MessageSquareText, Settings, X } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import LiveBadge from '../components/LiveBadge.jsx';
import UserMenu from '../components/UserMenu.jsx';
import { OperatorProvider, useOperator } from '../context/OperatorContext.jsx';
import { useHorizontalWheel } from '../hooks/useHorizontalWheel.js';
import { formatDate, formatTime } from '../utils/format.js';

export const OPERATOR_NAV = [
  { to: '/operator', label: 'İcmal', icon: LayoutDashboard, end: true, title: 'Dispetçer paneli' },
  { to: '/operator/fleet', label: 'Park və dispetçer', icon: Bus, title: 'Avtobus parkı və dispetçer' },
  { to: '/operator/reports', label: 'Sərnişin bildirişləri', icon: MessageSquareText, title: 'Canlı bildiriş axını' },
  { to: '/operator/announcements', label: 'Elanlar', icon: Megaphone, title: 'Sərnişinlər üçün elanlar' },
  { to: '/operator/history', label: 'Xəbərdarlıq tarixçəsi', icon: History, title: 'Xəbərdarlıq tarixçəsi' },
  { to: '/operator/settings', label: 'Qayda ayarları', icon: Settings, title: 'Analitika qaydaları' },
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

function NewAlertBanner() {
  const { banner, dismissBanner } = useOperator();
  if (!banner) return null;
  return (
    <div role="alert" className="fixed inset-x-4 top-4 z-[2000] mx-auto max-w-xl animate-slide-down">
      <div className="flex items-start gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-float ring-1 ring-red-700">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-semibold">Yeni anomaliya · Xətt №{banner.route?.number}</p>
          <p className="mt-0.5 text-sm text-red-50">{banner.message}</p>
          <NavLink to="/operator#alerts" onClick={dismissBanner} className="mt-2 inline-block text-sm font-semibold underline underline-offset-2">
            Xəbərdarlığa keç
          </NavLink>
        </div>
        <button type="button" onClick={dismissBanner} className="text-white/80 hover:text-white" aria-label="Bağla">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function SideNav() {
  const { alerts } = useOperator();
  return (
    <nav className="mt-2 space-y-1">
      {OPERATOR_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon className="h-4 w-4 text-slate-500 group-hover:text-brand-400" />
          <span className="flex-1">{label}</span>
          {end && alerts.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
              <BellRing className="h-3 w-3" /> {alerts.length}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function MobileNav() {
  const ref = useHorizontalWheel();
  return (
    <nav ref={ref} className="scrollbar-none flex select-none gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 lg:hidden">
      {OPERATOR_NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
              isActive ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Shell() {
  const location = useLocation();
  const current = OPERATOR_NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <div className="min-h-screen lg:pl-64">
      <NewAlertBanner />
      <aside className="fixed inset-y-0 left-0 z-[700] hidden w-64 flex-col bg-slate-900 px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo inverted />
        </div>
        <p className="mt-8 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Dispetçer mərkəzi</p>
        <SideNav />
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
            <h1 className="text-lg font-bold tracking-tight text-slate-900">{current?.title ?? 'Dispetçer paneli'}</h1>
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
        <MobileNav />
      </header>

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default function OperatorLayout() {
  return (
    <OperatorProvider>
      <Shell />
    </OperatorProvider>
  );
}
