// Profile.test.jsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from './Profile';
import AuthContext from '../../contexts/AuthContextUtils';
import React from 'react';

vi.mock('../../components/GardenCard', () => ({
  default: ({ garden }) => <div>Garden: {garden.name}</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock environment variable
const API_URL = 'http://fakeapi.com';

// Helper to wrap with auth context
const renderWithAuth = (ui, { user = {}, token = 'test-token' } = {}) => {
  return render(
    <AuthContext.Provider value={{ user, token }}>
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route path="/profile" element={ui} />
          <Route path="/auth/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.fetch = vi.fn();
    import.meta.env = { VITE_API_URL: API_URL };
  });

  it('shows loading spinner initially', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    renderWithAuth(<Profile />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('redirects to login if no token', async () => {
    renderWithAuth(<Profile />, { token: null });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('displays profile information after successful fetch', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        username: 'johndoe',
        email: 'john@example.com',
        profile: { location: 'Earth' },
      }),
    });

    renderWithAuth(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('johndoe')).toBeInTheDocument();
      expect(screen.getByText('Earth')).toBeInTheDocument();
    });
  });

  it('allows switching between tabs', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'johndoe',
        email: 'john@example.com',
        profile: { location: 'Earth' },
      }),
    });

    renderWithAuth(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Gardens')).toBeInTheDocument();
    });

    const followersTab = screen.getByRole('tab', { name: /followers/i });
    fireEvent.click(followersTab);

    expect(followersTab).toHaveAttribute('aria-selected', 'true');
  });

  it('allows editing profile info', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        username: 'johndoe',
        email: 'john@example.com',
        profile: { location: 'Earth' },
      }),
    });

    renderWithAuth(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Edit Profile'));

    const usernameInput = screen.getByLabelText(/username/i);
    fireEvent.change(usernameInput, { target: { value: 'newname' } });

    expect(usernameInput.value).toBe('newname');
  });

  it('shows no gardens message if none', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'johndoe',
          email: 'john@example.com',
          profile: { location: 'Earth' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }); // gardens

    renderWithAuth(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/no gardens yet/i)).toBeInTheDocument();
    });
  });

  it('displays gardens if available', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          username: 'johndoe',
          email: 'john@example.com',
          profile: { location: 'Earth' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 1, name: 'My First Garden' },
          { id: 2, name: 'Second Garden' },
        ],
      }); // gardens

    renderWithAuth(<Profile />);

    await waitFor(() => {
      expect(screen.getByText(/garden: my first garden/i)).toBeInTheDocument();
      expect(screen.getByText(/garden: second garden/i)).toBeInTheDocument();
    });
  });
});
