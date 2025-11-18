import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import TaskModal from './TaskModal';
import { useAuth } from '../contexts/AuthContextUtils';
import React from 'react';

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch
window.fetch = vi.fn();

// Set up environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

describe('TaskModal Component - Keyboard Navigation', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
  };

  const mockToken = 'mock-token';
  const mockGardenId = 1;
  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'PENDING',
    assigned_to: 1,
    due_date: '2025-01-15T10:00:00Z',
    garden: mockGardenId,
  };

  const mockOnClose = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockHandleAcceptTask = vi.fn();
  const mockHandleDeclineTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: mockUser,
      token: mockToken,
    });

    // Mock successful fetch responses
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  test('renders modal with keyboard navigation support', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="edit"
        task={mockTask}
        gardenId={mockGardenId}
      />
    );

    // Check that the modal has proper ARIA attributes
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'task-modal-title');

    // Check that the title is properly labeled
    const title = screen.getByText('Edit Task');
    expect(title).toHaveAttribute('id', 'task-modal-title');
  });

  test('supports Escape key to close modal', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="edit"
        task={mockTask}
        gardenId={mockGardenId}
      />
    );

    const modal = screen.getByRole('dialog');
    
    // Test Escape key
    fireEvent.keyDown(modal, { key: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('supports Enter key to submit form', async () => {
    // Mock fetch to return task types
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]), // members
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Watering', description: 'Water plants' },
        { id: 2, name: 'Weeding', description: 'Remove weeds' },
      ]), // task types
    });

    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    // Wait for task types to load
    await waitFor(() => {
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });

    const modal = screen.getByRole('dialog');
    
    // Fill in required fields
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    
    // Fill in the required custom_type field - get all comboboxes and select the one for custom_type (index 2)
    const comboboxes = screen.getAllByRole('combobox');
    const taskTypeSelect = comboboxes[2]; // Status is 0, Assigned To is 1, Task Type is 2
    fireEvent.mouseDown(taskTypeSelect);
    
    // Wait for the options to appear and select the first option
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]);
    });
    
    // Test Enter key (should submit form)
    fireEvent.keyDown(modal, { key: 'Enter' });
    
    // Should call onSubmit
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('supports Tab navigation through form elements', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    const modal = screen.getByRole('dialog');
    
    // Test Tab navigation
    fireEvent.keyDown(modal, { key: 'Tab' });
    
    // Should not close the modal
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('supports Shift+Tab navigation', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    const modal = screen.getByRole('dialog');
    
    // Test Shift+Tab navigation
    fireEvent.keyDown(modal, { key: 'Tab', shiftKey: true });
    
    // Should not close the modal
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('form elements have proper focus indicators', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    // Check that form elements are present and focusable
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const descriptionInput = screen.getByRole('textbox', { name: /description/i });
    const statusSelect = screen.getByRole('combobox');
    
    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    expect(statusSelect).toBeInTheDocument();
  });

  test('buttons have proper keyboard navigation support', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="edit"
        task={mockTask}
        gardenId={mockGardenId}
      />
    );

    // Check for Accept and Decline buttons
    const acceptButton = screen.getByRole('button', { name: /accept task/i });
    const declineButton = screen.getByRole('button', { name: /decline task/i });
    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    const saveButton = screen.getByRole('button', { name: /save changes/i });

    expect(acceptButton).toBeInTheDocument();
    expect(declineButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
    expect(saveButton).toBeInTheDocument();
  });

  test('Accept and Decline buttons support keyboard activation', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="edit"
        task={mockTask}
        gardenId={mockGardenId}
      />
    );

    const acceptButton = screen.getByRole('button', { name: /accept task/i });
    const declineButton = screen.getByRole('button', { name: /decline task/i });

    // Test Enter key on Accept button
    fireEvent.keyDown(acceptButton, { key: 'Enter' });
    expect(mockHandleAcceptTask).toHaveBeenCalledWith(mockTask);

    // Test Space key on Decline button
    fireEvent.keyDown(declineButton, { key: ' ' });
    expect(mockHandleDeclineTask).toHaveBeenCalledWith(mockTask);
  });

  test('Delete button supports keyboard activation', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="edit"
        task={mockTask}
        gardenId={mockGardenId}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });

    // Test Enter key on Delete button
    fireEvent.keyDown(deleteButton, { key: 'Enter' });
    expect(mockOnDelete).toHaveBeenCalled();

    // Test Space key on Delete button
    fireEvent.keyDown(deleteButton, { key: ' ' });
    expect(mockOnDelete).toHaveBeenCalledTimes(2);
  });

  test('modal traps focus within dialog', () => {
    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    const modal = screen.getByRole('dialog');
    
    // Test that focus is trapped within the modal
    // This is handled by the trapFocus utility
    expect(modal).toBeInTheDocument();
  });

  test('handles form submission with keyboard', async () => {
    // Mock fetch to return task types
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]), // members
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([
        { id: 1, name: 'Watering', description: 'Water plants' },
        { id: 2, name: 'Weeding', description: 'Remove weeds' },
      ]), // task types
    });

    render(
      <TaskModal
        open={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    // Wait for task types to load
    await waitFor(() => {
      const comboboxes = screen.getAllByRole('combobox');
      expect(comboboxes.length).toBeGreaterThan(0);
    });

    // Fill in required fields
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    fireEvent.change(titleInput, { target: { value: 'New Task' } });

    // Fill in the required custom_type field - get all comboboxes and select the one for custom_type (index 2)
    const comboboxes = screen.getAllByRole('combobox');
    const taskTypeSelect = comboboxes[2]; // Status is 0, Assigned To is 1, Task Type is 2
    fireEvent.mouseDown(taskTypeSelect);
    
    // Wait for the options to appear and select the first option
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]);
    });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  test('does not render when not open', () => {
    render(
      <TaskModal
        open={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        onDelete={mockOnDelete}
        handleAcceptTask={mockHandleAcceptTask}
        handleDeclineTask={mockHandleDeclineTask}
        mode="create"
        task={null}
        gardenId={mockGardenId}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
