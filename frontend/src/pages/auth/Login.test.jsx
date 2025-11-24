import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Login from './Login';
import AuthContext from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';

// Mock fetch
window.fetch = vi.fn();

// Mock toastify
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
    ToastContainer: () => <div data-testid="mock-toast-container" />,
  };
});

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.login.title': 'Sign In',
        'auth.login.username': 'Username',
        'auth.login.password': 'Password',
        'auth.login.signInButton': 'Sign In',
        'auth.login.loginFailed': 'Login failed',
        'auth.login.welcomeBack': 'Welcome back!',
        'auth.login.failedToLogin': 'Failed to login'
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock keyboard navigation utils
vi.mock('../../utils/keyboardNavigation', () => ({
  createFormKeyboardHandler: () => () => {},
  trapFocus: () => () => {},
}));

const mockLogin = vi.fn();

const mockContext = {
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  user: null,
  loading: false,
};

const theme = createTheme();

const renderWithProviders = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={mockContext}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a successful response for fetch by default
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'fake-token' }),
    });
  });

  it('renders username and password inputs', () => {
    renderWithProviders();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    expect(screen.getByTestId('password')).toBeInTheDocument();
  });

  it('calls login and shows success toast on submit', async () => {
    const user = userEvent.setup();
    renderWithProviders();
    
    const usernameInput = screen.getByRole('textbox', { name: /username/i });
    const passwordInput = screen.getByTestId('password').querySelector('input');
    
    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'securepass');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the fetch and login to be called
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('username'),
        })
      );
    });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    expect(toast.success).toHaveBeenCalled();
  });
  it('shows error toast when login fails', async () => {
    const user = userEvent.setup();
    // Setup a failed response
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Login failed' }),
    });

    renderWithProviders();
    
    const usernameInput = screen.getByRole('textbox', { name: /username/i });
    const passwordInput = screen.getByTestId('password').querySelector('input');
    
    await user.type(usernameInput, 'fail');
    await user.type(passwordInput, 'wrong');

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
