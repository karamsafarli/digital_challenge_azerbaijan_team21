import Logo from '../components/Logo.jsx';
import LiveBadge from '../components/LiveBadge.jsx';
import UserMenu from '../components/UserMenu.jsx';

export default function PassengerLayout({ children }) {
  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="z-[600] flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
        <Logo />
        <div className="flex items-center gap-3">
          <LiveBadge />
          <UserMenu />
        </div>
      </header>
      <main className="relative min-h-0 flex-1">{children}</main>
    </div>
  );
}
