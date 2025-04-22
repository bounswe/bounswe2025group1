import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';
import { waitFor } from '@testing-library/react';

// Mock toast
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      info: vi.fn(),
    },
    ToastContainer: () => <div data-testid="mock-toast-container" />,
  };
});
import { toast } from 'react-toastify';

const renderPage = () =>
  render(
    <BrowserRouter>
      <ForgotPassword />
    </BrowserRouter>
  );

describe('ForgotPassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input and submit button', () => {
    renderPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('calls toast.info when email is submitted', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(toast.info).toHaveBeenCalledWith(
      'Reset link has been sent if such an email exists.',
      expect.any(Object)
    );
    expect(screen.getByText(/please check your email/i)).toBeInTheDocument();
  });
});
