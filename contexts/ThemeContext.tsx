import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  activeTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const systemColorScheme = useSystemColorScheme();

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@dark_mode');
      if (savedTheme === 'true') {
        setThemeState('dark');
      } else if (savedTheme === 'false') {
        setThemeState('light');
      } else {
        setThemeState('system');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      if (newTheme === 'dark') {
        await AsyncStorage.setItem('@dark_mode', 'true');
      } else if (newTheme === 'light') {
        await AsyncStorage.setItem('@dark_mode', 'false');
      } else {
        await AsyncStorage.removeItem('@dark_mode');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = activeTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Xác định theme đang active (light hoặc dark)
  const activeTheme: 'light' | 'dark' = 
    theme === 'system' 
      ? (systemColorScheme === 'dark' ? 'dark' : 'light')
      : theme;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        activeTheme,
        setTheme, 
        toggleTheme, 
        isDarkMode: activeTheme === 'dark' 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};