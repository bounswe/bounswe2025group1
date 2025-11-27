import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ForumList from './ForumList';
import { useAuth } from '../../contexts/AuthContextUtils';

// Mock dependencies
vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock MUI Icons
vi.mock('@mui/icons-material', () => ({
  Search: () => <div data-testid="SearchIcon" />,
  Add: () => <div data-testid="AddIcon" />,
  Forum: () => <div data-testid="ForumIcon" />,
  People: () => <div data-testid="PeopleIcon" />,
}));

// Mock child components
vi.mock('../../components/ForumCreateDialog', () => ({
  default: ({ open, onClose, onPostCreated }) => (
    open ? (
      <div data-testid="forum-create-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={() => onPostCreated({ id: 99, title: 'New Post', content: 'New Content', author_username: 'me' })}>Create</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/CommentCreateDialog', () => ({
  default: ({ open, onClose, onCommentCreated }) => (
    open ? (
      <div data-testid="comment-create-dialog">
        <button onClick={onClose}>Close</button>
        <button onClick={onCommentCreated}>Comment</button>
      </div>
    ) : null
  ),
}));

vi.mock('../../components/PostCard', () => ({
  default: ({ post, onDelete, onComment }) => (
    <div data-testid="post-card">
      <span>{post.title}</span>
      <span>{post.content}</span>
      <button onClick={() => onDelete(post.id)}>Delete</button>
      <button onClick={() => onComment(post.id, { content: 'Nice' })}>Comment</button>
    </div>
  ),
}));

vi.mock('../../components/PostComposer', () => ({
  default: ({ onSubmit }) => (
    <div data-testid="post-composer">
      <button onClick={() => onSubmit({ content: 'Quick post', images: [] })}>Quick Post</button>
    </div>
  ),
}));

describe('ForumList Component', () => {
  const mockUser = { id: 1, username: 'testuser' };
  const mockToken = 'mock-token';
  const mockPosts = [
    { id: 1, title: 'Post 1', content: 'Content 1', author: 1, author_username: 'testuser', created_at: '2025-01-01' },
    { id: 2, title: 'Post 2', content: 'Content 2', author: 2, author_username: 'other', created_at: '2025-01-02' },
  ];

  beforeAll(() => {
    vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, token: mockToken });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    fetch.mockImplementation(() => new Promise(() => { })); // Never resolves
    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders posts after fetch', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
      expect(screen.getByText('Post 2')).toBeInTheDocument();
    });
  });

  test('handles fetch error', async () => {
    fetch.mockRejectedValueOnce(new Error('Fetch failed'));

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
    // Toast should be called, but we mocked it.
  });

  test('filters posts by search term', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText('Search forum posts');
    fireEvent.change(searchInput, { target: { value: 'Post 1' } });

    expect(screen.getByText('Post 1')).toBeInTheDocument();
    expect(screen.queryByText('Post 2')).not.toBeInTheDocument();
  });

  test('toggles following only', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
    });

    const toggleButton = screen.getByTestId('followed-only-button');
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('following=true'), expect.any(Object));
    });
  });

  test('opens create post dialog', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const createButton = screen.getByTestId('create-post-button');
    fireEvent.click(createButton);

    expect(screen.getByTestId('forum-create-dialog')).toBeInTheDocument();
  });

  test('handles post creation via dialog', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    const createButton = screen.getByTestId('create-post-button');
    fireEvent.click(createButton);

    const dialogCreateButton = screen.getByText('Create');
    fireEvent.click(dialogCreateButton);

    expect(screen.getByText('New Post')).toBeInTheDocument();
  });

  test('handles quick post submission', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    // Mock create response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 100, title: 'Quick post', content: 'Quick post', author: 1 }),
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('post-composer')).toBeInTheDocument();
    });

    const quickPostButton = screen.getByText('Quick Post');
    fireEvent.click(quickPostButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/forum/'), expect.objectContaining({ method: 'POST' }));
    });
  });

  test('handles post deletion', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    // Mock delete response
    fetch.mockResolvedValueOnce({
      ok: true,
    });

    render(
      <BrowserRouter>
        <ForumList />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/forum/1/'), expect.objectContaining({ method: 'DELETE' }));
    });
  });
});