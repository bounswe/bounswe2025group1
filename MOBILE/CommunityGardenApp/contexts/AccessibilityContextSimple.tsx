/**
 * Simplified Accessibility Context (No Persistence)
 * Remove AsyncStorage dependency
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AccessibilityTheme, ThemeKey, themes } from '@/constants/AccessibilityColors';

interface AccessibilityContextType {
  currentTheme: AccessibilityTheme;
  themeKey: ThemeKey;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  setTheme: (theme: ThemeKey) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [themeKey, setThemeKey] = useState<ThemeKey>('standard');
  const [isHighContrast, setIsHighContrast] = useState(false);

  const toggleHighContrast = () => {
    const newHighContrast = !isHighContrast;
    setIsHighContrast(newHighContrast);
    
    // Automatically switch to appropriate theme
    let newThemeKey: ThemeKey;
    if (newHighContrast) {
      newThemeKey = themeKey === 'dark' ? 'highContrastDark' : 'highContrast';
    } else {
      newThemeKey = themeKey === 'highContrastDark' ? 'dark' : 'standard';
    }
    
    setThemeKey(newThemeKey);
  };

  const setTheme = (newTheme: ThemeKey) => {
    setThemeKey(newTheme);
    
    // Update high contrast state based on theme
    const newHighContrast = newTheme === 'highContrast' || newTheme === 'highContrastDark';
    setIsHighContrast(newHighContrast);
  };

  // Get current theme based on state
  const currentTheme = themes[themeKey];

  const value: AccessibilityContextType = {
    currentTheme,
    themeKey,
    isHighContrast,
    toggleHighContrast,
    setTheme,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Hook for easy color access
export function useAccessibleColors() {
  const { currentTheme } = useAccessibility();
  return currentTheme.colors;
}

// Hook for easy theme access
export function useAccessibleTheme() {
  const { currentTheme } = useAccessibility();
  return currentTheme;
}
