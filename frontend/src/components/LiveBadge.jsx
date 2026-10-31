import { useSocketStatus } from '../hooks/useSocket.js';

export default function LiveBadge({ inverted = false }) {
  const connected = useSocketStatus();
  const base = inverted ? 'bg-white/10 text-slate-200' : connected ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-slate-100 text-slate-500';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${base}`}>
      <span className="relative flex h-2 w-2">
        {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-slate-400'}`} />
      </span>
      {connected ? 'Canlı' : 'Bağlantı yoxdur'}
    </span>
  );
}
