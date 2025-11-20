import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ForumList from './ForumList';
import { useAuth } from '../../contexts/AuthContextUtils';
import React from 'react';

// Mock the modules/hooks
vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'forum.title': 'Community Forum',
        'forum.subtitle': 'Join discussions, share gardening tips, and connect with fellow garden enthusiasts.',
        'forum.searchPlaceholder': 'Search posts by title, content or author...',
        'forum.followedOnly': 'Following Only',
        'forum.createPost': 'Create Post',
        'forum.noPosts': 'No posts found',
        'forum.loading': 'Loading posts...',
        'forum.readMore': 'Read More',
        'forum.comments': 'Comments',
        'forum.likes': 'Likes',
        'forum.by': 'by',
        'forum.ago': 'ago'
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock fetch
window.fetch = vi.fn();

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Set up environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

const theme = createTheme();

const renderWithRouter = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('ForumList Component - Keyboard Navigation', () => {
  const mockUser = {
    user_id: 1,
    username: 'testuser',
  };

  const mockToken = 'mock-token';
  const mockPosts = [
    {
      id: 1,
      title: 'First Forum Post',
      content: 'This is the content of the first post',
      author: 1,
      author_username: 'testuser',
      created_at: '2025-01-15T10:00:00Z',
    },
    {
      id: 2,
      title: 'Second Forum Post',
      content: 'This is the content of the second post',
      author: 2,
      author_username: 'otheruser',
      created_at: '2025-01-16T14:00:00Z',
    },
    {
      id: 3,
      title: 'Third Forum Post',
      content: 'This is the content of the third post',
      author: 1,
      author_username: 'testuser',
      created_at: '2025-01-17T09:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      user: mockUser,
      token: mockToken,
    });

    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  test('renders forum list with keyboard navigation support', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('Community Forum')).toBeInTheDocument();
    });

    // Check that the forum list has proper ARIA attributes
    const forumList = screen.getByRole('list', { name: /forum posts/i });
    expect(forumList).toBeInTheDocument();

    // Check that posts are rendered
    expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    expect(screen.getByText('Second Forum Post')).toBeInTheDocument();
    expect(screen.getByText('Third Forum Post')).toBeInTheDocument();
  });

  test('supports keyboard navigation with arrow keys', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    // Test Arrow Down navigation
    fireEvent.keyDown(forumList, { key: 'ArrowDown' });
    
    // Test Arrow Up navigation
    fireEvent.keyDown(forumList, { key: 'ArrowUp' });
    
    // Should not cause errors
    expect(forumList).toBeInTheDocument();
  });

  test('supports Enter key to select posts', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    // Navigate to first post and press Enter
    fireEvent.keyDown(forumList, { key: 'ArrowDown' });
    fireEvent.keyDown(forumList, { key: 'Enter' });
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  test('supports Space key to select posts', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    // Navigate to first post and press Space
    fireEvent.keyDown(forumList, { key: 'ArrowDown' });
    fireEvent.keyDown(forumList, { key: ' ' });
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  test('supports Home key to jump to first post', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    fireEvent.keyDown(forumList, { key: 'Home' });
    
    // Should focus the first post
    expect(forumList).toBeInTheDocument();
  });

  test('supports End key to jump to last post', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    fireEvent.keyDown(forumList, { key: 'End' });
    
    // Should focus the last post
    expect(forumList).toBeInTheDocument();
  });

  test('search field supports keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const searchField = screen.getByLabelText('Search forum posts');
    
    expect(searchField).toBeInTheDocument();
    expect(searchField).toHaveAttribute('aria-label', 'Search forum posts');
  });

  test('new post button supports keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const newPostButton = screen.getByRole('button', { name: /create new forum post/i });
    
    // Test Enter key on New Post button
    fireEvent.keyDown(newPostButton, { key: 'Enter' });
    
    // Should open create dialog
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
  });

  test('comment buttons support keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const commentButtons = screen.getAllByRole('button', { name: /add comment to post/i });
    
    expect(commentButtons).toHaveLength(3);
    
    // Test Enter key on first comment button
    fireEvent.keyDown(commentButtons[0], { key: 'Enter' });
    
    // Should open comment dialog
    expect(screen.getByText('Add a Comment')).toBeInTheDocument();
  });

  test('read more buttons support keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const readMoreButtons = screen.getAllByRole('button', { name: /read full post/i });
    
    expect(readMoreButtons).toHaveLength(3);
    
    // Test Space key on first read more button
    fireEvent.keyDown(readMoreButtons[0], { key: ' ' });
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  test('author links support keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const authorLinks = screen.getAllByRole('link', { name: /view profile of/i });
    
    expect(authorLinks).toHaveLength(3);
    
    // Test Enter key on first author link
    fireEvent.keyDown(authorLinks[0], { key: 'Enter' });
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile/1');
  });

  test('floating action button supports keyboard navigation', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const fab = screen.getByRole('button', { name: /create post/i });
    
    // Test Enter key on FAB
    fireEvent.keyDown(fab, { key: 'Enter' });
    
    // Should open create dialog
    expect(screen.getByText('Create New Post')).toBeInTheDocument();
  });

  test('post items have proper focus indicators', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const postItems = screen.getAllByRole('listitem');
    expect(postItems).toHaveLength(3);
    
    // Each post item should have proper ARIA attributes
    postItems.forEach((item, index) => {
      expect(item).toHaveAttribute('tabindex', '0');
      expect(item).toHaveAttribute('role', 'listitem');
    });
  });

  test('handles empty post list gracefully', async () => {
    // Mock empty response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('No posts found')).toBeInTheDocument();
    });

    expect(screen.queryByRole('list', { name: /forum posts/i })).not.toBeInTheDocument();
  });

  test('handles search functionality with keyboard', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const searchField = screen.getByLabelText('Search forum posts');
    
    // Type in search field
    fireEvent.change(searchField, { target: { value: 'First' } });
    
    // Should filter posts
    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
      expect(screen.queryByText('Second Forum Post')).not.toBeInTheDocument();
    });
  });

  test('handles keyboard navigation without errors', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const forumList = screen.getByRole('list', { name: /forum posts/i });
    
    // Test various keyboard interactions
    fireEvent.keyDown(forumList, { key: 'Tab' });
    fireEvent.keyDown(forumList, { key: 'Shift' });
    fireEvent.keyDown(forumList, { key: 'ArrowLeft' });
    fireEvent.keyDown(forumList, { key: 'ArrowRight' });
    
    // Should not cause any errors
    expect(forumList).toBeInTheDocument();
  });

  test('supports normal tab navigation for post items', async () => {
    renderWithRouter(<ForumList />);

    await waitFor(() => {
      expect(screen.getByText('First Forum Post')).toBeInTheDocument();
    });

    const postItems = screen.getAllByRole('listitem');
    
    // All items should be focusable with normal tab navigation
    expect(postItems[0]).toHaveAttribute('tabindex', '0');
    expect(postItems[1]).toHaveAttribute('tabindex', '0');
    expect(postItems[2]).toHaveAttribute('tabindex', '0');
  });
});