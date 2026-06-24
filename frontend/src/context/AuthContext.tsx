import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi, userApi } from '../api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  guestMode: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const guest = localStorage.getItem('guestMode') === 'true';
    if (token) {
      userApi.getProfile()
        .then((r) => setUser(r.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false));
    } else if (guest) {
      try {
        const g = JSON.parse(localStorage.getItem('guestUser') || 'null');
        setUser(g);
        setGuestMode(true);
      } catch {
        setUser({ id: 'guest', username: 'Guest User' } as unknown as User);
        setGuestMode(true);
      }
      setLoading(false);
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
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestUser');
    setGuestMode(false);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const { data: updated } = await userApi.updateProfile(data);
    setUser(updated);
  };

  const continueAsGuest = () => {
    const guestUser = {
      id: 0,
      username: 'Guest User',
      is_guest: true,
    } as unknown as User;
    localStorage.setItem('guestMode', 'true');
    localStorage.setItem('guestUser', JSON.stringify(guestUser));
    setGuestMode(true);
    setUser(guestUser);
  };

  const exitGuest = () => {
    localStorage.removeItem('guestMode');
    localStorage.removeItem('guestUser');
    setGuestMode(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, guestMode, login, register, logout, updateUser, continueAsGuest, exitGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
