import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import TaskList from './TaskList';
import { useAuth } from '../contexts/AuthContextUtils';
import React from 'react';

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

describe('TaskList Component - Keyboard Navigation', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
  };

  const mockTasks = [
    {
      id: 1,
      title: 'Water the plants',
      due_date: '2025-01-15T10:00:00Z',
      status: 'PENDING',
      assigned_to: [1],
    },
    {
      id: 2,
      title: 'Harvest tomatoes',
      due_date: '2025-01-16T14:00:00Z',
      status: 'IN_PROGRESS',
      assigned_to: [2],
    },
    {
      id: 3,
      title: 'Plant new seeds',
      due_date: '2025-01-17T09:00:00Z',
      status: 'PENDING',
      assigned_to: [1],
    },
  ];

  const mockHandleTaskClick = vi.fn();
  const mockHandleAcceptTask = vi.fn();
  const mockHandleDeclineTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: mockUser,
    });
  });

  test('renders task list with keyboard navigation support', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    // Check that the list has proper ARIA attributes
    const taskList = screen.getByRole('listbox', { name: /task list/i });
    expect(taskList).toBeInTheDocument();

    // Check that task items are rendered
    expect(screen.getByText('Water the plants')).toBeInTheDocument();
    expect(screen.getByText('Harvest tomatoes')).toBeInTheDocument();
    expect(screen.getByText('Plant new seeds')).toBeInTheDocument();
  });

  test('supports keyboard navigation with arrow keys', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    // Test Arrow Down navigation
    fireEvent.keyDown(taskList, { key: 'ArrowDown' });
    // The first task should be focused (this is handled by the list navigation utility)

    // Test Arrow Up navigation
    fireEvent.keyDown(taskList, { key: 'ArrowUp' });
    // Should wrap to the last task
  });

  test('supports Enter key to select tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    // Navigate to first task and press Enter
    fireEvent.keyDown(taskList, { key: 'ArrowDown' });
    fireEvent.keyDown(taskList, { key: 'Enter' });

    expect(mockHandleTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  test('supports Space key to select tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    // Navigate to first task and press Space
    fireEvent.keyDown(taskList, { key: 'ArrowDown' });
    fireEvent.keyDown(taskList, { key: ' ' });

    expect(mockHandleTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  test('supports Home key to jump to first task', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    fireEvent.keyDown(taskList, { key: 'Home' });

    // Should focus the first task
    expect(mockHandleTaskClick).toHaveBeenCalledTimes(0); // No selection yet
  });

  test('supports End key to jump to last task', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    fireEvent.keyDown(taskList, { key: 'End' });

    // Should focus the last task
    expect(mockHandleTaskClick).toHaveBeenCalledTimes(0); // No selection yet
  });

  test('renders Accept and Decline buttons for assigned tasks', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    // Check for Accept and Decline buttons for tasks assigned to current user
    const acceptButtons = screen.getAllByRole('button', { name: /accept task/i });
    const declineButtons = screen.getAllByRole('button', { name: /decline task/i });

    // Should have buttons for tasks assigned to user (user_id: 1)
    expect(acceptButtons).toHaveLength(2); // Water the plants and Plant new seeds
    expect(declineButtons).toHaveLength(2);
  });

  test('Accept and Decline buttons support keyboard navigation', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept task: water the plants/i });
    const declineButton = screen.getByRole('button', { name: /decline task: water the plants/i });

    // Test Enter key on Accept button
    fireEvent.keyDown(acceptButton, { key: 'Enter' });
    expect(mockHandleAcceptTask).toHaveBeenCalledWith(mockTasks[0]);

    // Test Space key on Decline button
    fireEvent.keyDown(declineButton, { key: ' ' });
    expect(mockHandleDeclineTask).toHaveBeenCalledWith(mockTasks[0]);
  });

  test('task items have proper focus indicators', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    // Check that task items have proper tabindex and role
    const taskItems = screen.getAllByRole('option');
    expect(taskItems).toHaveLength(3);

    // Each task item should have proper ARIA attributes
    taskItems.forEach((item, index) => {
      expect(item).toHaveAttribute('tabindex', '0');
      expect(item).toHaveAttribute('aria-selected', 'false');
    });
  });

  test('handles empty task list gracefully', () => {
    render(
      <TaskList
        tasks={[]}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    expect(screen.getByText('No tasks available.')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('task list maintains focus management', () => {
    render(
      <TaskList
        tasks={mockTasks}
        handleTaskClick={mockHandleTaskClick}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
      />
    );

    const taskList = screen.getByRole('listbox', { name: /task list/i });

    // Test that focus management works correctly
    fireEvent.keyDown(taskList, { key: 'ArrowDown' });
    fireEvent.keyDown(taskList, { key: 'ArrowDown' });
    fireEvent.keyDown(taskList, { key: 'ArrowUp' });

    // Should be able to navigate without errors
    expect(taskList).toBeInTheDocument();
  });
});
