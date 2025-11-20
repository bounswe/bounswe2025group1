import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Register from './Register';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

// Mock fetch API
window.fetch = vi.fn();

// Mock register function
const mockRegister = vi.fn();

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

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
        'auth.register.title': 'Join the Garden Community',
        'auth.register.firstName': 'First Name',
        'auth.register.lastName': 'Last Name',
        'auth.register.username': 'Username',
        'auth.register.email': 'Email Address',
        'auth.register.location': 'Location',
        'auth.register.password': 'Password',
        'auth.register.confirmPassword': 'Confirm Password',
        'auth.register.agreeTerms': 'I agree to the Terms of Service',
        'auth.register.signUp': 'Sign Up',
        'auth.register.completeAllFields': 'Please complete all fields correctly.',
        'auth.register.welcomeToCommunity': 'Welcome to the community!'
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

// Mock LocationPicker component
vi.mock('../../components/LocationPicker', () => ({
  __esModule: true,
  default: ({ value, onChange, label }) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      aria-label={label || 'Location'}
      placeholder="Enter location"
    />
  ),
}));

const theme = createTheme();

const renderPage = () =>
  render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </ThemeProvider>
  );

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup a successful response for fetch by default
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'fake-token' }),
    });
  });

  it('renders all form fields and the sign-up button', () => {
    renderPage();
    expect(screen.getByRole('textbox', { name: /first name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /last name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /username/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();

    expect(screen.getByText(/i agree to the terms/i)).toBeInTheDocument();
    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });

  it('shows error toast if user submits invalid form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'Jane');
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Doe');
    await user.type(screen.getByRole('textbox', { name: /username/i }), 'janedoe');
    await user.type(screen.getByRole('textbox', { name: /email address/i }), 'invalidemail');

    const passwordInput = document.querySelector('input[name="password"]');
    const confirmPasswordInput = screen.getByLabelText('Confirm password');
    await user.type(passwordInput, 'weak');
    await user.type(confirmPasswordInput, 'weak');

    await user.click(screen.getByLabelText(/i agree to the terms/i));

    const button = document.querySelector('button[type="submit"]');

    // Form should be invalid → button stays disabled
    expect(button).toBeDisabled();

    // Simulate submit even though button is disabled
    fireEvent.submit(button.closest('form'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Please complete all fields correctly.',
        expect.anything()
      );
    });
  });

  it('renders form and handles basic interaction', async () => {
    const user = userEvent.setup();
    renderPage();

    // Fill in some basic form data to test interaction
    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'John');
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Doe');
    
    // Verify the form is interactive
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    
    // Verify button starts disabled - use type submit since button text might vary
    const submitButton = screen.getByRole('button', { type: 'submit' }) || document.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });
});
