import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PostCard from './PostCard';
import { useNavigate } from 'react-router-dom';

// Mock the modules/hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

vi.mock('./ImageGallery', () => ({
  default: ({ images }) => (
    <div data-testid="image-gallery">
      {images && images.map((img, idx) => (
        <div key={idx} data-testid={`gallery-image-${idx}`}>{img}</div>
      ))}
    </div>
  ),
}));

vi.mock('./InlineImageUpload', () => ({
  default: ({ onImagesChange, initialImages, compact }) => (
    <div data-testid="inline-image-upload">
      <button onClick={() => onImagesChange(['test-image-1'])}>Upload Image</button>
    </div>
  ),
}));

describe('PostCard Component', () => {
  const mockNavigate = vi.fn();

  const mockCurrentUser = {
    id: 1,
    username: 'testuser',
    profile: {
      profile_picture: 'https://example.com/user.jpg',
    },
  };

  const mockPost = {
    id: 1,
    author: 2,
    author_username: 'postauthor',
    author_profile_picture: 'https://example.com/author.jpg',
    content: 'This is a test post content',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
    comments: [],
    comments_count: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const renderPostCard = (props = {}) => {
    return render(
      <BrowserRouter>
        <PostCard
          post={mockPost}
          currentUser={mockCurrentUser}
          {...props}
        />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    test('renders post card with basic content', () => {
      renderPostCard();

      expect(screen.getByText('postauthor')).toBeInTheDocument();
      expect(screen.getByText('This is a test post content')).toBeInTheDocument();
    });

    test('renders author avatar with profile picture', () => {
      renderPostCard();

      const avatar = screen.getAllByRole('img')[0];
      expect(avatar).toHaveAttribute('src', 'https://example.com/author.jpg');
    });

    test('renders unknown user when author_username is missing', () => {
      const postWithoutUsername = {
        ...mockPost,
        author_username: null,
      };

      renderPostCard({ post: postWithoutUsername });

      expect(screen.getByText('Unknown User')).toBeInTheDocument();
    });

    test('renders comment button', () => {
      renderPostCard();

      expect(screen.getByText('Comment')).toBeInTheDocument();
    });

    test('does not render menu button when user is not owner', () => {
      renderPostCard({ isOwner: false });

      const moreVertButton = screen.queryByTestId('MoreVertIcon');
      expect(moreVertButton).not.toBeInTheDocument();
    });

    test('renders menu button when user is owner', () => {
      renderPostCard({ isOwner: true });

      const menuButton = screen.getByRole('button', { name: '' });
      expect(menuButton).toBeInTheDocument();
    });
  });

  describe('Images', () => {
    test('renders image gallery when post has images', () => {
      const postWithImages = {
        ...mockPost,
        images: ['image1.jpg', 'image2.jpg'],
      };

      renderPostCard({ post: postWithImages });

      expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-1')).toBeInTheDocument();
    });

    test('does not render image gallery when post has no images', () => {
      renderPostCard();

      expect(screen.queryByTestId('image-gallery')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates to author profile when clicking avatar', () => {
      renderPostCard();

      const avatar = screen.getAllByRole('img')[0];
      fireEvent.click(avatar);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/2');
    });

    test('navigates to author profile when clicking username', () => {
      renderPostCard();

      const username = screen.getByText('postauthor');
      fireEvent.click(username);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/2');
    });

    test('does not navigate when author is missing', () => {
      const postWithoutAuthor = {
        ...mockPost,
        author: null,
      };

      renderPostCard({ post: postWithoutAuthor });

      const username = screen.getByText('postauthor');
      fireEvent.click(username);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Comments', () => {
    test('toggles comments section when clicking comment button', () => {
      renderPostCard();

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
    });

    test('hides comments section when clicking comment button again', () => {
      renderPostCard();

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);
      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();

      fireEvent.click(commentButton);
      expect(screen.queryByPlaceholderText('Write a comment...')).not.toBeInTheDocument();
    });

    test('renders existing comments when present', () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          {
            id: 1,
            author: 3,
            author_username: 'commenter1',
            author_profile_picture: 'https://example.com/commenter1.jpg',
            content: 'This is a comment',
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            author: 4,
            author_username: 'commenter2',
            author_profile_picture: null,
            content: 'Another comment',
            created_at: new Date().toISOString(),
          },
        ],
        comments_count: 2,
      };

      renderPostCard({ post: postWithComments });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      expect(screen.getByText('This is a comment')).toBeInTheDocument();
      expect(screen.getByText('Another comment')).toBeInTheDocument();
      expect(screen.getByText('commenter1')).toBeInTheDocument();
      expect(screen.getByText('commenter2')).toBeInTheDocument();
    });

    test('renders show comments button when post has comments', () => {
      const postWithComments = {
        ...mockPost,
        comments: [
          {
            id: 1,
            author: 3,
            author_username: 'commenter1',
            content: 'Comment',
            created_at: new Date().toISOString(),
          },
        ],
        comments_count: 1,
      };

      renderPostCard({ post: postWithComments });

      expect(screen.getByText('Show 1 comment')).toBeInTheDocument();
    });

    test('toggles between show and hide comments text', () => {
      const postWithComments = {
        ...mockPost,
        comments: [{
          id: 1,
          author: 3,
          author_username: 'commenter1',
          content: 'Comment',
          created_at: new Date().toISOString(),
        }],
        comments_count: 1,
      };

      renderPostCard({ post: postWithComments });

      const toggleButton = screen.getByText('Show 1 comment');
      fireEvent.click(toggleButton);

      expect(screen.getByText('Hide comments')).toBeInTheDocument();
    });

    test('renders comment images when present', () => {
      const postWithCommentImages = {
        ...mockPost,
        comments: [{
          id: 1,
          author: 3,
          author_username: 'commenter1',
          content: 'Comment with images',
          images: ['comment-image1.jpg', 'comment-image2.jpg'],
          created_at: new Date().toISOString(),
        }],
        comments_count: 1,
      };

      renderPostCard({ post: postWithCommentImages });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const imageGalleries = screen.getAllByTestId('image-gallery');
      expect(imageGalleries.length).toBeGreaterThan(0);
    });
  });

  describe('Comment Creation', () => {
    test('enables post button when comment text is entered', () => {
      renderPostCard({ onComment: vi.fn() });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const textField = screen.getByPlaceholderText('Write a comment...');
      const postButton = screen.getByRole('button', { name: 'Post' });

      expect(postButton).toBeDisabled();

      fireEvent.change(textField, { target: { value: 'New comment' } });

      expect(postButton).not.toBeDisabled();
    });

    test('calls onComment when submitting a comment', () => {
      const mockOnComment = vi.fn();
      renderPostCard({ onComment: mockOnComment });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const textField = screen.getByPlaceholderText('Write a comment...');
      fireEvent.change(textField, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      expect(mockOnComment).toHaveBeenCalledWith(1, {
        content: 'New comment',
        images: [],
      });
    });

    test('clears comment text after submission', () => {
      const mockOnComment = vi.fn();
      renderPostCard({ onComment: mockOnComment });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const textField = screen.getByPlaceholderText('Write a comment...');
      fireEvent.change(textField, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      expect(textField.value).toBe('');
    });

    test('does not submit comment when text is only whitespace', () => {
      const mockOnComment = vi.fn();
      renderPostCard({ onComment: mockOnComment });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const textField = screen.getByPlaceholderText('Write a comment...');
      fireEvent.change(textField, { target: { value: '   ' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).toBeDisabled();
    });

    test('renders inline image upload for comments', () => {
      renderPostCard();

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      expect(screen.getByTestId('inline-image-upload')).toBeInTheDocument();
    });

    test('enables post button when images are added without text', () => {
      renderPostCard({ onComment: vi.fn() });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const uploadButton = screen.getByText('Upload Image');
      fireEvent.click(uploadButton);

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).not.toBeDisabled();
    });
  });

  describe('Comment Navigation', () => {
    test('navigates to comment author profile when clicking avatar', () => {
      const postWithComments = {
        ...mockPost,
        comments: [{
          id: 1,
          author: 3,
          author_username: 'commenter1',
          author_profile_picture: 'https://example.com/commenter1.jpg',
          content: 'Comment',
          created_at: new Date().toISOString(),
        }],
        comments_count: 1,
      };

      renderPostCard({ post: postWithComments });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const avatars = screen.getAllByRole('img');
      const commentAvatar = avatars[avatars.length - 1]; // Last avatar is the comment's
      fireEvent.click(commentAvatar);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/3');
    });

    test('navigates to comment author profile when clicking username', () => {
      const postWithComments = {
        ...mockPost,
        comments: [{
          id: 1,
          author: 3,
          author_username: 'commenter1',
          content: 'Comment',
          created_at: new Date().toISOString(),
        }],
        comments_count: 1,
      };

      renderPostCard({ post: postWithComments });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const commenterUsername = screen.getByText('commenter1');
      fireEvent.click(commenterUsername);

      expect(mockNavigate).toHaveBeenCalledWith('/profile/3');
    });
  });

  describe('Post Menu', () => {
    test('opens menu when clicking menu button', () => {
      renderPostCard({ isOwner: true });

      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      expect(screen.getByText('Edit Post')).toBeInTheDocument();
      expect(screen.getByText('Delete Post')).toBeInTheDocument();
    });

    test('calls onEdit when clicking edit menu item', () => {
      const mockOnEdit = vi.fn();
      renderPostCard({ isOwner: true, onEdit: mockOnEdit });

      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      const editMenuItem = screen.getByText('Edit Post');
      fireEvent.click(editMenuItem);

      expect(mockOnEdit).toHaveBeenCalledWith(mockPost);
    });

    test('calls onDelete when clicking delete menu item', () => {
      const mockOnDelete = vi.fn();
      renderPostCard({ isOwner: true, onDelete: mockOnDelete });

      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      const deleteMenuItem = screen.getByText('Delete Post');
      fireEvent.click(deleteMenuItem);

      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('Current User Avatar', () => {
    test('renders current user avatar in comment input', () => {
      renderPostCard();

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const avatars = screen.getAllByRole('img');
      const currentUserAvatar = avatars.find(
        avatar => avatar.getAttribute('src') === 'https://example.com/user.jpg'
      );
      expect(currentUserAvatar).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing onComment callback gracefully', () => {
      renderPostCard({ onComment: null });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      const textField = screen.getByPlaceholderText('Write a comment...');
      fireEvent.change(textField, { target: { value: 'New comment' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      
      expect(() => fireEvent.click(postButton)).not.toThrow();
    });

    test('handles missing onEdit callback gracefully', () => {
      renderPostCard({ isOwner: true, onEdit: null });

      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      const editMenuItem = screen.getByText('Edit Post');
      
      expect(() => fireEvent.click(editMenuItem)).not.toThrow();
    });

    test('handles missing onDelete callback gracefully', () => {
      renderPostCard({ isOwner: true, onDelete: null });

      const menuButton = screen.getByRole('button', { name: '' });
      fireEvent.click(menuButton);

      const deleteMenuItem = screen.getByText('Delete Post');
      
      expect(() => fireEvent.click(deleteMenuItem)).not.toThrow();
    });

    test('handles undefined currentUser gracefully', () => {
      renderPostCard({ currentUser: undefined });

      const commentButton = screen.getByText('Comment');
      fireEvent.click(commentButton);

      expect(screen.getByPlaceholderText('Write a comment...')).toBeInTheDocument();
    });
  });
});
