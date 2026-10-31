import Logo from './Logo.jsx';

export default function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Logo />
      <div className="h-1 w-32 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-600" />
      </div>
    </div>
  );
}
