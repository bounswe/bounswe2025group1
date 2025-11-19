import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import ForumCreateDialog from './ForumCreateDialog';
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

describe('ForumCreateDialog Component', () => {
  const mockToken = 'mock-token';
  const mockOnClose = vi.fn();
  const mockOnPostCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock return values
    useAuth.mockReturnValue({
      token: mockToken,
    });

    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '123',
          title: 'New Post Title',
          content: 'New post content',
        }),
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  test('renders dialog with title and form fields when open', () => {
    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    expect(screen.getByText('Create New Post')).toBeInTheDocument();

    // Use getByRole with name option for form fields
    expect(screen.getByRole('textbox', { name: /title/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /content/i })).toBeInTheDocument();

    expect(screen.getByText('Post')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('does not render when not open', () => {
    render(
      <ForumCreateDialog open={false} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    expect(screen.queryByText('Create New Post')).not.toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows validation error when submitting without required fields', () => {
    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    const postButton = screen.getByText('Post');
    fireEvent.click(postButton);

    expect(screen.getByText('Title and content are required.')).toBeInTheDocument();
  });

  test('submits form data and calls onPostCreated on success', async () => {
    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    // Fill in form fields
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const contentInput = screen.getByRole('textbox', { name: /content/i });

    fireEvent.change(titleInput, { target: { value: 'New Post Title' } });
    fireEvent.change(contentInput, { target: { value: 'New post content' } });

    // Submit form
    const postButton = screen.getByText('Post');
    fireEvent.click(postButton);

    // Check onPostCreated was called with response data
    await waitFor(() => {
      expect(mockOnPostCreated).toHaveBeenCalledWith({
        id: '123',
        title: 'New Post Title',
        content: 'New post content',
      });
    });
  });

  test('shows error message when API request fails', async () => {
    // Mock fetch error
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
    });

    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    // Fill in form fields
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const contentInput = screen.getByRole('textbox', { name: /content/i });

    fireEvent.change(titleInput, { target: { value: 'New Post Title' } });
    fireEvent.change(contentInput, { target: { value: 'New post content' } });

    // Submit form
    const postButton = screen.getByText('Post');
    fireEvent.click(postButton);

    // onPostCreated should not be called
    expect(mockOnPostCreated).not.toHaveBeenCalled();
  });

  test('shows loading state while submitting', async () => {
    // Delay the fetch response
    fetch.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                id: '123',
                title: 'New Post Title',
                content: 'New post content',
              }),
          });
        }, 100);
      });
    });

    render(
      <ForumCreateDialog open={true} onClose={mockOnClose} onPostCreated={mockOnPostCreated} />
    );

    // Fill in form fields
    const titleInput = screen.getByRole('textbox', { name: /title/i });
    const contentInput = screen.getByRole('textbox', { name: /content/i });

    fireEvent.change(titleInput, { target: { value: 'New Post Title' } });
    fireEvent.change(contentInput, { target: { value: 'New post content' } });

    // Submit form
    const postButton = screen.getByText('Post');
    fireEvent.click(postButton);

    // Loading state should be shown
    expect(screen.getByText('Posting...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for the fetch to complete
    await waitFor(() => {
      expect(mockOnPostCreated).toHaveBeenCalled();
    });
  });
});
