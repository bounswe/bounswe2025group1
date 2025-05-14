import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Tasks from './Tasks';
import AuthContext from '../../contexts/AuthContextUtils';

window.fetch = vi.fn();

const mockContext = {
  currentUser: { id: 1, username: 'testuser' },
  token: 'fake-token',
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    getGardens: vi.fn().mockResolvedValue({ data: [{ id: 1, name: 'Test Garden' }] }),
    getWeather: vi.fn().mockResolvedValue({ data: { temp: 22, city: 'Istanbul' } }),
    getPosts: vi.fn().mockResolvedValue({ data: [] }),
  };
});

const renderWithProviders = () =>
  render(
    <AuthContext.Provider value={mockContext}>
      <BrowserRouter>
        <Tasks />
      </BrowserRouter>
    </AuthContext.Provider>
  );

describe('Tasks page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // First mock for profile response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        username: 'testuser'
      })
    });
    
    // Second mock for memberships response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { status: 'ACCEPTED', username: 'testuser', garden: 1 }
      ])
    });
    
    // Third mock for tasks response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        {
          id: 1,
          title: 'Test Task',
          status: 'PENDING',
          deadline: '2025-05-25T00:00:00Z',
          assignees: [],
          assigned_to: 1
        }
      ])
    });
  });

  it('renders loading spinner initially', () => {
    renderWithProviders();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays tasks, weather, and calendar', async () => {
    renderWithProviders();


    await waitFor(() => {
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
    });
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Weather Update' })).not.toHaveLength(0);
    expect(screen.getByText(/Task Calendar/i)).toBeInTheDocument();
  });
  it('handles failed fetch gracefully', async () => {
    // Clear previous mocks
    vi.clearAllMocks();
    
    // Mock the fetch to reject with error
    fetch.mockRejectedValueOnce(new Error('Failed'));
    
    renderWithProviders();
    
    // Wait for loading spinner to disappear
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });
});
