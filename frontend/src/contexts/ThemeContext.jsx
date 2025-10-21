import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { themes } from '../themes/themeConfig';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const getInitialTheme = () => {
  // First check localStorage for saved preference
  const savedTheme = localStorage.getItem('garden-planner-theme');
  if (savedTheme && themes[savedTheme]) {
    return savedTheme;
  }
  
  // If no saved preference, check system preference for dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);

  // Save theme preference to localStorage and update CSS whenever theme changes
  useEffect(() => {
    localStorage.setItem('garden-planner-theme', currentTheme);
    
    // Update CSS custom properties for theme
    const root = document.documentElement;
    
    if (currentTheme === 'dark') {
      root.style.setProperty('--scrollbar-track', 'rgba(124, 179, 66, 0.1)');
      root.style.setProperty('--scrollbar-thumb', 'rgba(124, 179, 66, 0.4)');
      root.style.setProperty('--scrollbar-thumb-hover', 'rgba(124, 179, 66, 0.6)');
    } else if (currentTheme === 'highContrast') {
      root.style.setProperty('--scrollbar-track', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--scrollbar-thumb', 'rgba(0, 0, 0, 0.8)');
      root.style.setProperty('--scrollbar-thumb-hover', 'rgba(0, 0, 0, 1)');
    } else {
      root.style.setProperty('--scrollbar-track', 'rgba(85, 139, 47, 0.06)');
      root.style.setProperty('--scrollbar-thumb', 'rgba(85, 139, 47, 0.36)');
      root.style.setProperty('--scrollbar-thumb-hover', 'rgba(85, 139, 47, 0.58)');
    }

    // Announce theme change to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    const themeNames = {
      light: 'Light mode',
      dark: 'Dark mode',
      highContrast: 'High contrast mode'
    };
    
    announcement.textContent = `Theme changed to ${themeNames[currentTheme]}`;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [currentTheme]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const toggleHighContrast = () => {
    setCurrentTheme(currentTheme === 'highContrast' ? 'light' : 'highContrast');
  };

  const contextValue = {
    currentTheme,
    changeTheme,
    toggleHighContrast,
    isHighContrast: currentTheme === 'highContrast',
    isDarkMode: currentTheme === 'dark',
    availableThemes: Object.keys(themes),
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={themes[currentTheme]}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
