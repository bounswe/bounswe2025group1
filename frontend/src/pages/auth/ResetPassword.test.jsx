import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

const renderWithToken = (token = 'mock-token') =>
  render(
    <MemoryRouter initialEntries={[`/reset-password${token ? `?token=${token}` : ''}`]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ResetPassword Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default success response for fetch
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Password reset successful' })
    });
  });

  it('renders form with a token', () => {
    renderWithToken();
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeDisabled();
  });

  it('shows error if no token is present', () => {
    renderWithToken(null);
    expect(
      screen.getByText((text) => text.includes('Invalid') && text.includes('token'))
    ).toBeInTheDocument();
  });

  it('shows error if passwords do not match', async () => {
    renderWithToken();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'StrongP@ss1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Wrong123!' } });

    const button = screen.getByRole('button', { name: /reset password/i });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match.', expect.anything());
    });
  });

  it('shows error if password does not meet requirements', async () => {
    renderWithToken();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'weak' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'weak' } });

    const button = screen.getByRole('button', { name: /reset password/i });
    fireEvent.submit(button.closest('form'));

    await waitFor(() => {
      expect(screen.getByText(/password does not meet all requirements/i)).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Password does not meet all requirements.', expect.anything());
    });
  });

  it('shows success and navigates to login on valid reset', async () => {
    renderWithToken();

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'StrongP@ss1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'StrongP@ss1' } });

    const button = screen.getByRole('button', { name: /reset password/i });
    await waitFor(() => expect(button).toBeEnabled());
    
    // Click the reset button
    fireEvent.click(button);

    // Wait for the success message and redirection
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Password reset successfully!', expect.anything());
    });
    
    expect(screen.getByText(/redirecting to login/i)).toBeInTheDocument();
  });
});
