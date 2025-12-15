import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ImpactSummaryTab from './ImpactSummaryTab';
import { useAuth } from '../contexts/AuthContextUtils';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material/Group', () => ({
    default: function GroupIcon() { return React.createElement('svg', { 'data-testid': 'group-icon' }); },
}));

vi.mock('@mui/icons-material/Yard', () => ({
    default: function YardIcon() { return React.createElement('svg', { 'data-testid': 'yard-icon' }); },
}));

vi.mock('@mui/icons-material/TaskAlt', () => ({
    default: function TaskAltIcon() { return React.createElement('svg', { 'data-testid': 'taskalt-icon' }); },
}));

vi.mock('@mui/icons-material/Forum', () => ({
    default: function ForumIcon() { return React.createElement('svg', { 'data-testid': 'forum-icon' }); },
}));

vi.mock('@mui/icons-material/Event', () => ({
    default: function EventIcon() { return React.createElement('svg', { 'data-testid': 'event-icon' }); },
}));

vi.mock('@mui/icons-material/AccessTime', () => ({
    default: function AccessTimeIcon() { return React.createElement('svg', { 'data-testid': 'accesstime-icon' }); },
}));

vi.mock('@mui/icons-material/ThumbUp', () => ({
    default: function ThumbUpIcon() { return React.createElement('svg', { 'data-testid': 'thumbup-icon' }); },
}));

vi.mock('@mui/icons-material/Star', () => ({
    default: function StarIcon() { return React.createElement('svg', { 'data-testid': 'star-icon' }); },
}));

// Mock AuthContext
vi.mock('../contexts/AuthContextUtils', () => ({
    useAuth: vi.fn(),
}));

// Mock fetch
window.fetch = vi.fn();

describe('ImpactSummaryTab Component', () => {
    const mockToken = 'test-token';
    const mockUserId = 1;

    const mockImpactData = {
        member_since: '2024-01-01T00:00:00Z',
        followers_count: 10,
        following_count: 5,
        gardens_joined: 3,
        gardens_managed: 2,
        tasks_completed: 15,
        tasks_assigned_by: 8,
        tasks_assigned_to: 12,
        task_completion_rate: 75.5,
        average_task_response_time_hours: 2.5,
        posts_created: 20,
        comments_made: 50,
        likes_received: 100,
        best_answers: 5,
        events_created: 3,
        events_attended: 10,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ token: mockToken });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Loading State', () => {
        test('shows loading spinner while fetching data', () => {
            window.fetch.mockImplementation(() => new Promise(() => { })); // Never resolves

            render(<ImpactSummaryTab userId={mockUserId} />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });
    });

    describe('Error States', () => {
        test('shows error message for 403 response', async () => {
            window.fetch.mockResolvedValue({
                ok: false,
                status: 403,
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('Cannot view impact summary for this user')).toBeInTheDocument();
            });
        });

        test('shows error message for 404 response', async () => {
            window.fetch.mockResolvedValue({
                ok: false,
                status: 404,
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('User not found')).toBeInTheDocument();
            });
        });

        test('shows generic error message for other errors', async () => {
            window.fetch.mockResolvedValue({
                ok: false,
                status: 500,
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('No impact data available')).toBeInTheDocument();
            });
        });

        test('shows error message when fetch throws', async () => {
            window.fetch.mockRejectedValue(new Error('Network error'));

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('No impact data available')).toBeInTheDocument();
            });
        });
    });

    describe('Successful Data Fetching', () => {
        test('fetches impact data with correct URL and headers', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(window.fetch).toHaveBeenCalledWith(
                    expect.stringContaining(`/user/${mockUserId}/impact-summary/`),
                    expect.objectContaining({
                        headers: {
                            Authorization: `Token ${mockToken}`,
                        },
                    })
                );
            });
        });

        test('displays gardens joined count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getAllByText('3')).not.toHaveLength(0);
            });
        });

        test('displays gardens managed count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('2')).toBeInTheDocument();
            });
        });

        test('displays tasks completed count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('15')).toBeInTheDocument();
            });
        });

        test('displays task completion rate', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('76%')).toBeInTheDocument();
            });
        });

        test('displays posts created count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('20')).toBeInTheDocument();
            });
        });

        test('displays comments made count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('50')).toBeInTheDocument();
            });
        });

        test('displays events attended count', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockImpactData),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('10')).toBeInTheDocument();
            });
        });
    });

    describe('Missing Token or UserId', () => {
        test('does not fetch when token is missing', () => {
            useAuth.mockReturnValue({ token: null });

            render(<ImpactSummaryTab userId={mockUserId} />);

            expect(window.fetch).not.toHaveBeenCalled();
        });

        test('does not fetch when userId is missing', () => {
            render(<ImpactSummaryTab userId={null} />);

            expect(window.fetch).not.toHaveBeenCalled();
        });
    });

    describe('Response Time Formatting', () => {
        test('displays response time in hours format', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    ...mockImpactData,
                    average_task_response_time_hours: 2.5,
                }),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('2.5')).toBeInTheDocument();
            });
        });

        test('displays dash for null response time', async () => {
            window.fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    ...mockImpactData,
                    average_task_response_time_hours: null,
                }),
            });

            render(<ImpactSummaryTab userId={mockUserId} />);

            await waitFor(() => {
                expect(screen.getByText('-')).toBeInTheDocument();
            });
        });
    });
});
