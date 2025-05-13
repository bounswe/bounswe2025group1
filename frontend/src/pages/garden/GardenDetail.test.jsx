import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GardenDetail from './GardenDetail';
import { useAuth } from '../../contexts/AuthContextUtils';

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

vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

window.fetch = vi.fn();

const mockGarden = {
  id: 1,
  name: 'My Garden',
  location: 'Testland',
  description: 'A lovely test garden.',
  members: 2,
  tasks: 3,
  is_public: true,
};

const mockTasks = [
  {
    id: 1,
    title: 'Water plants',
    due_date: new Date().toISOString(),
    status: 'PENDING'
  },
  {
    id: 2,
    title: 'Harvest cucumbers',
    due_date: new Date().toISOString(),
    status: 'COMPLETED'
  }
];

describe('GardenDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      token: 'fake-token',
      currentUser: { username: 'testuser' },
    });

    fetch.mockImplementation((url) => {
      if (url.includes('/gardens/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGarden) });
      }
      if (url.includes('/tasks/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTasks) });
      }
      if (url.includes('/task-types/')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('renders garden header and tabs', async () => {
    render(
      <BrowserRouter>
        <GardenDetail />
      </BrowserRouter>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/My Garden/i)).toBeInTheDocument();
      expect(screen.getByText(/Testland/i)).toBeInTheDocument();
      expect(screen.getByText(/2 Members/i)).toBeInTheDocument();
      expect(screen.getByText(/3 Tasks/i)).toBeInTheDocument();
    });
  });

  it('opens Add Task modal when button clicked', async () => {
    render(
      <BrowserRouter>
        <GardenDetail />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByRole('button', { name: /Add Task/i }));

    const addTaskButton = screen.getAllByRole('button', { name: /Add Task/i })[0];
    fireEvent.click(addTaskButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Task/i })).toBeInTheDocument();
    });
  });

  it('shows tasks inside TaskBoard', async () => {
    render(
      <BrowserRouter>
        <GardenDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Water plants/i)).toBeInTheDocument();
      expect(screen.getByText(/Harvest cucumbers/i)).toBeInTheDocument();
    });
  });
});
