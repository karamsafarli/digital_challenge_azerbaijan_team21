import { useEffect, useState } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';

function HealthBadge() {
  const [status, setStatus] = useState('yoxlanılır...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status === 'ok' ? 'API işləyir' : 'API xətası'))
      .catch(() => setStatus('API əlçatan deyil'));
  }, []);

  return <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">{status}</span>;
}

const navClass = ({ isActive }) =>
  `rounded px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <h1 className="text-lg font-bold">Smart Transit Bakı</h1>
          <nav className="flex gap-2">
            <NavLink to="/" end className={navClass}>Sərnişin</NavLink>
            <NavLink to="/operator" className={navClass}>Operator</NavLink>
          </nav>
          <HealthBadge />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<p>Sərnişin modulu (Addım 5)</p>} />
          <Route path="/operator" element={<p>Operator paneli (Addım 6)</p>} />
        </Routes>
      </main>
    </div>
  );
}
