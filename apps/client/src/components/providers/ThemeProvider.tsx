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
      console.log('Setting theme to dark');
      theme.setTheme('dark');
    } else {
      console.log('Setting theme to light');
      theme.setTheme('light');
    }
  }, [userPreferences.isDarkMode]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
