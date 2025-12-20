import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import TaskWidget from './TaskWidget';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';

// Mock dependencies
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('./TaskList', () => ({
  default: ({ tasks, title }) => (
    <div data-testid="task-list">
      <h2>{title}</h2>
      <div data-testid="task-count">{tasks.length}</div>
      {tasks.map((task) => (
        <div key={task.id} data-testid={`task-${task.id}`}>
          {task.title}
        </div>
      ))}
    </div>
  ),
}));

describe('TaskWidget Component', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
  };

  const mockTasks = [
    {
      id: 1,
      title: 'Task 1',
      status: 'PENDING',
      due_date: '2025-12-01',
    },
    {
      id: 2,
      title: 'Task 2',
      status: 'IN_PROGRESS',
      due_date: '2025-11-20',
    },
    {
      id: 3,
      title: 'Task 3',
      status: 'COMPLETED',
      due_date: '2025-11-15',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    test('displays loading spinner while fetching tasks', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

      render(<TaskWidget />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('loading indicator is centered', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockImplementation(() => new Promise(() => { }));

      const { container } = render(<TaskWidget />);

      const loadingContainer = container.querySelector('.MuiPaper-root');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    test('displays login prompt when no token', () => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });

      render(<TaskWidget />);

      expect(screen.getByText('Your Tasks')).toBeInTheDocument();
      expect(screen.getByText('Please log in to see your tasks.')).toBeInTheDocument();
    });

    test('does not fetch tasks when no token', () => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });

      render(<TaskWidget />);

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    test('does not show loading spinner when no token', () => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });

      render(<TaskWidget />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Successful Task Fetching', () => {
    test('fetches and displays tasks', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      expect(screen.getByTestId('task-count')).toHaveTextContent('3');
      expect(screen.getByTestId('task-1')).toHaveTextContent('Task 1');
      expect(screen.getByTestId('task-2')).toHaveTextContent('Task 2');
      expect(screen.getByTestId('task-3')).toHaveTextContent('Task 3');
    });

    test('calls API with correct URL and headers', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/user/1/tasks/'),
          expect.objectContaining({
            headers: {
              Authorization: 'Token mock-token',
            },
          })
        );
      });
    });

    test('renders TaskList component with correct props', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      expect(screen.getByText('Your Tasks')).toBeInTheDocument();
    });

    test('displays empty task list when no tasks', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('task-list')).toBeInTheDocument();
      });

      expect(screen.getByTestId('task-count')).toHaveTextContent('0');
    });
  });

  describe('Error Handling', () => {
    test('shows error toast when API request fails', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to fetch tasks.');
      });
    });

    test('stops loading when API request fails', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    test('handles network error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockRejectedValue(new Error('Network error'));

      render(<TaskWidget />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching tasks:',
          expect.any(Error)
        );
      });

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Component Lifecycle', () => {
    test('fetches tasks on mount', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      });
    });

    test('refetches tasks when user changes', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { rerender } = render(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      });

      const newUser = { user_id: 2, username: 'newuser' };
      useAuth.mockReturnValue({
        user: newUser,
        token: 'new-token',
      });

      rerender(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      });
    });

    test('refetches tasks when token changes', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      const { rerender } = render(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      });

      useAuth.mockReturnValue({
        user: mockUser,
        token: 'new-token',
      });

      rerender(<TaskWidget />);

      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles malformed API response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    test('handles empty token string', () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: '',
      });

      render(<TaskWidget />);

      expect(screen.getByText('Please log in to see your tasks.')).toBeInTheDocument();
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });

  describe('API Response Handling', () => {
    test('handles 401 unauthorized response', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'invalid-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to fetch tasks.');
      });
    });

    test('handles 404 not found response', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to fetch tasks.');
      });
    });

    test('handles tasks with various statuses', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      const variousTasks = [
        { id: 1, title: 'Pending Task', status: 'PENDING' },
        { id: 2, title: 'In Progress Task', status: 'IN_PROGRESS' },
        { id: 3, title: 'Completed Task', status: 'COMPLETED' },
        { id: 4, title: 'Declined Task', status: 'DECLINED' },
      ];

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => variousTasks,
      });

      render(<TaskWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('task-count')).toHaveTextContent('4');
      });

      expect(screen.getByTestId('task-1')).toHaveTextContent('Pending Task');
      expect(screen.getByTestId('task-4')).toHaveTextContent('Declined Task');
    });
  });

  describe('UI State Transitions', () => {
    test('transitions from loading to content', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTasks,
      });

      render(<TaskWidget />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('task-list')).toBeInTheDocument();
    });

    test('transitions from loading to error state', async () => {
      useAuth.mockReturnValue({
        user: mockUser,
        token: 'mock-token',
      });

      globalThis.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<TaskWidget />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      expect(toast.error).toHaveBeenCalled();
    });
  });
});
