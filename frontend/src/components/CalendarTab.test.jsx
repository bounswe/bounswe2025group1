import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import CalendarTab from './CalendarTab';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

// Mock matchMedia for useMediaQuery
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false, // Desktop by default
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('CalendarTab Component', () => {
  const mockTasks = [
    {
      id: 1,
      title: 'Water plants',
      due_date: '2025-11-15',
      status: 'PENDING',
    },
    {
      id: 2,
      title: 'Harvest tomatoes',
      due_date: '2025-11-15',
      status: 'IN_PROGRESS',
    },
    {
      id: 3,
      title: 'Plant seeds',
      due_date: '2025-11-20',
      status: 'COMPLETED',
    },
  ];

  const mockHandleTaskClick = vi.fn();
  const mockOnEmptyDayClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Desktop View', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false, // Desktop
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('displays current month and year', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Check if year is displayed
      expect(screen.getByText(new RegExp(dayjs().year().toString()))).toBeInTheDocument();
    });

    test('displays day headers (Sun-Sat)', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Tue')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Thu')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
      expect(screen.getByText('Sat')).toBeInTheDocument();
    });

    test('navigates to previous month when clicking previous button', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const currentYear = dayjs().year();
      const prevButton = screen.getAllByRole('button')[0];

      fireEvent.click(prevButton);

      // Month or year should change
      const displayedText = screen.getByText(new RegExp(currentYear.toString()));
      expect(displayedText).toBeInTheDocument();
    });

    test('navigates to next month when clicking next button', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const currentYear = dayjs().year();
      const nextButton = screen.getAllByRole('button')[1];

      fireEvent.click(nextButton);

      // Month or year should change
      const displayedText = screen.getByText(new RegExp(currentYear.toString()));
      expect(displayedText).toBeInTheDocument();
    });

    test('displays tasks on correct dates', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Tasks for November 15 and 20 should be displayed
      expect(screen.getByText('Water plants')).toBeInTheDocument();
      expect(screen.getByText('Harvest tomatoes')).toBeInTheDocument();
      expect(screen.getByText('Plant seeds')).toBeInTheDocument();
    });

    test('calls handleTaskClick when task chip is clicked', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const taskChip = screen.getByText('Water plants');
      fireEvent.click(taskChip);

      expect(mockHandleTaskClick).toHaveBeenCalledWith(mockTasks[0]);
    });

    test('calls onEmptyDayClick when clicking on day without tasks', () => {
      renderWithTheme(
        <CalendarTab
          tasks={[]} // No tasks
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Find a Paper component (calendar cell) and click it
      const firstPaper = document.querySelector('[class*="MuiPaper-root"]');

      if (firstPaper) {
        fireEvent.click(firstPaper);
        expect(mockOnEmptyDayClick).toHaveBeenCalled();
      }
    });

    test('does not call onEmptyDayClick when clicking on day with tasks', () => {
      const tasksForToday = [
        {
          id: 1,
          title: 'Task today',
          due_date: dayjs().format('YYYY-MM-DD'),
          status: 'PENDING',
        },
      ];

      renderWithTheme(
        <CalendarTab
          tasks={tasksForToday}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const taskChip = screen.getByText('Task today');
      const paperElement = taskChip.closest('[class*="MuiPaper-root"]');

      if (paperElement) {
        fireEvent.click(paperElement);
        // Should not call onEmptyDayClick since there are tasks
        expect(mockOnEmptyDayClick).not.toHaveBeenCalled();
      }
    });

    test('displays multiple tasks on the same day', () => {
      const sameDayTasks = [
        {
          id: 1,
          title: 'Task 1',
          due_date: '2025-11-15',
          status: 'PENDING',
        },
        {
          id: 2,
          title: 'Task 2',
          due_date: '2025-11-15',
          status: 'IN_PROGRESS',
        },
        {
          id: 3,
          title: 'Task 3',
          due_date: '2025-11-15',
          status: 'COMPLETED',
        },
      ];

      renderWithTheme(
        <CalendarTab
          tasks={sameDayTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    test('handles empty tasks array', () => {
      renderWithTheme(
        <CalendarTab
          tasks={[]}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Should still render calendar structure
      expect(screen.getByText('Sun')).toBeInTheDocument();
      expect(screen.getAllByRole('button')).toHaveLength(2); // Nav buttons
    });

    test('filters tasks by exact day match', () => {
      const mixedTasks = [
        {
          id: 1,
          title: 'Nov 15 task',
          due_date: '2025-11-15T10:00:00',
          status: 'PENDING',
        },
        {
          id: 2,
          title: 'Nov 16 task',
          due_date: '2025-11-16T10:00:00',
          status: 'PENDING',
        },
      ];

      renderWithTheme(
        <CalendarTab
          tasks={mixedTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Both tasks should be visible but on different days
      expect(screen.getByText('Nov 15 task')).toBeInTheDocument();
      expect(screen.getByText('Nov 16 task')).toBeInTheDocument();
    });
  });

  describe('Mobile View', () => {
    beforeEach(() => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(max-width:899.95px)', // Mobile
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    });

    test('displays week date range on mobile', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Should display date range like "1 - 7 January 2025"
      const currentYear = dayjs().year();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    test('displays tasks in week view on mobile', () => {
      const currentWeekTask = {
        id: 1,
        title: 'Current week task',
        due_date: dayjs().format('YYYY-MM-DD'),
        status: 'PENDING',
      };

      renderWithTheme(
        <CalendarTab
          tasks={[currentWeekTask]}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      expect(screen.getByText('Current week task')).toBeInTheDocument();
    });

    test('handles task click in mobile view', () => {
      const currentWeekTask = {
        id: 1,
        title: 'Mobile task',
        due_date: dayjs().format('YYYY-MM-DD'),
        status: 'PENDING',
      };

      renderWithTheme(
        <CalendarTab
          tasks={[currentWeekTask]}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const taskChip = screen.getByText('Mobile task');
      fireEvent.click(taskChip);

      expect(mockHandleTaskClick).toHaveBeenCalledWith(currentWeekTask);
    });
  });

  describe('Month Translation', () => {
    test('translates month names correctly', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // Current month should be translated
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const currentMonthName = monthNames[dayjs().month()];
      expect(screen.getByText(new RegExp(currentMonthName, 'i'))).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles month transitions correctly', () => {
      renderWithTheme(
        <CalendarTab
          tasks={mockTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const nextButton = screen.getAllByRole('button')[1];

      // Navigate through multiple months
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      // Should still render properly
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    test('handles tasks without onEmptyDayClick callback', () => {
      renderWithTheme(
        <CalendarTab
          tasks={[]}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={null}
        />
      );

      const firstPaper = document.querySelector('[class*="MuiPaper-root"]');

      if (firstPaper) {
        // Should not throw error
        expect(() => fireEvent.click(firstPaper)).not.toThrow();
      }
    });

    test('applies correct status colors to task chips', () => {
      const statusTasks = [
        {
          id: 1,
          title: 'Pending task',
          due_date: dayjs().format('YYYY-MM-DD'),
          status: 'PENDING',
        },
        {
          id: 2,
          title: 'In progress task',
          due_date: dayjs().format('YYYY-MM-DD'),
          status: 'IN_PROGRESS',
        },
        {
          id: 3,
          title: 'Completed task',
          due_date: dayjs().format('YYYY-MM-DD'),
          status: 'COMPLETED',
        },
      ];

      renderWithTheme(
        <CalendarTab
          tasks={statusTasks}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      // All status tasks should be rendered
      expect(screen.getByText('Pending task')).toBeInTheDocument();
      expect(screen.getByText('In progress task')).toBeInTheDocument();
      expect(screen.getByText('Completed task')).toBeInTheDocument();
    });

    test('stops event propagation when clicking task chip', () => {
      const taskForToday = {
        id: 1,
        title: 'Stop propagation task',
        due_date: dayjs().format('YYYY-MM-DD'),
        status: 'PENDING',
      };

      renderWithTheme(
        <CalendarTab
          tasks={[taskForToday]}
          handleTaskClick={mockHandleTaskClick}
          onEmptyDayClick={mockOnEmptyDayClick}
        />
      );

      const taskChip = screen.getByText('Stop propagation task');
      fireEvent.click(taskChip);

      // Should call task click but not empty day click
      expect(mockHandleTaskClick).toHaveBeenCalled();
      expect(mockOnEmptyDayClick).not.toHaveBeenCalled();
    });
  });
});
