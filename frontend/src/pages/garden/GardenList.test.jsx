import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GardenList from './GardenList';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: () => ({
    token: 'mock-token',
    currentUser: { id: 1, username: 'testuser' }
  })
}));

vi.mock('../../components/GardenModal', () => ({
  __esModule: true,
  default: ({ open }) => open ? <div data-testid="mock-garden-modal">Modal Open</div> : null
}));


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

beforeEach(() => {
  vi.clearAllMocks();
});

const renderPage = () => render(
  <BrowserRouter>
    <GardenList />
  </BrowserRouter>
);

describe('GardenList', () => {
  it('renders loading state', async () => {
    window.fetch = vi.fn(() =>
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve([])
      }), 100))
    );
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows gardens and allows navigation', async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'My Garden', description: 'A lovely garden', location: 'Testland', members: 2, tasks: 3 }
      ])
    });

    renderPage();

    await waitFor(() => expect(screen.getByText(/My Garden/i)).toBeInTheDocument());
    expect(screen.getByText(/A lovely garden/i)).toBeInTheDocument();
    expect(screen.getByText(/Testland/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Garden/i })).toBeInTheDocument();
  });

  it('opens modal on FAB click', async () => {
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([])
    });

    renderPage();
    await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /create garden/i }));
    expect(screen.getByTestId('mock-garden-modal')).toBeInTheDocument();
  });
});
