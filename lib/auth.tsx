import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from './api';
import { saveItem, getItem, deleteItem } from './storage';

type Role = 'ADMIN' | 'PATIENT';

type User = {
  id: string;
  email: string;
  role: Role;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  token?: string;
  user?: User;
  role?: Role;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const t = await getItem('token');
      const uStr = await getItem('user');
      if (t) {
        setToken(t);
        setAuthToken(t);
      }
      if (uStr) {
        try { setUser(JSON.parse(uStr)); } catch {}
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data as { token: string; user: User };
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    await saveItem('token', newToken);
    await saveItem('user', JSON.stringify(newUser));
  };

  const logout = async () => {
    setToken(undefined);
    setUser(undefined);
    setAuthToken(undefined);
    await deleteItem('token');
    await deleteItem('user');
  };

  const value = useMemo(() => ({
    isAuthenticated: !!token,
    token,
    user,
    role: user?.role,
    login,
    logout,
  }), [token, user]);

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}