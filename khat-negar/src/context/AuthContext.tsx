import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types.js';
import { apiFetch, setAuthToken } from '../utils/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (username: string, password: string, delayCommit?: boolean) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    commitUser?: () => void;
  }>;
  register: (username: string, password: string, delayCommit?: boolean) => Promise<{
    success: boolean;
    user?: User;
    error?: string;
    commitUser?: () => void;
  }>;
  setUserDirectly: (u: User | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load theme on startup
  useEffect(() => {
    const savedTheme = (localStorage.getItem('app_theme') as 'light' | 'dark') || 'light';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('app_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const refreshUser = async () => {
    try {
      const { ok, data } = await apiFetch<User>('/api/auth/session');
      if (ok && data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        setAuthToken(null);
      }
    } catch (err) {
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string, delayCommit = false) => {
    try {
      const { ok, data } = await apiFetch<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (ok && data.success && data.user) {
        if (data.token) {
          setAuthToken(data.token);
        }
        const loggedUser = data.user;
        const commit = () => {
          setUser(loggedUser);
        };

        if (!delayCommit) {
          commit();
        }
        return { success: true, user: loggedUser, commitUser: commit };
      }
      return { success: false, error: data.error || 'نام کاربری یا رمز عبور اشتباه است.' };
    } catch (err: any) {
      return { success: false, error: 'خطای ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.' };
    }
  };

  const register = async (username: string, password: string, delayCommit = false) => {
    try {
      const { ok, data } = await apiFetch<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (ok && data.success && data.user) {
        if (data.token) {
          setAuthToken(data.token);
        }
        const registeredUser = data.user;
        const commit = () => {
          setUser(registeredUser);
        };

        if (!delayCommit) {
          commit();
        }
        return { success: true, user: registeredUser, commitUser: commit };
      }
      return { success: false, error: data.error || 'خطا در فرآیند ثبت‌نام حساب کاربری.' };
    } catch (err: any) {
      return { success: false, error: 'خطای ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        setUserDirectly: setUser,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
