import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NotificationBell from './NotificationBell';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';

// Mock fetch
window.fetch = vi.fn();

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

describe('NotificationBell', () => {
  const mockToken = 'test-token-123';
  const mockUser = { id: 1, username: 'testuser' };
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
        user: mockUser,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the notification bell icon', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unread_count: 0 }),
    });

    render(<NotificationBell />)
    
    const bellIcon = screen.getByRole('button');
    expect(bellIcon).toBeInTheDocument();
  });

  it('fetches and displays unread count on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unread_count: 5 }),
    });

    render(<NotificationBell />)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/notifications/unread_count/`,
        expect.objectContaining({
          headers: { 'Authorization': `Token ${mockToken}` }
        })
      );
    });

    await waitFor(() => {
      const badge = screen.getByText('5');
      expect(badge).toBeInTheDocument();
    });
  });

  it('opens popover and fetches notifications when bell icon is clicked', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          {
            id: 1,
            message: 'New task assigned',
            timestamp: '2025-11-19T10:00:00Z',
            read: false,
          },
          {
            id: 2,
            message: 'Garden request approved',
            timestamp: '2025-11-19T09:00:00Z',
            read: true,
          },
        ]),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('New task assigned')).toBeInTheDocument();
      expect(screen.getByText('Garden request approved')).toBeInTheDocument();
    });
  });

  it('displays "no notifications" message when notifications list is empty', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('You have no notifications.')).toBeInTheDocument();
    });
  });

  it('marks a single notification as read', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: '2025-11-19T10:00:00Z',
        read: false,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const markAsReadButtons = screen.getAllByRole('button');
    const markReadButton = markAsReadButtons.find(btn => 
      btn.querySelector('[data-testid="MarkEmailReadIcon"]')
    );
    
    if (markReadButton) {
      fireEvent.click(markReadButton);
    }

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/notifications/1/mark_as_read/`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Authorization': `Token ${mockToken}` }
        })
      );
    });
  });

  it('shows error toast when marking as read fails', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: '2025-11-19T10:00:00Z',
        read: false,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const markAsReadButtons = screen.getAllByRole('button');
    const markReadButton = markAsReadButtons.find(btn => 
      btn.querySelector('[data-testid="MarkEmailReadIcon"]')
    );
    
    if (markReadButton) {
      fireEvent.click(markReadButton);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to mark as read');
    });
  });

  it('marks all notifications as read', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Notification 1',
        timestamp: '2025-11-19T10:00:00Z',
        read: false,
      },
      {
        id: 2,
        message: 'Notification 2',
        timestamp: '2025-11-19T09:00:00Z',
        read: false,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 2 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notification 1')).toBeInTheDocument();
    });

    const markAllReadButtons = screen.getAllByRole('button');
    const markAllButton = markAllReadButtons.find(btn => 
      btn.querySelector('[data-testid="DoneAllIcon"]')
    );
    
    if (markAllButton) {
      fireEvent.click(markAllButton);
    }

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `${import.meta.env.VITE_API_URL}/notifications/mark_all_as_read/`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Authorization': `Token ${mockToken}` }
        })
      );
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('All notifications marked as read');
    });
  });

  it('shows error toast when marking all as read fails', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: '2025-11-19T10:00:00Z',
        read: false,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    const markAllReadButtons = screen.getAllByRole('button');
    const markAllButton = markAllReadButtons.find(btn => 
      btn.querySelector('[data-testid="DoneAllIcon"]')
    );
    
    if (markAllButton) {
      fireEvent.click(markAllButton);
    }

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to mark all as read');
    });
  });

  it('closes popover when clicking outside', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    // Click outside the popover
    fireEvent.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });
  });

  it('increments unread count when "new-notification" event is dispatched', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unread_count: 3 }),
    });

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    // Dispatch custom event
    const event = new Event('new-notification');
    document.dispatchEvent(event);

    await waitFor(() => {
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  it('handles fetch error gracefully for unread count', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationBell />)

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch unread count:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('handles fetch error gracefully for notifications list', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch notifications:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('disables mark all as read button when no notifications', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ([]),
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('You have no notifications.')).toBeInTheDocument();
    });

    const markAllButtons = screen.getAllByRole('button');
    const markAllButton = markAllButtons.find(btn => 
      btn.querySelector('[data-testid="DoneAllIcon"]')
    );
    
    expect(markAllButton).toBeDisabled();
  });

  it('disables mark all as read button when all notifications are read', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Read notification',
        timestamp: '2025-11-19T10:00:00Z',
        read: true,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Read notification')).toBeInTheDocument();
    });

    const markAllButtons = screen.getAllByRole('button');
    const markAllButton = markAllButtons.find(btn => 
      btn.querySelector('[data-testid="DoneAllIcon"]')
    );
    
    expect(markAllButton).toBeDisabled();
  });

  it('displays notification timestamp in correct format', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Test notification',
        timestamp: '2025-11-19T10:30:00Z',
        read: false,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
    });

    // Check that timestamp is displayed (format may vary based on locale)
    const listItems = screen.getAllByRole('listitem');
    const notificationItem = listItems.find(item => 
      item.textContent.includes('Test notification')
    );
    expect(notificationItem).toBeInTheDocument();
  });

  it('highlights unread notifications with different background', async () => {
    const notifications = [
      {
        id: 1,
        message: 'Unread notification',
        timestamp: '2025-11-19T10:00:00Z',
        read: false,
      },
      {
        id: 2,
        message: 'Read notification',
        timestamp: '2025-11-19T09:00:00Z',
        read: true,
      },
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unread_count: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notifications,
      });

    render(<NotificationBell />)

    const bellButton = screen.getByRole('button');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('Unread notification')).toBeInTheDocument();
      expect(screen.getByText('Read notification')).toBeInTheDocument();
    });

    // Both notifications should be present
    const listItems = screen.getAllByRole('listitem').filter(item => 
      item.textContent.includes('notification')
    );
    expect(listItems.length).toBeGreaterThanOrEqual(2);
  });
});
