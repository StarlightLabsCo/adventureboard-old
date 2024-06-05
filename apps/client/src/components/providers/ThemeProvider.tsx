'use client';

import { useEffect } from 'react';
import { getUserPreferences } from 'tldraw';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const theme = useTheme();
  const userPreferences = getUserPreferences();
  useEffect(() => {
    if (userPreferences.isDarkMode) {
      theme.setTheme('dark');
    } else {
      theme.setTheme('light');
    }
  }, [userPreferences]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
