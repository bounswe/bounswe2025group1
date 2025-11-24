import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportDialog from './ReportDialog';

// Mock useAuth
const mockToken = 'test-token';
vi.mock('../contexts/AuthContextUtils', () => ({
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

describe('ReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly when open', () => {
    render(<ReportDialog open={true} onClose={() => {}} contentType="post" objectId={1} />);
    
    expect(screen.getByText('Report Content')).toBeInTheDocument();
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ReportDialog open={false} onClose={() => {}} contentType="post" objectId={1} />);
    
    expect(screen.queryByText('Report Content')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<ReportDialog open={true} onClose={onClose} contentType="post" objectId={1} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('submits report successfully', async () => {
    const onClose = vi.fn();
    fetch.mockResolvedValueOnce({ ok: true });

    render(<ReportDialog open={true} onClose={onClose} contentType="post" objectId={123} />);

    // Fill form (reason is default 'abuse')
    const descriptionInput = screen.getByLabelText('Description (Optional)');
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    // Submit
    fireEvent.click(screen.getByText('Report'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/reports/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${mockToken}`,
        },
        body: JSON.stringify({
          content_type: 'post',
          object_id: 123,
          reason: 'abuse',
          description: 'Test description',
        }),
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('handles submission error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ detail: 'Error' }) });

    render(<ReportDialog open={true} onClose={() => {}} contentType="post" objectId={1} />);

    fireEvent.click(screen.getByText('Report'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
    // Toast should be called (mocked)
  });
});

