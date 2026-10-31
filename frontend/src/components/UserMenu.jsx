import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export default function UserMenu({ inverted = false, showName = true }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
          inverted ? 'bg-white/15 text-white' : 'bg-brand-100 text-brand-700'
        }`}
        aria-hidden
      >
        {initials(user.name)}
      </span>
      {showName && (
        <div className="hidden leading-tight sm:block">
          <div className={`text-sm font-semibold ${inverted ? 'text-white' : 'text-slate-900'}`}>{user.name}</div>
          <div className={`text-xs ${inverted ? 'text-slate-400' : 'text-slate-500'}`}>
            {user.role === 'OPERATOR' ? 'Dispetçer' : 'Sərnişin'}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={signOut}
        className={`rounded-lg p-2 transition ${inverted ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
        aria-label="Çıxış"
        title="Çıxış"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
