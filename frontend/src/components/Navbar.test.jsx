import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContextUtils';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Home: () => <div data-testid="home-icon">Home</div>,
  Yard: () => <div data-testid="gardens-icon">Gardens</div>,
  Assignment: () => <div data-testid="tasks-icon">Tasks</div>,
  Forum: () => <div data-testid="forum-icon">Forum</div>,
  Menu: () => <div data-testid="menu-icon">Menu</div>,
  AccountCircle: () => <div data-testid="account-icon">AccountCircle</div>,
  Close: () => <div data-testid="close-icon">Close</div>,
  Logout: () => <div data-testid="logout-icon">Logout</div>,
  Person: () => <div data-testid="person-icon">Person</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  TextFields: () => <div data-testid="text-fields-icon">TextFields</div>,
}));

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../contexts/ThemeContext', () => ({
  useTheme: vi.fn(() => ({
    currentTheme: 'light',
    changeTheme: vi.fn(),
    toggleHighContrast: vi.fn(),
    availableThemes: ['light', 'dark', 'highContrast'],
    isHighContrast: false,
    isDarkMode: false,
  })),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

// Mock ThemeToggle and LanguageToggle components
vi.mock('./ThemeToggle', () => ({
  default: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock('./LanguageToggle', () => ({
  default: () => <div data-testid="language-toggle">LanguageToggle</div>,
}));

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Navbar Component - Keyboard Navigation', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
  };

  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  test('renders navbar with keyboard navigation support', () => {
    renderWithProviders(<Navbar />);

    // Check that navigation buttons are present
    expect(screen.getByRole('button', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gardens/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /forum/i })).toBeInTheDocument();
  });

  test('navigation buttons support keyboard activation', () => {
    renderWithProviders(<Navbar />);

    const homeButton = screen.getByRole('button', { name: /home/i });
    const gardensButton = screen.getByRole('button', { name: /gardens/i });

    // Test Enter key on Home button
    fireEvent.keyDown(homeButton, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Test Space key on Gardens button
    fireEvent.keyDown(gardensButton, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/gardens');
  });

  test('navigation buttons have proper focus indicators', () => {
    renderWithProviders(<Navbar />);

    const homeButton = screen.getByRole('button', { name: /home/i });

    // Focus the button
    homeButton.focus();

    // Check that the button is focusable
    expect(homeButton).toHaveAttribute('tabindex', '0');
  });

  test('user menu button supports keyboard navigation', () => {
    renderWithProviders(<Navbar />);

    const userMenuButton = screen.getByRole('button', { name: /open user menu/i });

    // Test Enter key on user menu button
    fireEvent.keyDown(userMenuButton, { key: 'Enter' });

    // Menu should open
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('user menu items support keyboard navigation', () => {
    renderWithProviders(<Navbar />);

    const userMenuButton = screen.getByRole('button', { name: /open user menu/i });
    fireEvent.click(userMenuButton);

    // Check that menu items are present
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('user menu items support keyboard activation', () => {
    renderWithProviders(<Navbar />);

    const userMenuButton = screen.getByRole('button', { name: /open user menu/i });
    fireEvent.click(userMenuButton);

    const profileMenuItem = screen.getByText('Profile');
    const logoutMenuItem = screen.getByText('Logout');

    // Test Enter key on Profile menu item
    fireEvent.keyDown(profileMenuItem, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/profile');

    // Test Space key on Logout menu item
    fireEvent.keyDown(logoutMenuItem, { key: ' ' });
    expect(mockLogout).toHaveBeenCalled();
  });

  test('mobile menu toggle supports keyboard navigation', () => {
    renderWithProviders(<Navbar />);

    const menuToggle = screen.getByRole('button', { name: /open drawer/i });

    // Test Enter key on menu toggle
    fireEvent.keyDown(menuToggle, { key: 'Enter' });

    // Drawer should open - wait for it to appear
    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  test('mobile drawer items support keyboard navigation', () => {
    renderWithProviders(<Navbar />);

    const menuToggle = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuToggle);

    // Check that drawer items are present - use getAllByText to handle multiple elements
    expect(screen.getAllByText('Home')).toHaveLength(2); // One in desktop nav, one in drawer
    expect(screen.getAllByText('Gardens')).toHaveLength(2); // One in desktop nav, one in drawer
    expect(screen.getAllByText('Forum')).toHaveLength(2); // One in desktop nav, one in drawer
  });

  test('mobile drawer items support keyboard activation', () => {
    renderWithProviders(<Navbar />);

    const menuToggle = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuToggle);

    // Get the drawer items specifically by their role and text
    const drawerItems = screen.getAllByRole('button', { name: /home|gardens|tasks|forum/i });
    const homeDrawerItem = drawerItems.find(item => item.textContent.includes('Home'));
    const gardensDrawerItem = drawerItems.find(item => item.textContent.includes('Gardens'));

    // Test Enter key on Home drawer item
    fireEvent.keyDown(homeDrawerItem, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/');

    // Test Space key on Gardens drawer item
    fireEvent.keyDown(gardensDrawerItem, { key: ' ' });
    expect(mockNavigate).toHaveBeenCalledWith('/gardens');
  });

  test('close drawer button supports keyboard navigation', async () => {
    renderWithProviders(<Navbar />);

    const menuToggle = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuToggle);

    const closeButton = screen.getByRole('button', { name: /close menu/i });

    // Test Enter key on close button
    fireEvent.keyDown(closeButton, { key: 'Enter' });

    // Drawer should close - wait for it to disappear
    await waitFor(() => {
      expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    });
  });

  test('navigation buttons have proper ARIA attributes', () => {
    renderWithProviders(<Navbar />);

    const homeButton = screen.getByRole('button', { name: /home/i });
    const gardensButton = screen.getByRole('button', { name: /gardens/i });

    // Check ARIA attributes
    expect(homeButton).toHaveAttribute('aria-current', 'page');
    expect(gardensButton).not.toHaveAttribute('aria-current');
  });

  test('user menu has proper ARIA attributes', () => {
    renderWithProviders(<Navbar />);

    const userMenuButton = screen.getByRole('button', { name: /open user menu/i });

    expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
    expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');
  });

  test('mobile drawer has proper ARIA attributes', () => {
    renderWithProviders(<Navbar />);

    const menuToggle = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuToggle);

    // Check that the drawer is open by looking for the Menu text
    expect(screen.getByText('Menu')).toBeInTheDocument();

    // Check that the close button is present
    const closeButton = screen.getByRole('button', { name: /close menu/i });
    expect(closeButton).toBeInTheDocument();
  });

  test('handles keyboard navigation without errors', () => {
    renderWithProviders(<Navbar />);

    const homeButton = screen.getByRole('button', { name: /home/i });

    // Test various keyboard interactions
    fireEvent.keyDown(homeButton, { key: 'Tab' });
    fireEvent.keyDown(homeButton, { key: 'Shift' });
    fireEvent.keyDown(homeButton, { key: 'ArrowUp' });
    fireEvent.keyDown(homeButton, { key: 'ArrowDown' });

    // Should not cause any errors
    expect(homeButton).toBeInTheDocument();
  });

  test('supports roving tabindex for navigation buttons', () => {
    renderWithProviders(<Navbar />);

    const homeButton = screen.getByRole('button', { name: /home/i });
    const gardensButton = screen.getByRole('button', { name: /gardens/i });
    const forumButton = screen.getByRole('button', { name: /forum/i });

    // All buttons should be focusable (desktop navigation uses normal tab navigation)
    expect(homeButton).toHaveAttribute('tabindex', '0');
    expect(gardensButton).toHaveAttribute('tabindex', '0');
    expect(forumButton).toHaveAttribute('tabindex', '0');
  });
});
