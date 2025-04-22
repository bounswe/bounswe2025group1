import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import AuthContext from '../../contexts/AuthContextUtils';

// ✅ Replace `jest.mock` with `vi.mock`
vi.mock('react-toastify', async () => {
  const actual = await vi.importActual('react-toastify');
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn()
    },
    ToastContainer: () => <div data-testid="mock-toast-container" />
  };
});

const mockLogin = vi.fn(() => true);

const mockContext = {
  login: mockLogin,
  register: vi.fn(),
  logout: vi.fn(),
  currentUser: null,
  loading: false
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
  it('renders email and password inputs', () => {
    renderWithProviders();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('calls login and shows success toast on submit', () => {
    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'securepass' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        name: 'Demo User',
        id: '123456'
      })
    );
    
  });

  it('shows error toast when login fails', () => {
    mockLogin.mockImplementationOnce(() => {
      throw new Error('login failed');
    });
    renderWithProviders();
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'fail@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrong' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockLogin).toHaveBeenCalled();
  });
});
