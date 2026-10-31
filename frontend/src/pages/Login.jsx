import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock3, Eye, EyeOff, Lock, Mail, MapPinned, ShieldCheck, User, Users } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { homePathFor, useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/client.js';

const FEATURES = [
  { icon: MapPinned, title: 'Canlı xəritə', text: 'Avtobusların yerini real vaxtda izləyin' },
  { icon: Clock3, title: 'Dəqiq gəliş vaxtı', text: 'Sıxlığa görə düzəldilmiş ETA' },
  { icon: Users, title: 'Sıxlıq bildirişi', text: 'Sərnişinlər birlikdə xətləri yaxşılaşdırır' },
];

function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 p-12 text-white lg:flex lg:flex-col">
      {/* decorative route lines */}
      <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 600 800" preserveAspectRatio="none" aria-hidden>
        <path d="M-20 620 C 120 560, 180 420, 320 400 S 520 300, 640 120" stroke="white" strokeWidth="3" fill="none" strokeDasharray="10 12" />
        <path d="M-20 300 C 100 340, 220 260, 300 300 S 480 520, 640 480" stroke="#8ec3ff" strokeWidth="3" fill="none" />
        <path d="M120 820 C 160 640, 300 600, 360 520 S 420 260, 560 -20" stroke="white" strokeWidth="2" fill="none" />
        {[[320, 400], [300, 300], [360, 520], [180, 470], [480, 220]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="white" />
        ))}
      </svg>

      <div className="relative">
        <Logo inverted />
      </div>

      <div className="relative mt-auto">
        <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
          Bakının ictimai nəqliyyatı — real vaxtda.
        </h1>
        <p className="mt-4 max-w-md text-brand-100">
          Avtobusunuz harada, nə vaxt gələcək və nə qədər doludur — hamısı bir ekranda. Dispetçerlər isə sıxlığı dərhal görür.
        </p>
        <ul className="mt-10 grid max-w-md gap-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-brand-100">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative mt-12 text-xs text-brand-200">Digital Azerbaijan Challenge 2026 · Smart Transit & Crowdsourcing Engine</p>
    </div>
  );
}

function Field({ id, label, icon: Icon, type = 'text', value, onChange, autoComplete, placeholder, trailing }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input pl-10 pr-10"
        />
        {trailing}
      </div>
    </div>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(location.state?.role === 'OPERATOR' ? 'OPERATOR' : 'PASSENGER');
  const [mode, setMode] = useState('login'); // passenger: 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homePathFor(user)} replace />;

  const isRegister = role === 'PASSENGER' && mode === 'register';

  const switchRole = (next) => {
    setRole(next);
    setMode('login');
    setError(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedIn = isRegister ? await register(name, email, password) : await login(email, password, role);
      navigate(homePathFor(loggedIn), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const tabClass = (active) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <div className="flex flex-col justify-center px-4 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Hesab yaradın' : role === 'OPERATOR' ? 'Dispetçer girişi' : 'Xoş gəlmisiniz'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {role === 'OPERATOR'
              ? 'Operator paneli yalnız səlahiyyətli əməkdaşlar üçündür.'
              : isRegister
                ? 'Bir dəqiqəyə qeydiyyatdan keçin və sıxlığı bildirməyə başlayın.'
                : 'Davam etmək üçün hesabınıza daxil olun.'}
          </p>

          <div className="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Giriş növü">
            <button type="button" role="tab" aria-selected={role === 'PASSENGER'} className={tabClass(role === 'PASSENGER')} onClick={() => switchRole('PASSENGER')}>
              <User className="h-4 w-4" /> Sərnişin
            </button>
            <button type="button" role="tab" aria-selected={role === 'OPERATOR'} className={tabClass(role === 'OPERATOR')} onClick={() => switchRole('OPERATOR')}>
              <ShieldCheck className="h-4 w-4" /> Operator
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {isRegister && (
              <Field id="name" label="Ad, soyad" icon={User} value={name} onChange={setName} autoComplete="name" placeholder="Məs. Aysel Məmmədova" />
            )}
            <Field
              id="email"
              label="E-poçt"
              icon={Mail}
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="ad@numune.az"
            />
            <Field
              id="password"
              label="Şifrə"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'Ən azı 6 simvol' : '••••••••'}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Şifrəni gizlət' : 'Şifrəni göstər'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
              {submitting ? 'Gözləyin...' : isRegister ? 'Qeydiyyatdan keç' : 'Daxil ol'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {role === 'PASSENGER' ? (
            <p className="mt-6 text-center text-sm text-slate-500">
              {isRegister ? 'Artıq hesabınız var?' : 'Hesabınız yoxdur?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(isRegister ? 'login' : 'register');
                  setError(null);
                }}
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                {isRegister ? 'Daxil olun' : 'Qeydiyyatdan keçin'}
              </button>
            </p>
          ) : (
            <p className="mt-6 flex items-start gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              Operator hesabları nəqliyyat agentliyi tərəfindən verilir. Qeydiyyat mümkün deyil.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
