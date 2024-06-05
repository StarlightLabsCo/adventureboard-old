'use client';

import { useEffect } from 'react';
import { getUserPreferences } from 'tldraw';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  console.log(`[ThemeProvider] props: ${JSON.stringify(props)}`);

  const theme = useTheme();

  console.log(`[ThemeProvider] theme: ${theme}`);
  const userPreferences = getUserPreferences();

  console.log(`[ThemeProvider] userPreferences: ${JSON.stringify(userPreferences)}`);
  useEffect(() => {
    console.log(`[ThemeProvider] Setting theme to ${userPreferences.isDarkMode ? 'dark' : 'light'}`);
    if (userPreferences.isDarkMode) {
      theme.setTheme('dark');
    } else {
      theme.setTheme('light');
    }
  }, [userPreferences.isDarkMode]);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
