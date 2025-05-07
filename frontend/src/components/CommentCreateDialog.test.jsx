import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import CommentCreateDialog from './CommentCreateDialog';
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
  }
}));

// Mock fetch
window.fetch = vi.fn();

// Set up environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

describe('CommentCreateDialog Component', () => {
  const mockToken = 'mock-token';
  const mockPostId = '123';
  const mockOnClose = vi.fn();
  const mockOnCommentCreated = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock return values
    useAuth.mockReturnValue({
      token: mockToken
    });
    
    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'comment-123',
        content: 'New comment content',
        forum_post: mockPostId,
        author: 'user1',
        created_at: '2025-05-05T14:30:00Z'
      })
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  test('renders dialog with title and content field when open', () => {
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    expect(screen.getByText('Add a Comment')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /comment/i })).toBeInTheDocument();
    expect(screen.getByText('Post Comment')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('does not render when not open', () => {
    render(
      <CommentCreateDialog 
        open={false} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    expect(screen.queryByText('Add a Comment')).not.toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

test('disables Post Comment button when content is empty', () => {
    render(
        <CommentCreateDialog 
            open={true} 
            onClose={mockOnClose} 
            postId={mockPostId}
            onCommentCreated={mockOnCommentCreated}
        />
    );
    
    // Verify the Post Comment button is disabled
    const postButton = screen.getByText('Post Comment');
    expect(postButton).toBeDisabled();
    
    // No validation error should be shown
    expect(screen.queryByText('Comment cannot be empty')).not.toBeInTheDocument();
});

  test('submits comment and calls onCommentCreated on success', async () => {
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    // Fill in comment content
    const contentInput = screen.getByRole('textbox', { name: /comment/i });
    fireEvent.change(contentInput, { target: { value: 'New comment content' } });
    
    // Submit form
    const postButton = screen.getByText('Post Comment');
    fireEvent.click(postButton);
    
    // Check fetch was called with correct data
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://test-api.example.com/forum/comments/',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Token ${mockToken}`
          }),
          body: JSON.stringify({
            forum_post: mockPostId,
            content: 'New comment content'
          })
        })
      );
    });
    
    // Check onCommentCreated was called with response data
    await waitFor(() => {
      expect(mockOnCommentCreated).toHaveBeenCalledWith({
        id: 'comment-123',
        content: 'New comment content',
        forum_post: mockPostId,
        author: 'user1',
        created_at: '2025-05-05T14:30:00Z'
      });
    });
  });

  test('shows error message when API request fails', async () => {
    // Mock fetch error
    fetch.mockResolvedValue({
      ok: false,
      status: 400
    });
    
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    // Fill in comment content
    const contentInput = screen.getByRole('textbox', { name: /comment/i });
    fireEvent.change(contentInput, { target: { value: 'New comment content' } });
    
    // Submit form
    const postButton = screen.getByText('Post Comment');
    fireEvent.click(postButton);
    
    // Error should be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to post your comment. Please try again.')).toBeInTheDocument();
    });
    
    // onCommentCreated should not be called
    expect(mockOnCommentCreated).not.toHaveBeenCalled();
  });

  test('shows loading state while submitting', async () => {
    // Delay the fetch response
    fetch.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'comment-123',
              content: 'New comment content',
              forum_post: mockPostId,
              author: 'user1',
              created_at: '2025-05-05T14:30:00Z'
            })
          });
        }, 100);
      });
    });
    
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    // Fill in comment content
    const contentInput = screen.getByRole('textbox', { name: /comment/i });
    fireEvent.change(contentInput, { target: { value: 'New comment content' } });
    
    // Submit form
    const postButton = screen.getByText('Post Comment');
    fireEvent.click(postButton);
    
    // Loading state should be shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Posting...')).toBeInTheDocument();
    
    // Wait for the fetch to complete
    await waitFor(() => {
      expect(mockOnCommentCreated).toHaveBeenCalled();
    });
  });

  test('disables submit button when content is empty', () => {
    render(
      <CommentCreateDialog 
        open={true} 
        onClose={mockOnClose} 
        postId={mockPostId}
        onCommentCreated={mockOnCommentCreated}
      />
    );
    
    const postButton = screen.getByText('Post Comment');
    expect(postButton).toBeDisabled();
    
    // Add content to enable button
    const contentInput = screen.getByRole('textbox', { name: /comment/i });
    fireEvent.change(contentInput, { target: { value: 'Some content' } });
    
    expect(postButton).not.toBeDisabled();
  });
});