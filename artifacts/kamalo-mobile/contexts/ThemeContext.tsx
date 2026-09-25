import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors, { ColorPalette } from '@/constants/colors';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ColorPalette;
}

const STORAGE_KEY = '@kamalo_theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'light',
  isDark: false,
  toggleTheme: () => {},
  setThemeMode: () => {},
  colors: colors.light,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    systemScheme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark') {
          setThemeModeState(saved);
        }
      } catch {
        // Fall back to system
      }
    }
    void loadTheme();
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    void AsyncStorage.setItem(STORAGE_KEY, mode).catch(() => {});
  };

  const toggleTheme = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
  };

  const activeColors = useMemo(() => {
    return themeMode === 'dark' ? colors.dark : colors.light;
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      isDark: themeMode === 'dark',
      toggleTheme,
      setThemeMode,
      colors: activeColors,
    }),
    [themeMode, activeColors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
