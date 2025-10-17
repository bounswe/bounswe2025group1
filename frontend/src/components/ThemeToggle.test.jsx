import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../contexts/ThemeContext';

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

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders theme toggle button', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it('opens theme menu when clicked', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    expect(screen.getByText('Choose Theme')).toBeInTheDocument();
    expect(screen.getByText('Light Mode')).toBeInTheDocument();
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('High Contrast')).toBeInTheDocument();
  });

  it('calls changeTheme when theme option is selected', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    const darkModeOption = screen.getByText('Dark Mode');
    fireEvent.click(darkModeOption);
    
    expect(mockThemeContext.changeTheme).toHaveBeenCalledWith('dark');
  });

  it('calls toggleHighContrast when toggle option is selected', () => {
    render(<ThemeToggle />);
    
    const themeButton = screen.getByRole('button', { name: /change theme/i });
    fireEvent.click(themeButton);
    
    const toggleOption = screen.getByText('Toggle High Contrast');
    fireEvent.click(toggleOption);
    
    expect(mockThemeContext.toggleHighContrast).toHaveBeenCalled();
  });
});
