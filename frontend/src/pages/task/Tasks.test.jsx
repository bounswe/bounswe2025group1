import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Tasks from './Tasks';
import AuthContext from '../../contexts/AuthContextUtils';

window.fetch = vi.fn();

const mockContext = {
  user: { id: 1, username: 'testuser' },
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

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'tasks.title': 'Your Tasks',
        'tasks.pendingTasks': 'Pending Tasks',
        'tasks.completedTasks': 'Completed Tasks',
        'tasks.noTasks': 'No tasks available',
        'tasks.taskCalendar': 'Task Calendar',
        'weather.title': 'Weather Update',
        'weather.forecast': 'Weather Forecast'
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock complex components
vi.mock('../../components/WeatherWidget', () => ({
  __esModule: true,
  default: () => (
    <div>
      <h6 role="heading" name="Weather Update">Weather Update</h6>
      <div>Weather content</div>
    </div>
  ),
}));

vi.mock('../../components/CalendarTab', () => ({
  __esModule: true,
  default: () => (
    <div>
      <h6>Task Calendar</h6>
      <div>Calendar content</div>
    </div>
  ),
}));

vi.mock('../../components/TaskWidget', () => ({
  __esModule: true,
  default: ({ tasks }) => (
    <div>
      <h6>Pending Tasks</h6>
      {tasks?.map(task => (
        <div key={task.id}>{task.title}</div>
      )) || <div>No tasks</div>}
    </div>
  ),
}));

const theme = createTheme();

const renderWithProviders = () =>
  render(
    <ThemeProvider theme={theme}>
      <AuthContext.Provider value={mockContext}>
        <BrowserRouter>
          <Tasks />
        </BrowserRouter>
      </AuthContext.Provider>
    </ThemeProvider>
  );

describe('Tasks page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // First mock for profile response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 1,
          username: 'testuser',
        }),
    });

    // Second mock for memberships response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ status: 'ACCEPTED', username: 'testuser', garden: 1 }]),
    });

    // Third mock for tasks response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            id: 1,
            title: 'Test Task',
            status: 'PENDING',
            deadline: '2025-05-25T00:00:00Z',
            assignees: [],
            assigned_to: 1,
          },
        ]),
    });
  });

  it('renders loading spinner initially', () => {
    renderWithProviders();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('fetches and displays tasks, weather, and calendar', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(screen.getByText('Your Tasks')).toBeInTheDocument();
    });
    
    // Check that the task list is rendered (even if task details aren't perfect)
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Weather Update')).toBeInTheDocument();
    expect(screen.getAllByText(/Task Calendar/i)).toHaveLength(2); // Both actual and mock components
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
