import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import EventDetailModal from './EventDetailModal';
import { useAuth } from '../contexts/AuthContextUtils';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/keyboardNavigation', () => ({
  createFormKeyboardHandler: vi.fn(() => vi.fn()),
  trapFocus: vi.fn(() => vi.fn()),
}));

// Mock fetch
global.fetch = vi.fn();

// Set up environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

describe('EventDetailModal Component', () => {
  const mockToken = 'mock-token';
  const mockUser = { id: '1', username: 'testuser' };
  const mockOnClose = vi.fn();
  const mockOnEventUpdated = vi.fn();
  const mockOnEventDeleted = vi.fn();
  const mockT = vi.fn((key) => key);

  const mockEvent = {
    id: '123',
    title: 'Test Event',
    description: 'Test Description',
    start_at: '2024-01-16T10:00:00Z',
    end_at: '2024-01-16T12:00:00Z',
    location: 'Test Location',
    visibility: 'PUBLIC',
    event_category: 'WORKSHOP',
    my_attendance: 'GOING',
    going_count: 5,
    maybe_count: 2,
    not_going_count: 1,
    created_by: { username: 'creator' },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      token: mockToken,
      user: mockUser,
    });

    useTranslation.mockReturnValue({
      t: mockT,
    });

    // Mock successful fetch responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEvent),
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('Rendering', () => {
    test('renders modal with event details when open', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
          onEventUpdated={mockOnEventUpdated}
          onEventDeleted={mockOnEventDeleted}
          canEdit={true}
          canDelete={true}
        />
      );

      expect(screen.getByLabelText(/Test Event/i)).toBeInTheDocument();
      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    test('does not render when not open', () => {
      render(
        <EventDetailModal
          open={false}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders event category information', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      expect(mockT).toHaveBeenCalledWith('events.category.label');
      expect(mockT).toHaveBeenCalledWith('events.category.workshop');
    });

    test('renders attendance counts', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      expect(mockT).toHaveBeenCalledWith('events.goingCount', { count: 5 });
      expect(mockT).toHaveBeenCalledWith('events.maybeCount', { count: 2 });
      expect(mockT).toHaveBeenCalledWith('events.notGoingCount', { count: 1 });
    });

    test('renders delete button when canDelete is true', () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.deleteEvent') return 'Delete Event';
        return key;
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
          canDelete={true}
        />
      );

      expect(screen.getByText('Delete Event')).toBeInTheDocument();
    });

    test('does not render delete button when canDelete is false', () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.deleteEvent') return 'Delete Event';
        return key;
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
          canDelete={false}
        />
      );

      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();
    });
  });


  describe('Attendances Tab', () => {
    test('switches to attendances tab', () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.attendances') return 'Attendances';
        return key;
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const attendancesTab = screen.getByText('Attendances');
      fireEvent.click(attendancesTab);

      expect(attendancesTab).toBeInTheDocument();
    });

    test('fetches and displays attendances', async () => {
      const mockAttendances = [
        {
          id: '1',
          user: { username: 'user1' },
          status: 'GOING',
        },
        {
          id: '2',
          user: { username: 'user2' },
          status: 'MAYBE',
        },
      ];

      mockT.mockImplementation((key) => {
        if (key === 'events.attendances') return 'Attendances';
        if (key === 'events.going') return 'Going';
        if (key === 'events.maybe') return 'Maybe';
        return key;
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAttendances),
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const attendancesTab = screen.getByText('Attendances');
      fireEvent.click(attendancesTab);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
      });
    });

    test('shows no attendances message when list is empty', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.attendances') return 'Attendances';
        if (key === 'events.noAttendancesYet') return 'No attendances yet';
        return key;
      });

      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const attendancesTab = screen.getByText('Attendances');
      fireEvent.click(attendancesTab);

      await waitFor(() => {
        expect(screen.getByText('No attendances yet')).toBeInTheDocument();
      });
    });
  });

  describe('Event Deletion', () => {
    test('shows confirmation dialog and deletes event', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.deleteEvent') return 'Delete Event';
        if (key === 'events.confirmDeleteEvent') return 'Are you sure?';
        if (key === 'events.eventDeleted') return 'Event deleted';
        return key;
      });

      // Mock window.confirm
      window.confirm = vi.fn(() => true);

      fetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
          onEventDeleted={mockOnEventDeleted}
          canDelete={true}
        />
      );

      const deleteButton = screen.getByText('Delete Event');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://test-api.example.com/events/123/',
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      expect(mockOnEventDeleted).toHaveBeenCalledWith('123');
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('cancels deletion when user declines confirmation', () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.deleteEvent') return 'Delete Event';
        return key;
      });

      window.confirm = vi.fn(() => false);

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
          canDelete={true}
        />
      );

      const deleteButton = screen.getByText('Delete Event');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Modal Actions', () => {
    test('calls onClose when close button is clicked', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.close') return 'Close';
        return key;
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets active tab when modal closes', () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.attendances') return 'Attendances';
        return key;
      });

      const { rerender } = render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      // Switch to attendances tab
      const attendancesTab = screen.getByText('Attendances');
      fireEvent.click(attendancesTab);

      // Close and reopen modal
      rerender(
        <EventDetailModal
          open={false}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      rerender(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      // Should be back to first tab
      expect(screen.getByLabelText(/Test Event/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const dialog = screen.getByLabelText(/Test Event/i);
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'event-detail-title');
    });

    test('has proper focus management', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      const dialog = screen.getByLabelText(/Test Event/i);
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles null event gracefully', () => {
      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={null}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('handles missing token', () => {
      useAuth.mockReturnValue({
        token: null,
        user: null,
      });

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={mockEvent}
        />
      );

      expect(screen.getByLabelText(/Test Event/i)).toBeInTheDocument();
    });


    test('handles event without optional fields', () => {
      const minimalEvent = {
        id: '123',
        title: 'Minimal Event',
        start_at: '2024-01-16T10:00:00Z',
        visibility: 'PUBLIC',
      };

      render(
        <EventDetailModal
          open={true}
          onClose={mockOnClose}
          event={minimalEvent}
        />
      );

      expect(screen.getByText('Minimal Event')).toBeInTheDocument();
    });
  });
});
