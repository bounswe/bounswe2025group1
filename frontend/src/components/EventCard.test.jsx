import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import EventCard from './EventCard';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

// Mock the modules/hooks
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('dayjs', () => {
  const actualDayjs = vi.importActual('dayjs');
  return {
    default: actualDayjs.default,
    extend: vi.fn(),
  };
});

describe('EventCard Component', () => {
  const mockT = vi.fn((key, options) => {
    if (options && options.count !== undefined) {
      return `${options.count} ${key}`;
    }
    return key;
  });

  const mockEvent = {
    id: 1,
    title: 'Spring Planting Day',
    description: 'Join us for our annual spring planting event!',
    start_time: '2025-03-15T10:00:00Z',
    end_time: '2025-03-15T14:00:00Z',
    location: 'Main Garden Area',
    visibility: 'PUBLIC',
    created_by: {
      id: 2,
      username: 'gardener_john',
    },
    going_count: 15,
    not_going_count: 2,
    maybe_count: 5,
    my_attendance: null,
  };

  const mockOnViewDetails = vi.fn();
  const mockOnVote = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
  });

  describe('Rendering', () => {
    test('renders event card with all details', () => {
      render(
        <EventCard
          event={mockEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
      expect(screen.getByText('Join us for our annual spring planting event!')).toBeInTheDocument();
      expect(screen.getByText('Main Garden Area')).toBeInTheDocument();
    });

    test('renders public visibility chip', () => {
      render(
        <EventCard
          event={mockEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.public')).toBeInTheDocument();
    });

    test('renders private visibility chip', () => {
      const privateEvent = {
        ...mockEvent,
        visibility: 'PRIVATE',
      };

      render(
        <EventCard
          event={privateEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.private')).toBeInTheDocument();
    });

    test('renders attendance counts', () => {
      render(
        <EventCard
          event={mockEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(mockT).toHaveBeenCalledWith('events.goingCount', { count: 15 });
      expect(mockT).toHaveBeenCalledWith('events.maybeCount', { count: 5 });
      expect(mockT).toHaveBeenCalledWith('events.notGoingCount', { count: 2 });
    });

    test('renders created by information', () => {
      render(
        <EventCard
          event={mockEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText(/events.createdBy/)).toBeInTheDocument();
      expect(screen.getByText(/gardener_john/)).toBeInTheDocument();
    });
  });

  describe('User Interaction', () => {
    test('calls onViewDetails when view details button is clicked', () => {
      render(
        <EventCard
          event={mockEvent}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      const viewButton = screen.getByText('events.viewDetails');
      fireEvent.click(viewButton);

      expect(mockOnViewDetails).toHaveBeenCalledWith(mockEvent);
      expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
    });

    test('displays attendance status chip when user has voted', () => {
      const eventWithAttendance = {
        ...mockEvent,
        my_attendance: 'GOING',
      };

      render(
        <EventCard
          event={eventWithAttendance}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.going')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles event without description', () => {
      const eventWithoutDescription = {
        ...mockEvent,
        description: null,
      };

      render(
        <EventCard
          event={eventWithoutDescription}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
    });

    test('handles event without location', () => {
      const eventWithoutLocation = {
        ...mockEvent,
        location: null,
      };

      render(
        <EventCard
          event={eventWithoutLocation}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
    });

    test('handles event without end time', () => {
      const eventWithoutEndTime = {
        ...mockEvent,
        end_time: null,
      };

      render(
        <EventCard
          event={eventWithoutEndTime}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
    });

    test('handles event with zero attendance counts', () => {
      const eventWithZeroCounts = {
        ...mockEvent,
        going_count: 0,
        maybe_count: 0,
        not_going_count: 0,
      };

      render(
        <EventCard
          event={eventWithZeroCounts}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
    });

    test('handles event without created_by', () => {
      const eventWithoutCreator = {
        ...mockEvent,
        created_by: null,
      };

      render(
        <EventCard
          event={eventWithoutCreator}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('Spring Planting Day')).toBeInTheDocument();
    });
  });

  describe('Attendance Status', () => {
    test('displays GOING status correctly', () => {
      const eventWithGoing = {
        ...mockEvent,
        my_attendance: 'GOING',
      };

      render(
        <EventCard
          event={eventWithGoing}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.going')).toBeInTheDocument();
    });

    test('displays NOT_GOING status correctly', () => {
      const eventWithNotGoing = {
        ...mockEvent,
        my_attendance: 'NOT_GOING',
      };

      render(
        <EventCard
          event={eventWithNotGoing}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.notGoing')).toBeInTheDocument();
    });

    test('displays MAYBE status correctly', () => {
      const eventWithMaybe = {
        ...mockEvent,
        my_attendance: 'MAYBE',
      };

      render(
        <EventCard
          event={eventWithMaybe}
          onViewDetails={mockOnViewDetails}
          onVote={mockOnVote}
        />
      );

      expect(screen.getByText('events.maybe')).toBeInTheDocument();
    });
  });
});



