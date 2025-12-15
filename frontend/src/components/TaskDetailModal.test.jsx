import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import TaskDetailModal from './TaskDetailModal';
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

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key) => {
            const translations = {
                'tasks.pending': 'Pending',
                'tasks.in_progress': 'In Progress',
                'tasks.completed': 'Completed',
                'tasks.declined': 'Declined',
                'tasks.deadline': 'Deadline',
                'tasks.assignee': 'Assignee',
                'tasks.taskType': 'Task Type',
                'tasks.notAssigned': 'Not Assigned',
                'tasks.unassigned': 'Unassigned',
                'tasks.acceptTask': 'Accept Task',
                'tasks.declineTask': 'Decline Task',
                'tasks.deleteTask': 'Delete Task',
                'tasks.editTask': 'Edit Task',
                'common.close': 'Close',
                'gardens.confirmDeleteTask': 'Are you sure you want to delete this task?',
                'gardens.taskDeleted': 'Task deleted successfully',
                'gardens.failedToDeleteTask': 'Failed to delete task',
            };
            return translations[key] || key;
        },
        i18n: {
            language: 'en',
            changeLanguage: vi.fn(),
        },
    }),
}));

// Mock fetch
window.fetch = vi.fn();

// Set up environment variables
beforeAll(() => {
    vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

describe('TaskDetailModal Component', () => {
    const mockUser = {
        user_id: 1,
        username: 'testuser',
    };

    const mockToken = 'mock-token';
    const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING',
        assigned_to: [1],
        assigned_to_usernames: ['testuser'],
        due_date: '2025-01-15T10:00:00Z',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-02T10:00:00Z',
        custom_type_name: 'Watering',
        garden: 1,
    };

    const mockOnClose = vi.fn();
    const mockOnTaskUpdated = vi.fn();
    const mockOnTaskDeleted = vi.fn();
    const mockHandleAcceptTask = vi.fn();
    const mockHandleDeclineTask = vi.fn();
    const mockOnEditClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        useAuth.mockReturnValue({
            user: mockUser,
            token: mockToken,
        });

        // Mock successful fetch responses
        fetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockTask),
        });
    });

    afterAll(() => {
        vi.unstubAllEnvs();
    });

    test('renders modal with task details when open', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={true}
                canDelete={true}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        // Check that the modal is rendered
        const modal = screen.getAllByRole('dialog')[1];
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'task-detail-title');

        // Check task title is displayed
        expect(screen.getByText('Test Task')).toBeInTheDocument();

        // Check task description is displayed
        expect(screen.getByText('Test Description')).toBeInTheDocument();

        // Check status chip is displayed
        expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    test('does not render when task is null', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={null}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={true}
                canDelete={true}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('displays Edit button when canEdit is true', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={true}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const editButton = screen.getByRole('button', { name: /edit task/i });
        expect(editButton).toBeInTheDocument();
    });

    test('hides Edit button when canEdit is false', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.queryByRole('button', { name: /edit task/i })).not.toBeInTheDocument();
    });

    test('displays Delete button when canDelete is true', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={true}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete task/i });
        expect(deleteButton).toBeInTheDocument();
    });

    test('hides Delete button when canDelete is false', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.queryByRole('button', { name: /delete task/i })).not.toBeInTheDocument();
    });

    test('displays Accept and Decline buttons when user is assigned and status is PENDING', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const acceptButton = screen.getByRole('button', { name: /accept task/i });
        const declineButton = screen.getByRole('button', { name: /decline task/i });

        expect(acceptButton).toBeInTheDocument();
        expect(declineButton).toBeInTheDocument();
    });

    test('hides Accept and Decline buttons when status is not PENDING', () => {
        const completedTask = { ...mockTask, status: 'COMPLETED' };

        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={completedTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.queryByRole('button', { name: /accept task/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /decline task/i })).not.toBeInTheDocument();
    });

    test('calls onClose when Close button is clicked', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    test('calls onEditClick when Edit button is clicked', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={true}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const editButton = screen.getByRole('button', { name: /edit task/i });
        fireEvent.click(editButton);

        expect(mockOnEditClick).toHaveBeenCalled();
    });

    test('calls handleAcceptTask when Accept button is clicked', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const acceptButton = screen.getByRole('button', { name: /accept task/i });
        fireEvent.click(acceptButton);

        expect(mockHandleAcceptTask).toHaveBeenCalledWith(mockTask);
    });

    test('calls handleDeclineTask when Decline button is clicked', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const declineButton = screen.getByRole('button', { name: /decline task/i });
        fireEvent.click(declineButton);

        expect(mockHandleDeclineTask).toHaveBeenCalledWith(mockTask);
    });

    test('displays assignee names when available', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });

    test('displays task type when available', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        expect(screen.getByText(/Watering/i)).toBeInTheDocument();
    });

    test('displays correct status label for different statuses', () => {
        const statusTests = [
            { status: 'PENDING', label: 'Pending' },
            { status: 'IN_PROGRESS', label: 'In Progress' },
            { status: 'COMPLETED', label: 'Completed' },
            { status: 'DECLINED', label: 'Declined' },
        ];

        statusTests.forEach(({ status, label }) => {
            const taskWithStatus = { ...mockTask, status, assigned_to: [] };

            const { unmount } = render(
                <TaskDetailModal
                    open={true}
                    onClose={mockOnClose}
                    task={taskWithStatus}
                    onTaskUpdated={mockOnTaskUpdated}
                    onTaskDeleted={mockOnTaskDeleted}
                    canEdit={false}
                    canDelete={false}
                    handleAcceptTask={mockHandleAcceptTask}
                    handleDeclineTask={mockHandleDeclineTask}
                    onEditClick={mockOnEditClick}
                />
            );

            expect(screen.getByText(label)).toBeInTheDocument();
            unmount();
        });
    });

    test('supports Escape key to close modal', () => {
        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={false}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const modal = screen.getAllByRole('dialog')[1];
        fireEvent.keyDown(modal, { key: 'Escape' });

        expect(mockOnClose).toHaveBeenCalled();
    });

    test('calls onTaskDeleted after successful delete', async () => {
        // Mock window.confirm to return true
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => true);

        fetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
        });

        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={true}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete task/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockOnTaskDeleted).toHaveBeenCalledWith(mockTask.id);
        });

        // Restore original confirm
        window.confirm = originalConfirm;
    });

    test('does not delete task when confirm is cancelled', async () => {
        // Mock window.confirm to return false
        const originalConfirm = window.confirm;
        window.confirm = vi.fn(() => false);

        render(
            <TaskDetailModal
                open={true}
                onClose={mockOnClose}
                task={mockTask}
                onTaskUpdated={mockOnTaskUpdated}
                onTaskDeleted={mockOnTaskDeleted}
                canEdit={false}
                canDelete={true}
                handleAcceptTask={mockHandleAcceptTask}
                handleDeclineTask={mockHandleDeclineTask}
                onEditClick={mockOnEditClick}
            />
        );

        const deleteButton = screen.getByRole('button', { name: /delete task/i });
        fireEvent.click(deleteButton);

        expect(fetch).not.toHaveBeenCalled();
        expect(mockOnTaskDeleted).not.toHaveBeenCalled();

        // Restore original confirm
        window.confirm = originalConfirm;
    });
});
