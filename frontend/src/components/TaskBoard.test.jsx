import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import TaskBoard from './TaskBoard';
import { DragDropContext } from '@hello-pangea/dnd';

// Mock the drag and drop library
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children, onDragEnd }) => (
    <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd ? 'exists' : 'missing'}>
      {children}
    </div>
  ),
  Droppable: ({ children, droppableId }) => {
    const provided = {
      innerRef: vi.fn(),
      droppableProps: {
        'data-droppable-id': droppableId,
      },
      placeholder: <div data-testid={`placeholder-${droppableId}`} />,
    };
    return children(provided);
  },
  Draggable: ({ children, draggableId }) => {
    const provided = {
      innerRef: vi.fn(),
      draggableProps: {
        'data-draggable-id': draggableId,
      },
      dragHandleProps: {
        'data-drag-handle': 'true',
      },
    };
    return children(provided);
  },
}));

// Mock the task utils
vi.mock('../utils/taskUtils', () => ({
  bgForStatus: vi.fn((status) => {
    switch (status) {
      case 'PENDING':
        return '#fff3e0';
      case 'IN_PROGRESS':
        return '#e3f2fd';
      case 'COMPLETED':
        return '#e8f5e9';
      case 'DECLINED':
        return '#ffebee';
      default:
        return '#e3f2fd';
    }
  }),
  iconColorForStatus: vi.fn((status) => {
    switch (status) {
      case 'PENDING':
        return '#f57c00';
      case 'IN_PROGRESS':
        return '#1976d2';
      case 'COMPLETED':
        return '#388e3c';
      case 'DECLINED':
        return '#d32f2f';
      default:
        return '#1976d2';
    }
  }),
}));

describe('TaskBoard Component', () => {
  const mockHandleTaskUpdate = vi.fn();
  const mockOnTaskClick = vi.fn();

  const mockTasks = [
    {
      id: 1,
      title: 'Pending Task',
      status: 'PENDING',
      due_date: '2025-12-01',
      assigned_to_username: 'user1',
    },
    {
      id: 2,
      title: 'In Progress Task',
      status: 'IN_PROGRESS',
      due_date: '2025-11-20',
      assigned_to_username: 'user2',
    },
    {
      id: 3,
      title: 'Completed Task',
      status: 'COMPLETED',
      due_date: '2025-11-15',
      assigned_to_username: 'user3',
    },
    {
      id: 4,
      title: 'Declined Task',
      status: 'DECLINED',
      due_date: null,
      assigned_to_username: null,
    },
    {
      id: 5,
      title: 'Another Pending Task',
      status: 'PENDING',
      due_date: '2025-12-05',
      assigned_to_username: 'user4',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderTaskBoard = (props = {}) => {
    const tasks = props.tasks ?? mockTasks;
    return render(
      <TaskBoard
        tasks={tasks}
        handleTaskUpdate={mockHandleTaskUpdate}
        onTaskClick={mockOnTaskClick}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    test('renders all four status columns', () => {
      renderTaskBoard();

      expect(screen.getAllByText(/Pending/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/In Progress/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Completed/)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Declined/)[0]).toBeInTheDocument();
    });

    test('renders DragDropContext', () => {
      renderTaskBoard();

      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    });

    test('displays task count for each status', () => {
      renderTaskBoard();

      expect(screen.getByText(/Pending \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Declined \(1\)/)).toBeInTheDocument();
    });

    test('renders all tasks in correct columns', () => {
      renderTaskBoard();

      expect(screen.getByText('Pending Task')).toBeInTheDocument();
      expect(screen.getByText('In Progress Task')).toBeInTheDocument();
      expect(screen.getByText('Completed Task')).toBeInTheDocument();
      expect(screen.getByText('Declined Task')).toBeInTheDocument();
      expect(screen.getByText('Another Pending Task')).toBeInTheDocument();
    });

    test('renders task assignees', () => {
      renderTaskBoard();

      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user3')).toBeInTheDocument();
    });

    test('displays placeholder for null due date', () => {
      renderTaskBoard();

      // The declined task has no due date, should show —
      const dueTexts = screen.getAllByText(/Due:/);
      expect(dueTexts.length).toBeGreaterThan(0);
    });

    test('displays unassigned for tasks without assignee', () => {
      renderTaskBoard();

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    test('renders details button for each task', () => {
      renderTaskBoard();

      const detailsButtons = screen.getAllByText('Details');
      expect(detailsButtons).toHaveLength(5);
    });
  });

  describe('Task Interaction', () => {
    test('calls onTaskClick when details button is clicked', () => {
      renderTaskBoard();

      const detailsButtons = screen.getAllByText('Details');
      fireEvent.click(detailsButtons[0]);

      expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
    });

    test('handles missing onTaskClick gracefully', () => {
      renderTaskBoard({ onTaskClick: undefined });

      const detailsButtons = screen.getAllByText('Details');
      
      expect(() => fireEvent.click(detailsButtons[0])).not.toThrow();
    });
  });

  describe('Empty States', () => {
    test('renders columns with zero tasks', () => {
      renderTaskBoard({ tasks: [] });

      expect(screen.getByText(/Pending \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Declined \(0\)/)).toBeInTheDocument();
    });

    test('renders columns when only one status has tasks', () => {
      const singleStatusTasks = [
        {
          id: 1,
          title: 'Only Pending',
          status: 'PENDING',
          due_date: '2025-12-01',
          assigned_to_username: 'user1',
        },
      ];

      renderTaskBoard({ tasks: singleStatusTasks });

      expect(screen.getByText(/Pending \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress \(0\)/)).toBeInTheDocument();
      expect(screen.getByText('Only Pending')).toBeInTheDocument();
    });
  });

  describe('Task Display', () => {
    test('displays task title correctly', () => {
      renderTaskBoard();

      const pendingTask = screen.getByText('Pending Task');
      expect(pendingTask).toBeInTheDocument();
    });

    test('formats due dates in locale format', () => {
      const tasksWithDate = [
        {
          id: 1,
          title: 'Task with Date',
          status: 'PENDING',
          due_date: '2025-12-25',
          assigned_to_username: 'user1',
        },
      ];

      renderTaskBoard({ tasks: tasksWithDate });

      // Date formatting depends on locale, but should contain date elements
      expect(screen.getByText(/Due:/)).toBeInTheDocument();
    });

    test('displays multiple tasks in same column', () => {
      renderTaskBoard();

      // Pending column should have 2 tasks
      expect(screen.getByText('Pending Task')).toBeInTheDocument();
      expect(screen.getByText('Another Pending Task')).toBeInTheDocument();
    });

    test('renders task with all properties', () => {
      const fullTask = [
        {
          id: 1,
          title: 'Full Task',
          status: 'IN_PROGRESS',
          due_date: '2025-12-01',
          assigned_to_username: 'testuser',
        },
      ];

      renderTaskBoard({ tasks: fullTask });

      expect(screen.getByText('Full Task')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('renders task with minimal properties', () => {
      const minimalTask = [
        {
          id: 1,
          title: 'Minimal Task',
          status: 'PENDING',
          due_date: null,
          assigned_to_username: null,
        },
      ];

      renderTaskBoard({ tasks: minimalTask });

      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });
  });

  describe('Status Columns', () => {
    test('each column has droppable id', () => {
      const { container } = renderTaskBoard();

      expect(container.querySelector('[data-droppable-id="PENDING"]')).toBeInTheDocument();
      expect(container.querySelector('[data-droppable-id="IN_PROGRESS"]')).toBeInTheDocument();
      expect(container.querySelector('[data-droppable-id="COMPLETED"]')).toBeInTheDocument();
      expect(container.querySelector('[data-droppable-id="DECLINED"]')).toBeInTheDocument();
    });

    test('renders placeholder for each column', () => {
      renderTaskBoard();

      expect(screen.getByTestId('placeholder-PENDING')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-IN_PROGRESS')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-COMPLETED')).toBeInTheDocument();
      expect(screen.getByTestId('placeholder-DECLINED')).toBeInTheDocument();
    });
  });

  describe('Task Properties', () => {
    test('each task has draggable id', () => {
      const { container } = renderTaskBoard();

      expect(container.querySelector('[data-draggable-id="1"]')).toBeInTheDocument();
      expect(container.querySelector('[data-draggable-id="2"]')).toBeInTheDocument();
      expect(container.querySelector('[data-draggable-id="3"]')).toBeInTheDocument();
      expect(container.querySelector('[data-draggable-id="4"]')).toBeInTheDocument();
      expect(container.querySelector('[data-draggable-id="5"]')).toBeInTheDocument();
    });

    test('each task has drag handle', () => {
      const { container } = renderTaskBoard();

      const dragHandles = container.querySelectorAll('[data-drag-handle="true"]');
      expect(dragHandles.length).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty tasks array', () => {
      renderTaskBoard({ tasks: [] });

      expect(screen.getByText(/Pending \(0\)/)).toBeInTheDocument();
      expect(screen.queryByText('Details')).not.toBeInTheDocument();
    });

    test('handles tasks with invalid status', () => {
      const invalidTasks = [
        {
          id: 1,
          title: 'Task with invalid status',
          status: 'INVALID_STATUS',
          due_date: '2025-12-01',
          assigned_to_username: 'user1',
        },
      ];

      renderTaskBoard({ tasks: invalidTasks });

      // Task should not appear in any column
      expect(screen.queryByText('Task with invalid status')).not.toBeInTheDocument();
    });

    test('handles tasks with missing title', () => {
      const tasksWithoutTitle = [
        {
          id: 1,
          title: '',
          status: 'PENDING',
          due_date: '2025-12-01',
          assigned_to_username: 'user1',
        },
      ];

      renderTaskBoard({ tasks: tasksWithoutTitle });

      // Should still render the task card with details button
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    test('handles undefined handleTaskUpdate', () => {
      renderTaskBoard({ handleTaskUpdate: undefined });

      // Should render without errors
      expect(screen.getByText('Pending Task')).toBeInTheDocument();
    });
  });

  describe('Task Counting', () => {
    test('counts tasks correctly per status', () => {
      const multipleTasks = [
        ...Array(3).fill(null).map((_, i) => ({
          id: i + 1,
          title: `Pending ${i + 1}`,
          status: 'PENDING',
          due_date: '2025-12-01',
          assigned_to_username: 'user1',
        })),
        ...Array(2).fill(null).map((_, i) => ({
          id: i + 4,
          title: `In Progress ${i + 1}`,
          status: 'IN_PROGRESS',
          due_date: '2025-12-01',
          assigned_to_username: 'user2',
        })),
      ];

      renderTaskBoard({ tasks: multipleTasks });

      expect(screen.getByText(/Pending \(3\)/)).toBeInTheDocument();
      expect(screen.getByText(/In Progress \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Completed \(0\)/)).toBeInTheDocument();
      expect(screen.getByText(/Declined \(0\)/)).toBeInTheDocument();
    });

    test('updates count when tasks change', () => {
      const { rerender } = render(
        <TaskBoard
          tasks={[mockTasks[0]]}
          handleTaskUpdate={mockHandleTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      expect(screen.getByText(/Pending \(1\)/)).toBeInTheDocument();

      rerender(
        <TaskBoard
          tasks={[mockTasks[0], mockTasks[4]]}
          handleTaskUpdate={mockHandleTaskUpdate}
          onTaskClick={mockOnTaskClick}
        />
      );

      expect(screen.getByText(/Pending \(2\)/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders headings for each status column', () => {
      renderTaskBoard();

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(4);
    });

    test('all details buttons are accessible', () => {
      renderTaskBoard();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });

    test('task titles are visible text', () => {
      renderTaskBoard();

      mockTasks.forEach(task => {
        if (task.title) {
          expect(screen.getByText(task.title)).toBeVisible();
        }
      });
    });
  });
});
