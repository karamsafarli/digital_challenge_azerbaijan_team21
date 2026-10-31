import { NavLink, Route, Routes } from 'react-router-dom';
import Passenger from './pages/Passenger.jsx';
import Operator from './pages/Operator.jsx';
import { useSocketStatus } from './hooks/useSocket.js';

function LiveBadge() {
  const connected = useSocketStatus();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs ${
        connected ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-green-500' : 'bg-slate-400'}`} />
      {connected ? 'Canlı' : 'Bağlantı yoxdur'}
    </span>
  );
}

const navClass = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-bold">
            Smart Transit <span className="text-blue-600">Bakı</span>
          </h1>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navClass}>
              Sərnişin
            </NavLink>
            <NavLink to="/operator" className={navClass}>
              Operator
            </NavLink>
          </nav>
          <LiveBadge />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-4">
        <Routes>
          <Route path="/" element={<Passenger />} />
          <Route path="/operator" element={<Operator />} />
        </Routes>
      </main>
    </div>
  );
}
