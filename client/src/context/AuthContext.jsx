import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, hasToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasToken()) { setLoading(false); return; }
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token } = await api.login({ email, password });
    setToken(token);
    const fullUser = await api.me();
    setUser(fullUser);
    return fullUser;
  }

  async function register(payload) {
    const { token, user } = await api.register(payload);
    setToken(token);
    setUser(user);
    return user;
  }

  function logout() {
    setToken(null);
    setUser(null);
    window.location.href = '/';
  }

  function refresh() {
    return api.me().then(setUser);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
