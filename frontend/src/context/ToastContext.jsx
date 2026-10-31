import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CheckCircle2, className: 'text-green-600' },
  error: { icon: AlertTriangle, className: 'text-red-600' },
  info: { icon: Info, className: 'text-brand-600' },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (type, title, message, duration = 4500) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-3), { id, type, title, message }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (title, message) => show('success', title, message),
      error: (title, message) => show('error', title, message, 6000),
      info: (title, message) => show('info', title, message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[2000] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
        {toasts.map((t) => {
          const { icon: Icon, className } = STYLES[t.type];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-down items-start gap-3 rounded-2xl bg-white p-4 shadow-float ring-1 ring-slate-900/5"
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${className}`} />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-slate-900">{t.title}</p>
                {t.message && <p className="mt-0.5 text-slate-600">{t.message}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Bağla">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
