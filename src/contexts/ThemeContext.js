import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme';

const lightTheme = {
  mode: 'light',
  COLORS: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#10B981',
    secondary: '#6B7280',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    border: '#E5E7EB',
    // ...add more as needed
  },
};

const darkTheme = {
  mode: 'dark',
  COLORS: {
    background: '#18181B',
    card: '#23232A',
    text: '#F3F4F6',
    textSecondary: '#A1A1AA',
    primary: '#10B981',
    secondary: '#A1A1AA',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    info: '#60A5FA',
    border: '#27272A',
    // ...add more as needed
  },
};

const ThemeContext = createContext({
  theme: lightTheme,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(THEME_KEY);
      if (saved === 'dark') setTheme(darkTheme);
      else if (saved === 'light') setTheme(lightTheme);
      else {
        // Default to system
        const colorScheme = Appearance.getColorScheme();
        setTheme(colorScheme === 'dark' ? darkTheme : lightTheme);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    if (theme.mode === 'light') {
      setTheme(darkTheme);
      await AsyncStorage.setItem(THEME_KEY, 'dark');
    } else {
      setTheme(lightTheme);
      await AsyncStorage.setItem(THEME_KEY, 'light');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 