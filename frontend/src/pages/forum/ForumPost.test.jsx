import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForumPost from './ForumPost';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useParams, useNavigate } from 'react-router-dom';
import React from 'react';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

vi.mock('../../components/CommentCreateDialog', () => ({
  default: ({ onCommentCreated }) => (
    <div data-testid="comment-create-dialog" onClick={() => onCommentCreated({
      id: 'comment-1',
      content: 'New comment',
      author: 'user1',
      created_at: '2025-05-05T12:00:00Z',
    })}>
      Mock Comment Create Dialog
    </div>
  ),
}));

// Mock fetch
window.fetch = vi.fn();

describe('ForumPost Component', () => {
  const mockNavigate = vi.fn();
  const mockPost = {
    id: '1',
    title: 'Test Post',
    content: 'This is a test post content',
    author: 'user1',
    created_at: '2025-05-01T12:00:00Z',
    updated_at: '2025-05-01T12:00:00Z',
  };
  const mockComments = [
    {
      id: 'comment-1',
      content: 'First comment',
      author: 'user2',
      created_at: '2025-05-02T12:00:00Z',
    },
    {
      id: 'comment-2',
      content: 'Second comment',
      author: 'user3',
      created_at: '2025-05-03T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ postId: '1' });
    
    // Default mock return values
    useAuth.mockReturnValue({
      currentUser: { id: 'user1' },
      token: 'mock-token'
    });
    
    // Mock successful fetch responses
    fetch.mockImplementation((url) => {
      if (url.includes('/forum/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost)
        });
      } else if (url.includes('/forum/comments/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments)
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders loading state initially', () => {
    render(<ForumPost />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders post and comments after loading', async () => {
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Post content should be visible
    expect(screen.getByText('Test Post')).toBeInTheDocument();
    expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    
    // Comments should be visible
    expect(screen.getByText('First comment')).toBeInTheDocument();
    expect(screen.getByText('Second comment')).toBeInTheDocument();
  });

  test('displays "No comments yet" when there are no comments', async () => {
    // Mock empty comments array
    fetch.mockImplementation((url) => {
      if (url.includes('/forum/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost)
        });
      } else if (url.includes('/forum/comments/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    expect(screen.getByText('No comments yet')).toBeInTheDocument();
  });

  test('enables edit mode when Edit button is clicked', async () => {
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click edit button
    const editButton = screen.getByTestId('EditIcon').closest('button');
    fireEvent.click(editButton);
    
    // Form fields should be visible in edit mode
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('handles post update correctly', async () => {
    fetch.mockImplementation((url, options) => {
      if (url.includes('/forum/1/') && options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            ...mockPost,
            title: 'Updated Title',
            content: 'Updated content'
          })
        });
      } else if (url.includes('/forum/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost)
        });
      } else if (url.includes('/forum/comments/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments)
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Enter edit mode
    const editButton = screen.getByTestId('EditIcon').closest('button');
    fireEvent.click(editButton);
    
    // Update form fields
    const titleInput = screen.getByLabelText('Title');
    const contentInput = screen.getByLabelText('Content');
    
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    fireEvent.change(contentInput, { target: { value: 'Updated content' } });
    
    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    // Should make PUT request
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/forum/1/'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            title: 'Updated Title',
            content: 'Updated content'
          })
        })
      );
    });
  });

  test('shows delete confirmation dialog when Delete button is clicked', async () => {
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
    fireEvent.click(deleteButton);
    
    // Confirmation dialog should appear
    expect(screen.getByText('Delete Post')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this post? This action cannot be undone.')).toBeInTheDocument();
  });

  test('handles post deletion correctly', async () => {
    fetch.mockImplementation((url, options) => {
      if (url.includes('/forum/1/') && options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        });
      } else if (url.includes('/forum/1/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPost)
        });
      } else if (url.includes('/forum/comments/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComments)
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open delete dialog
    const deleteButton = screen.getByTestId('DeleteIcon').closest('button');
    fireEvent.click(deleteButton);
    
    // Confirm deletion
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);
    
    // Should make DELETE request
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/forum/1/'),
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });
    
    // Should navigate back to forum list
    expect(mockNavigate).toHaveBeenCalledWith('/forum');
  });

  test('adds a new comment when comment dialog is submitted', async () => {
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open comment dialog
    const addCommentButton = screen.getByText('Add Comment');
    fireEvent.click(addCommentButton);
    
    // Mock dialog component should be rendered
    const commentDialog = screen.getByTestId('comment-create-dialog');
    fireEvent.click(commentDialog); // Simulate comment creation
    
    // New comment should be added to the list
    expect(screen.getAllByText(/comment/i)).toHaveLength(3); // Two original comments + new one
  });

  test('shows error state when post fetch fails', async () => {
    // Mock fetch error for post
    fetch.mockImplementation((url) => {
      if (url.includes('/forum/1/')) {
        return Promise.resolve({
          ok: false,
          status: 404
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    
    // Error message should be displayed
    expect(screen.getByText(/failed to load the post/i)).toBeInTheDocument();
  });

  test('navigates back to forum list when Back button is clicked', async () => {
    render(<ForumPost />);
    
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click on back button
    const backButton = screen.getByText('Back to Forums');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum');
  });
});