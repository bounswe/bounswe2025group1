import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
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

const mockLogin = vi.fn();

const mockContext = {
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  currentUser: null,
  loading: false,
};

const renderWithProviders = () =>
  render(
    <AuthContext.Provider value={mockContext}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
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
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
  it('calls login and shows success toast on submit', async () => {
    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'securepass' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

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
    // Setup a failed response
    fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Login failed' }),
    });

    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'fail' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });
});
