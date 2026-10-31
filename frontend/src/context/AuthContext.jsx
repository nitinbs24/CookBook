import { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth.js';

const AuthContext = createContext(null);

/** Token in rb_token, guest flag in rb_guest (TRD §7). The user is reloaded from the token on start. */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rb_token'));
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('rb_guest') === 'true');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('rb_token')));

  const logout = () => {
    localStorage.removeItem('rb_token');
    localStorage.removeItem('rb_guest');
    setToken(null);
    setUser(null);
    setIsGuest(false);
  };

  useEffect(() => {
    if (!token) return undefined;
    let live = true;
    authApi
      .me()
      .then((u) => live && setUser(u))
      // Only a rejected token logs out; a network blip keeps the session.
      .catch((err) => live && err.status === 401 && logout())
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []); // once, on start; login and register set the user themselves

  const startSession = ({ user: u, token: t }) => {
    localStorage.setItem('rb_token', t);
    localStorage.removeItem('rb_guest');
    setToken(t);
    setUser(u);
    setIsGuest(false);
  };

  const value = {
    user,
    token,
    isGuest,
    loading,
    isAdmin: user?.role === 'admin',
    login: async (creds) => startSession(await authApi.login(creds)),
    register: async (body) => startSession(await authApi.register(body)),
    continueAsGuest: () => {
      localStorage.setItem('rb_guest', 'true');
      setIsGuest(true);
    },
    logout,
  };
  return <AuthContext value={value}>{children}</AuthContext>;
}

export const useAuth = () => useContext(AuthContext);
