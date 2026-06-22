import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi, userApi } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      userApi.getProfile()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    const { data } = await authApi.login(usernameOrEmail, password);
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const { data } = await authApi.register(username, email, password);
    localStorage.setItem('token', data.access_token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const { data: updated } = await userApi.updateProfile(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
