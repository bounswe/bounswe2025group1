import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, beforeEach, test, expect } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Brightness7: () => <div data-testid="light-mode-icon">LightMode</div>,
  Brightness4: () => <div data-testid="dark-mode-icon">DarkMode</div>,
  Contrast: () => <div data-testid="contrast-icon">Contrast</div>,
  Palette: () => <div data-testid="palette-icon">Palette</div>,
}));

// Mock the theme context
const mockThemeContext = {
  currentTheme: 'light',
  changeTheme: vi.fn(),
  toggleHighContrast: vi.fn(),
  availableThemes: ['light', 'dark', 'highContrast'],
  isHighContrast: false,
  isDarkMode: false,
};

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => mockThemeContext,
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'theme.changeTheme': 'Change theme',
        'theme.chooseTheme': 'Choose Theme',
        'theme.light': 'Light Mode',
        'theme.dark': 'Dark Mode',
        'theme.highContrast': 'High Contrast',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  test('opens theme menu when clicked', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    expect(screen.getByText('Choose Theme')).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('High Contrast')).toBeInTheDocument();
  });

  test('calls changeTheme when theme option is selected', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    const darkModeOption = screen.getByText('Dark Mode');
    fireEvent.click(darkModeOption);
    
    expect(mockThemeContext.changeTheme).toHaveBeenCalledWith('dark');
  });

  test('calls changeTheme when High Contrast is selected', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    const highContrastOption = screen.getByText('High Contrast');
    fireEvent.click(highContrastOption);
    
    expect(mockThemeContext.changeTheme).toHaveBeenCalledWith('highContrast');
  });
});
