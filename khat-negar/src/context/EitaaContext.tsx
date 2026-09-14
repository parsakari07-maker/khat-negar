import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { EitaaUser, EitaaThemeParams, EitaaWebApp } from '../types.js';
import { apiFetch, setAuthToken } from '../utils/api.js';
import { useAuth } from './AuthContext.js';

interface EitaaContextType {
  isEitaaEnvironment: boolean;
  eitaaUser: EitaaUser | null;
  rawInitData: string | null;
  themeParams: EitaaThemeParams | null;
  webApp: EitaaWebApp | null;
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  closeApp: () => void;
  openExternalLink: (url: string) => void;
}

const EitaaContext = createContext<EitaaContextType | undefined>(undefined);

export function EitaaProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [isEitaaEnvironment, setIsEitaaEnvironment] = useState<boolean>(false);
  const [eitaaUser, setEitaaUser] = useState<EitaaUser | null>(null);
  const [rawInitData, setRawInitData] = useState<string | null>(null);
  const [themeParams, setThemeParams] = useState<EitaaThemeParams | null>(null);
  const [webAppInstance, setWebAppInstance] = useState<EitaaWebApp | null>(null);

  useEffect(() => {
    // Check if Eitaa WebApp SDK is available
    if (typeof window !== 'undefined' && window.Eitaa?.WebApp) {
      const tg = window.Eitaa.WebApp;
      setWebAppInstance(tg);
      setIsEitaaEnvironment(true);

      // Signal to Eitaa client that the Mini App is loaded and ready
      try {
        tg.ready?.();
        tg.expand?.();
      } catch (err) {
        console.warn('Eitaa SDK ready/expand warning:', err);
      }

      // Read initial session data safely
      const unsafeUser = tg.initDataUnsafe?.user;
      if (unsafeUser && unsafeUser.id) {
        setEitaaUser(unsafeUser);
      }
      if (tg.initData) {
        setRawInitData(tg.initData);
      }
      if (tg.themeParams) {
        setThemeParams(tg.themeParams);
      }

      // Sync color scheme if provided by Eitaa client
      const applyEitaaTheme = () => {
        try {
          if (tg.colorScheme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('app_theme', 'dark');
          } else if (tg.colorScheme === 'light') {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('app_theme', 'light');
          }
          if (tg.themeParams) {
            setThemeParams({ ...tg.themeParams });
          }
        } catch (e) {
          // Ignore
        }
      };

      applyEitaaTheme();

      // Listen for theme change events in Eitaa client
      try {
        tg.onEvent?.('themeChanged', applyEitaaTheme);
      } catch (err) {
        // Ignore if event handler not supported in current version
      }

      // Attempt Automatic Single Sign-On (SSO) for Eitaa user if not already logged in
      if (unsafeUser && unsafeUser.id && !user) {
        (async () => {
          try {
            const { ok, data } = await apiFetch<{ token: string; user: any }>('/api/auth/eitaa', {
              method: 'POST',
              body: JSON.stringify({
                eitaaUser: unsafeUser,
                initData: tg.initData
              })
            });
            if (ok && data.success && data.token) {
              setAuthToken(data.token);
              await refreshUser();
            }
          } catch (authErr) {
            console.error('Eitaa automatic SSO authentication error:', authErr);
          }
        })();
      }

      return () => {
        try {
          tg.offEvent?.('themeChanged', applyEitaaTheme);
        } catch {
          // Ignore
        }
      };
    }
  }, [user?.id]);

  const showAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (webAppInstance?.showAlert) {
        webAppInstance.showAlert(message, () => resolve());
      } else {
        window.alert?.(message);
        resolve();
      }
    });
  };

  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (webAppInstance?.showConfirm) {
        webAppInstance.showConfirm(message, (confirmed: boolean) => resolve(!!confirmed));
      } else {
        const confirmed = window.confirm?.(message);
        resolve(!!confirmed);
      }
    });
  };

  const closeApp = () => {
    if (webAppInstance?.close) {
      webAppInstance.close();
    }
  };

  const openExternalLink = (url: string) => {
    if (webAppInstance?.openLink) {
      webAppInstance.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <EitaaContext.Provider
      value={{
        isEitaaEnvironment,
        eitaaUser,
        rawInitData,
        themeParams,
        webApp: webAppInstance,
        showAlert,
        showConfirm,
        closeApp,
        openExternalLink
      }}
    >
      {children}
    </EitaaContext.Provider>
  );
}

export function useEitaa() {
  const context = useContext(EitaaContext);
  if (!context) {
    throw new Error('useEitaa must be used within an EitaaProvider');
  }
  return context;
}
