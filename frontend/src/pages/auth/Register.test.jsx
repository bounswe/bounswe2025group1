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

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  PersonAddIcon: () => <div data-testid="person-add-icon">PersonAddIcon</div>,
  PersonIcon: () => <div data-testid="person-icon">PersonIcon</div>,
  BadgeIcon: () => <div data-testid="badge-icon">BadgeIcon</div>,
  EmailIcon: () => <div data-testid="email-icon">EmailIcon</div>,
  LockIcon: () => <div data-testid="lock-icon">LockIcon</div>,
  CheckCircleIcon: () => <div data-testid="check-circle-icon">CheckCircleIcon</div>,
  RadioButtonUncheckedIcon: () => <div data-testid="radio-button-unchecked-icon">RadioButtonUncheckedIcon</div>,
}));

// Mock LocationPicker component
vi.mock('../../components/LocationPicker', () => ({
  default: ({ value, onChange, label, required, height }) => (
    <div data-testid="location-picker">
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{ height: height || 200 }}
        data-testid="location-input"
      />
    </div>
  ),
}));

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

  describe('Terms and Conditions Dialog', () => {
    it('opens terms and conditions dialog when link is clicked', () => {
      renderPage();

      // Click the terms and conditions link
      const termsLink = screen.getByRole('button', { name: /read terms and conditions/i });
      fireEvent.click(termsLink);

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/Terms of Service and User Agreement for Community Garden Planner/i)).toBeInTheDocument();
    });

    it('displays terms and conditions content in the dialog', () => {
      renderPage();

      // Open terms dialog
      const termsLink = screen.getByRole('button', { name: /read terms and conditions/i });
      fireEvent.click(termsLink);

      // Check for key sections in the terms
      expect(screen.getByText(/Agreement to Terms of Service/i)).toBeInTheDocument();
      expect(screen.getByText(/User Account Registration and Security/i)).toBeInTheDocument();
      expect(screen.getByText(/Privacy Policy and Data Usage/i)).toBeInTheDocument();
      expect(screen.getByText(/User-Generated Content and Intellectual Property/i)).toBeInTheDocument();
      expect(screen.getByText(/Code of Conduct and Community Guidelines/i)).toBeInTheDocument();
      expect(screen.getByText(/Disclaimer of Warranties and Limitation of Liability/i)).toBeInTheDocument();
      expect(screen.getByText(/Modifications to This Agreement/i)).toBeInTheDocument();
    });

    it('prevents closing dialog by clicking outside or pressing escape', () => {
      renderPage();

      // Open terms dialog
      const termsLink = screen.getByRole('button', { name: /read terms and conditions/i });
      fireEvent.click(termsLink);

      // Dialog should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Try to close by clicking outside (backdrop click) - should not work
      fireEvent.click(document.body);

      // Dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Try to close by pressing escape - should not work
      fireEvent.keyDown(document, { key: 'Escape' });

      // Dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('requires terms acceptance to enable sign-up button', async () => {
      renderPage();

      // Fill in all form fields except terms
      const firstNameInput = screen.getByTestId('first-name-input')
      firstNameInput.value = 'John';
      fireEvent.change(firstNameInput);
      
      const lastNameInput = screen.getByTestId('last-name-input')
      lastNameInput.value = 'Doe';
      fireEvent.change(lastNameInput);

      const usernameInput = screen.getByTestId('username-input')
      usernameInput.value = 'johndoe';
      fireEvent.change(usernameInput);

      const emailInput = screen.getByTestId('email-input')
      emailInput.value = 'john@example.com';
      fireEvent.change(emailInput);

      const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
      passwordInput.value = 'StrongP@ss1';
      fireEvent.change(passwordInput);
      confirmPasswordInput.value = 'StrongP@ss1';
      fireEvent.change(confirmPasswordInput);

      // Sign-up button should be disabled without terms acceptance
      const signUpButton = screen.getByTestId('sign-up-button');
      expect(signUpButton).toBeDisabled();
    });
  });
});
