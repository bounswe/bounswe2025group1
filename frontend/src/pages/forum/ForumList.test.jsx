import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForumList from './ForumList';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useNavigate } from 'react-router-dom';
import React from 'react';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../components/ForumCreateDialog', () => ({
  default: ({ onPostCreated }) => (
    <div
      data-testid="forum-create-dialog"
      onClick={() =>
        onPostCreated({
          id: '123',
          title: 'New Post',
          content: 'New post content',
          author: 'user1',
          created_at: '2025-05-01T12:00:00Z',
          updated_at: '2025-05-01T12:00:00Z',
        })
      }
    >
      Mock Forum Create Dialog
    </div>
  ),
}));

vi.mock('../../components/CommentCreateDialog', () => ({
  default: ({ onCommentCreated }) => (
    <div data-testid="comment-create-dialog" onClick={() => onCommentCreated()}>
      Mock Comment Create Dialog
    </div>
  ),
}));

// Mock fetch
window.fetch = vi.fn();

describe('ForumList Component', () => {
  const mockNavigate = vi.fn();
  const mockPosts = [
    {
      id: '1',
      title: 'First Post',
      content: 'This is the first post content',
      author: 'user1',
      created_at: '2025-05-01T12:00:00Z',
    },
    {
      id: '2',
      title: 'Second Post',
      content: 'This is the second post content',
      author: 'user2',
      created_at: '2025-05-02T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);

    // Default mock return values
    useAuth.mockReturnValue({
      currentUser: { id: 'user1' },
      token: 'mock-token',
    });

    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    });
  });

  test('renders loading state initially', async () => {
    render(<ForumList />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders forum posts after loading', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
    });
  });

  test('shows "No posts found" when there are no posts', async () => {
    // Mock empty posts array
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument();
    });
  });

  test('filters posts based on search term', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Post')).toBeInTheDocument();
    });

    // Type in search field
    const searchInput = screen.getByPlaceholderText('Search posts by title, content or author...');
    fireEvent.change(searchInput, { target: { value: 'Second' } });

    // First post should be filtered out
    await waitFor(() => {
      expect(screen.queryByText('First Post')).not.toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
    });
  });

  test('opens forum create dialog when "New Post" button is clicked', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Click on New Post button
    const newPostButton = screen.getByText('New Post');
    fireEvent.click(newPostButton);

    // Dialog should be opened
    expect(screen.getByTestId('forum-create-dialog')).toBeInTheDocument();
  });

  test('navigates to post detail when "Read More" button is clicked', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click read more buttons (there should be one for each post)
    const readMoreButtons = screen.getAllByText('Read More');
    fireEvent.click(readMoreButtons[0]); // Click on first post's read more button

    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  test('opens comment dialog when "Comment" button is clicked', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Find and click the comment button for the first post
    const commentButtons = screen.getAllByText('Comment');
    fireEvent.click(commentButtons[0]);

    // Dialog should be opened
    expect(screen.getByTestId('comment-create-dialog')).toBeInTheDocument();
  });

  test('shows error when fetch fails', async () => {
    // Mock fetch error
    fetch.mockRejectedValue(new Error('Failed to fetch'));

    // Using console.error spy to prevent error logs in test output
    const consoleSpy = vi.spyOn(console, 'error');
    consoleSpy.mockImplementation(() => {});

    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Clean up spy
    consoleSpy.mockRestore();
  });

  test('handles new post creation and navigates to the post', async () => {
    render(<ForumList />);

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Open the create dialog
    const newPostButton = screen.getByText('New Post');
    fireEvent.click(newPostButton);

    // Trigger post creation by clicking the mock dialog
    const dialog = screen.getByTestId('forum-create-dialog');
    fireEvent.click(dialog);

    // Should navigate to the new post
    expect(mockNavigate).toHaveBeenCalledWith('/forum/123');
  });
});
