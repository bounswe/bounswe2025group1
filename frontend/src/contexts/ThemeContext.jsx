import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme, highContrastTheme } from '../themes/themeConfig';

// Helper to check if current language is RTL
const isRTLLanguage = (lang) => {
  const RTL_LANGUAGES = ['ar', 'fa', 'ur'];
  return RTL_LANGUAGES.includes(lang);
};

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
  if (savedTheme && ['light', 'dark', 'highContrast'].includes(savedTheme)) {
    return savedTheme;
  }
  
  // If no saved preference, check system preference for dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const getInitialFontSize = () => {
  const savedFontSize = localStorage.getItem('garden-planner-font-size');
  if (savedFontSize && ['small', 'medium', 'large'].includes(savedFontSize)) {
    return savedFontSize;
  }
  return 'medium'; // Default to medium
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(getInitialTheme);
  const [currentFontSize, setCurrentFontSize] = useState(getInitialFontSize);
  const [direction, setDirection] = useState('ltr');
  
  // Get language from localStorage or window object
  const getCurrentLanguage = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('i18nextLng') || window.navigator?.language?.split('-')[0] || 'en';
    }
    return 'en';
  };

  // Initialize direction on mount and listen for changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const currentLanguage = getCurrentLanguage();
      const isRTL = isRTLLanguage(currentLanguage);
      setDirection(isRTL ? 'rtl' : 'ltr');
    };

    // Set initial direction
    handleLanguageChange();

    // Check periodically for language changes
    const interval = setInterval(handleLanguageChange, 1000);
    return () => clearInterval(interval);
  }, []);

  // Create themes with current direction
  const themes = {
    light: { ...lightTheme, direction },
    dark: { ...darkTheme, direction },
    highContrast: { ...highContrastTheme, direction },
  };


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

  // Save font size preference and update CSS variables
  useEffect(() => {
    localStorage.setItem('garden-planner-font-size', currentFontSize);
    
    // Update CSS custom properties for font sizes
    const root = document.documentElement;
    
    const fontSizeMultipliers = {
      small: 0.875,  // 14px base
      medium: 1,     // 16px base
      large: 1.125   // 18px base
    };
    
    const multiplier = fontSizeMultipliers[currentFontSize];
    
    // Set font size CSS variables
    root.style.setProperty('--font-size-xs', `${0.75 * multiplier}rem`);
    root.style.setProperty('--font-size-sm', `${0.875 * multiplier}rem`);
    root.style.setProperty('--font-size-base', `${1 * multiplier}rem`);
    root.style.setProperty('--font-size-lg', `${1.125 * multiplier}rem`);
    root.style.setProperty('--font-size-xl', `${1.25 * multiplier}rem`);
    root.style.setProperty('--font-size-2xl', `${1.5 * multiplier}rem`);
    root.style.setProperty('--font-size-3xl', `${1.875 * multiplier}rem`);
    root.style.setProperty('--font-size-4xl', `${2.25 * multiplier}rem`);
    
    // Update base font size
    root.style.fontSize = `${multiplier}rem`;
  }, [currentFontSize]);

  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  const changeFontSize = (fontSize) => {
    if (['small', 'medium', 'large'].includes(fontSize)) {
      setCurrentFontSize(fontSize);
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
    currentFontSize,
    changeFontSize,
    availableFontSizes: ['small', 'medium', 'large'],
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={themes[currentTheme]}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
