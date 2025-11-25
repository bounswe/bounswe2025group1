import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword';

// Mock fetch
window.fetch = vi.fn();

// Mock toast
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      info: vi.fn(),
      error: vi.fn(),
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
    // Setup a successful response by default
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ detail: 'Success' }),
    });
  });

  it('renders email input and submit button', () => {
    renderPage();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('calls toast.info when email is submitted', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(
        'Reset link has been sent if such an email exists.',
        expect.any(Object)
      );
    });

    expect(screen.getByText(/please check your email/i)).toBeInTheDocument();
  });

  it('shows error when API call fails', async () => {
    // Setup a failed response
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Failed to send reset link.' }),
    });

    renderPage();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to send reset link.');
    });
  });
});
