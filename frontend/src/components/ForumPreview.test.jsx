import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForumPreview from './ForumPreview';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useAuth } from '../contexts/AuthContextUtils';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

describe('ForumPreview Component', () => {
  const mockNavigate = vi.fn();
  const mockPosts = [
    {
      id: '1',
      title: 'First Post Title',
      content: 'This is the content of the first post that should be truncated in the preview',
      author: 'user1',
      created_at: '2025-05-01T12:00:00Z',
      updated_at: '2025-05-01T12:00:00Z',
      comments: 5
    },
    {
      id: '2',
      title: 'Second Post Title',
      content: 'This is the content of the second post',
      author: 'user2',
      created_at: '2025-05-02T12:00:00Z',
      updated_at: '2025-05-02T12:00:00Z',
      comments: 3
    },
    {
      id: '3',
      title: 'Third Post Title',
      content: 'This is the content of the third post',
      author: 'user3',
      created_at: '2025-05-03T12:00:00Z',
      updated_at: '2025-05-03T12:00:00Z',
      comments: 0
    },
    {
      id: '4',
      title: 'Fourth Post Title',
      content: 'This is the content of the fourth post',
      author: 'user4',
      created_at: '2025-05-04T12:00:00Z',
      updated_at: '2025-05-04T12:00:00Z',
      comments: 1
    }
  ];
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    // Mock the useAuth hook to return a token
    useAuth.mockReturnValue({
      token: 'mock-token',
      currentUser: { id: 1, username: 'testuser' }
    });
    
    // Mock fetch for API calls
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPosts
    });
  });
  test('renders the forum preview with posts', async () => {
    render(<ForumPreview limit={3} />);
    
    // Initially shows loading state
    expect(screen.getByText('Loading forum data...')).toBeInTheDocument();
    
    // Wait for the posts to load
    await waitFor(() => {
      // Title should be visible
      expect(screen.getByText('Community Forum')).toBeInTheDocument();
      
      // By default, it should show only 3 posts
      expect(screen.getByText('First Post Title')).toBeInTheDocument();
      expect(screen.getByText('Second Post Title')).toBeInTheDocument();
      expect(screen.getByText('Third Post Title')).toBeInTheDocument();
      expect(screen.queryByText('Fourth Post Title')).not.toBeInTheDocument();
    });
  });
  test('respects the limit prop for number of posts to display', async () => {
    render(<ForumPreview limit={2} />);
    
    // Wait for the posts to load
    await waitFor(() => {
      // Only first 2 posts should be visible
      expect(screen.getByText('First Post Title')).toBeInTheDocument();
      expect(screen.getByText('Second Post Title')).toBeInTheDocument();
      expect(screen.queryByText('Third Post Title')).not.toBeInTheDocument();
      expect(screen.queryByText('Fourth Post Title')).not.toBeInTheDocument();
    });
  });
  test('displays a message when there are no posts', async () => {
    // Mock the fetch to return empty array
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });
    
    render(<ForumPreview />);
    
    // Wait for the loading to complete
    await waitFor(() => {
      expect(screen.getByText('Join discussions, share gardening tips, and connect with fellow garden enthusiasts.')).toBeInTheDocument();
      expect(screen.getByText('Explore Forum')).toBeInTheDocument();
    });
  });
  test('navigates to forum list when "Explore Forum" button is clicked', async () => {
    render(<ForumPreview />);
    
    // Wait for the posts to load
    await waitFor(() => {
      expect(screen.getByText('Explore Forum')).toBeInTheDocument();
    });
    
    const exploreButton = screen.getByText('Explore Forum');
    fireEvent.click(exploreButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum');
  });
  test('navigates to post detail when a post is clicked', async () => {
    render(<ForumPreview />);
    
    // Wait for the posts to load
    await waitFor(() => {
      expect(screen.getByText('First Post Title')).toBeInTheDocument();
    });
    
    // Click the first post
    const firstPostTitle = screen.getByText('First Post Title');
    const listItem = firstPostTitle.closest('li') || firstPostTitle.closest('[role="listitem"]');
    fireEvent.click(listItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });
  test('renders shortened content with ellipsis', async () => {
    render(<ForumPreview />);
    
    // Wait for the posts to load
    await waitFor(() => {
      // Content should be truncated
      expect(screen.getByText(/This is the content of the first post.../)).toBeInTheDocument();
    });
  });
  test('shows author name and date for each post', async () => {
    render(<ForumPreview />);
    
    // Wait for the posts to load
    await waitFor(() => {
      // Dates should be formatted as May 1, May 2, etc.
      expect(screen.getByText(/May 1/)).toBeInTheDocument();
      expect(screen.getByText(/May 2/)).toBeInTheDocument();
      expect(screen.getByText(/May 3/)).toBeInTheDocument();
    });
  });
  test('hides "Explore Forum" button when showViewAll is false', async () => {
    render(<ForumPreview showViewAll={false} />);
    
    // Wait for posts to load
    await waitFor(() => {
      expect(screen.getByText('First Post Title')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('Explore Forum')).not.toBeInTheDocument();
  });
});