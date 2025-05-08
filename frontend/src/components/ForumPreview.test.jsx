import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ForumPreview from './ForumPreview';
import { useNavigate } from 'react-router-dom';
import React from 'react';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
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
  });

  test('renders the forum preview with posts', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    // Title should be visible
    expect(screen.getByText('Community Forum')).toBeInTheDocument();
    
    // By default, it should show only 3 posts
    expect(screen.getByText('First Post Title')).toBeInTheDocument();
    expect(screen.getByText('Second Post Title')).toBeInTheDocument();
    expect(screen.getByText('Third Post Title')).toBeInTheDocument();
    expect(screen.queryByText('Fourth Post Title')).not.toBeInTheDocument();
  });

  test('respects the limit prop for number of posts to display', () => {
    render(<ForumPreview posts={mockPosts} limit={2} />);
    
    // Only first 2 posts should be visible
    expect(screen.getByText('First Post Title')).toBeInTheDocument();
    expect(screen.getByText('Second Post Title')).toBeInTheDocument();
    expect(screen.queryByText('Third Post Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Fourth Post Title')).not.toBeInTheDocument();
  });

  test('displays a message when there are no posts', () => {
    render(<ForumPreview posts={[]} />);
    
    expect(screen.getByText('Join discussions, share gardening tips, and connect with fellow garden enthusiasts.')).toBeInTheDocument();
    expect(screen.getByText('Explore Forum')).toBeInTheDocument();
  });

  test('navigates to forum list when "Explore Forum" button is clicked', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    const exploreButton = screen.getByText('Explore Forum');
    fireEvent.click(exploreButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum');
  });

  test('navigates to post detail when a post is clicked', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    // Click the first post
    const firstPostTitle = screen.getByText('First Post Title');
    const listItem = firstPostTitle.closest('li') || firstPostTitle.closest('[role="listitem"]');
    fireEvent.click(listItem);
    
    expect(mockNavigate).toHaveBeenCalledWith('/forum/1');
  });

  test('renders shortened content with ellipsis', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    // Content should be truncated
    expect(screen.getByText(/This is the content of the first post.../)).toBeInTheDocument();
  });

  test('shows author name and date for each post', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    // Dates should be formatted as May 1, May 2, etc.
    expect(screen.getByText(/May 1/)).toBeInTheDocument();
    expect(screen.getByText(/May 2/)).toBeInTheDocument();
    expect(screen.getByText(/May 3/)).toBeInTheDocument();
  });

  test('shows comment count for each post', () => {
    render(<ForumPreview posts={mockPosts} />);
    
    // Look for the comment counts
    const commentCounts = screen.getAllByText(/\d+/);
    
    // At least one should match each count
    expect(commentCounts.some(node => node.textContent === '5')).toBe(true);
    expect(commentCounts.some(node => node.textContent === '3')).toBe(true);
    expect(commentCounts.some(node => node.textContent === '0')).toBe(true);
  });

  test('hides "Explore Forum" button when showViewAll is false', () => {
    render(<ForumPreview posts={mockPosts} showViewAll={false} />);
    
    expect(screen.queryByText('Explore Forum')).not.toBeInTheDocument();
  });
});