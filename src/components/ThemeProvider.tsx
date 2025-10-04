import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAppStore } from '@/store';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSettings } = useAppStore();
  const [theme, setTheme] = useState<Theme>(settings.darkMode ? 'dark' : 'light');

  // Sync with settings changes
  useEffect(() => {
    setTheme(settings.darkMode ? 'dark' : 'light');
  }, [settings.darkMode]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = async () => {
    const newDarkMode = !settings.darkMode;
    await updateSettings({ darkMode: newDarkMode });
    setTheme(newDarkMode ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
