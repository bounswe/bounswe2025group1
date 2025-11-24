import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModerationDashboard from './ModerationDashboard';

// Mock useAuth
const mockToken = 'test-token';
vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: () => ({
    token: mockToken,
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

// Mock toast
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

global.fetch = vi.fn();

const mockReports = [
  {
    id: 1,
    created_at: '2023-01-01T10:00:00Z',
    reporter: { username: 'reporter1' },
    content_type: 'post',
    object_id: 101,
    reason: 'abuse',
    description: 'Bad post',
    reviewed: false,
    is_valid: null,
  },
  {
    id: 2,
    created_at: '2023-01-02T10:00:00Z',
    reporter: { username: 'reporter2' },
    content_type: 'comment',
    object_id: 202,
    reason: 'spam',
    description: 'Spam comment',
    reviewed: true,
    is_valid: true,
  },
];

describe('ModerationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Pending promise
    render(<ModerationDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders reports after fetch', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReports,
    });

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Check if table headers are present
    expect(screen.getByText('Reporter')).toBeInTheDocument();
    expect(screen.getByText('Reason')).toBeInTheDocument();

    // Check if pending report is shown (default tab is pending)
    expect(screen.getByText('reporter1')).toBeInTheDocument();
    expect(screen.getByText('Bad post')).toBeInTheDocument();

    // Reviewed report should NOT be shown in pending tab
    expect(screen.queryByText('reporter2')).not.toBeInTheDocument();
  });

  it('switches tabs to show reviewed reports', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReports,
    });

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('reporter1')).toBeInTheDocument();
    });

    // Click Reviewed tab
    fireEvent.click(screen.getByText('Reviewed History'));

    expect(screen.queryByText('reporter1')).not.toBeInTheDocument();
    expect(screen.getByText('reporter2')).toBeInTheDocument();
    expect(screen.getByText('Spam comment')).toBeInTheDocument();
  });

  it('opens review dialog and submits review', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockReports,
    });

    render(<ModerationDashboard />);

    await waitFor(() => {
      expect(screen.getByText('reporter1')).toBeInTheDocument();
    });

    // Click Accept (mark as valid)
    fireEvent.click(screen.getByText('Accept'));

    // Dialog should open
    expect(screen.getByText('Confirm Report Validity')).toBeInTheDocument();

    // Confirm
    fetch.mockResolvedValueOnce({ ok: true }); // Mock review response
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] }); // Mock refresh fetch

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/reports/1/review/'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ is_valid: true }),
        })
      );
    });
  });
});

