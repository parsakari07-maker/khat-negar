import React, { type ReactNode } from 'react';
import { SettingsProvider, useSettings } from './SettingsContext.js';

export function LogoProvider({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}

export function useLogo() {
  const { logoUrl, isCustom, setCustomLogo, resetLogo } = useSettings();
  return {
    logoUrl,
    isCustom,
    setCustomLogo,
    resetLogo
  };
}
