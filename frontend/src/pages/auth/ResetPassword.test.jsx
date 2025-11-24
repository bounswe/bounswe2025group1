import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResetPassword from './ResetPassword';
import { toast } from 'react-toastify';

// Mock fetch for API calls
window.fetch = vi.fn();

// Mock toast
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      error: vi.fn(),
      success: vi.fn(),
    },
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'auth.resetPassword.title': 'Reset Your Password',
        'auth.resetPassword.newPassword': 'New Password',
        'auth.resetPassword.confirmPassword': 'Confirm Password',
        'auth.resetPassword.resetButton': 'Reset Password',
        'auth.resetPassword.tokenMissing': 'Reset token is missing.',
        'auth.resetPassword.invalidToken': 'Invalid or missing reset token.',
        'auth.resetPassword.passwordMismatch': 'Passwords do not match.',
        'auth.resetPassword.passwordRequirements': 'Password does not meet all requirements.',
        'auth.resetPassword.success': 'Password reset successfully! You can now log in with your new password.',
        'auth.resetPassword.failed': 'Failed to reset password. Please try again.'
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

const theme = createTheme();

const renderWithToken = (token = 'mock-token') =>
  render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[`/reset-password${token ? `?token=${token}` : ''}`]}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default success response for fetch
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Password reset successful' }),
    });
  });

  it('renders form with a token', () => {
    renderWithToken();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(document.querySelector('button[type="submit"]')).toBeDisabled();
  });

  it('shows error if no token is present', () => {
    renderWithToken(null);
    expect(screen.getByText(/invalid.*token/i)).toBeInTheDocument();
  });

  it('allows typing in password fields', async () => {
    const user = userEvent.setup();
    renderWithToken();

    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]');
    
    await user.type(passwordInput, 'StrongP@ss1');
    await user.type(confirmPasswordInput, 'StrongP@ss1');

    expect(passwordInput.value).toBe('StrongP@ss1');
    expect(confirmPasswordInput.value).toBe('StrongP@ss1');
  });

  it('renders submit button', () => {
    renderWithToken();
    const button = document.querySelector('button[type="submit"]');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled(); // Should start disabled
  });

  it('renders form elements correctly', () => {
    renderWithToken();
    
    // Check that the form renders with proper elements
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(document.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
    expect(document.querySelector('button[type="submit"]')).toBeInTheDocument();
  });
});
