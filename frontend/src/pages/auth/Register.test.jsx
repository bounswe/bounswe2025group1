import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    <BrowserRouter>
      <Register />
    </BrowserRouter>
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
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
    expect(passwordInput).toBeInTheDocument();
    expect(confirmPasswordInput).toBeInTheDocument();

    expect(screen.getByText(/i agree to the terms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeDisabled();
  });

  it('shows error toast if user submits invalid form', async () => {
    renderPage();

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'janedoe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'invalidemail' },
    });

    const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });

    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    const button = screen.getByRole('button', { name: /sign up/i });

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

  it('calls register and shows success toast on valid form submit', async () => {
    renderPage();

    // Fill in valid form data
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'johndoe' } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/location/i), {
      target: { value: 'New York' },
    });

    const [passwordInput, confirmPasswordInput] = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'StrongP@ss1' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongP@ss1' } });

    // Accept terms
    fireEvent.click(screen.getByLabelText(/i agree to the terms/i));

    // Wait for button to be enabled and click it
    let button;
    await waitFor(() => {
      button = screen.getByRole('button', { name: /sign up/i });
      expect(button).toBeEnabled();
    });

    fireEvent.click(button);

    // Verify the API is called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('johndoe'),
        })
      );
    });

    // Verify the register function is called
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    // Verify the success toast and navigation
    expect(toast.success).toHaveBeenCalledWith('Welcome to the community!', expect.anything());
    expect(mockNavigate).toHaveBeenCalledWith('/');
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
