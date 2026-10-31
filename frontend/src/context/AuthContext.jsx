import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from '../api/client.js';
import { reconnectSocket } from '../hooks/useSocket.js';

const STORAGE_KEY = 'smart-transit-auth';
const AuthContext = createContext(null);

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode): session lasts until reload
  }
}

// Apply a stored token before the first render so initial requests are authenticated.
const initial = readStored();
setAuthToken(initial?.token ?? null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(initial);
  const [checking, setChecking] = useState(Boolean(initial));

  const applySession = useCallback((next) => {
    setAuthToken(next?.token ?? null);
    writeStored(next);
    setSession(next);
    reconnectSocket();
  }, []);

  const logout = useCallback(() => applySession(null), [applySession]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!initial) return;
    // Re-validate the stored token with the server
    api
      .me()
      .then((user) => setSession((s) => (s ? { ...s, user } : s)))
      .catch(() => logout())
      .finally(() => setChecking(false));
  }, [logout]);

  const login = useCallback(
    async (email, password, role) => {
      const result = await api.login({ email, password, role });
      applySession(result);
      return result.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (name, email, password) => {
      const result = await api.register({ name, email, password });
      applySession(result);
      return result.user;
    },
    [applySession],
  );

  const value = useMemo(
    () => ({ user: session?.user ?? null, checking, login, register, logout }),
    [session, checking, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export const homePathFor = (user) => (user?.role === 'OPERATOR' ? '/operator' : '/app');
