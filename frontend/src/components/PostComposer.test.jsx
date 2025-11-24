import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PostComposer from './PostComposer';

// Mock InlineImageUpload component
vi.mock('./InlineImageUpload', () => ({
  default: ({ onImagesChange, compact, initialImages }) => (
    <div data-testid={compact ? 'inline-image-upload-compact' : 'inline-image-upload-full'}>
      <button onClick={() => onImagesChange(['test-image-1.jpg'])}>
        Add Image
      </button>
      {initialImages && initialImages.length > 0 && (
        <div data-testid="image-preview-count">{initialImages.length}</div>
      )}
    </div>
  ),
}));

describe('PostComposer Component', () => {
  const mockCurrentUser = {
    id: 1,
    username: 'testuser',
    profile: {
      profile_picture: 'https://example.com/user.jpg',
    },
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPostComposer = (props = {}) => {
    return render(
      <PostComposer
        currentUser={mockCurrentUser}
        onSubmit={mockOnSubmit}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    test('renders post composer with user avatar', () => {
      renderPostComposer();

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', 'https://example.com/user.jpg');
    });

    test('renders default placeholder text', () => {
      renderPostComposer();

      expect(screen.getByPlaceholderText("What's on your mind?")).toBeInTheDocument();
    });

    test('renders custom placeholder text when provided', () => {
      renderPostComposer({ placeholder: 'Share your thoughts...' });

      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument();
    });

    test('renders post button', () => {
      renderPostComposer();

      expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
    });

    test('renders compact image upload component', () => {
      renderPostComposer();

      expect(screen.getByTestId('inline-image-upload-compact')).toBeInTheDocument();
    });

    test('post button is initially disabled', () => {
      renderPostComposer();

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).toBeDisabled();
    });
  });

  describe('Text Input', () => {
    test('updates text when typing', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post content' } });

      expect(textField.value).toBe('Test post content');
    });

    test('enables post button when text is entered', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      const postButton = screen.getByRole('button', { name: 'Post' });

      expect(postButton).toBeDisabled();

      fireEvent.change(textField, { target: { value: 'Test post' } });

      expect(postButton).not.toBeDisabled();
    });

    test('keeps post button disabled when only whitespace is entered', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      const postButton = screen.getByRole('button', { name: 'Post' });

      fireEvent.change(textField, { target: { value: '   ' } });

      expect(postButton).toBeDisabled();
    });
  });

  describe('Image Upload', () => {
    test('enables post button when images are added without text', () => {
      renderPostComposer();

      const addImageButton = screen.getByText('Add Image');
      const postButton = screen.getByRole('button', { name: 'Post' });

      expect(postButton).toBeDisabled();

      fireEvent.click(addImageButton);

      expect(postButton).not.toBeDisabled();
    });

    test('displays full image upload component when images are present', () => {
      renderPostComposer();

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      expect(screen.getByTestId('inline-image-upload-full')).toBeInTheDocument();
    });
  });

  describe('Post Submission', () => {
    test('calls onSubmit with text content', async () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'New post content' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'New post content',
          images: [],
        });
      });
    });

    test('calls onSubmit with images only', async () => {
      renderPostComposer();

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: '',
          images: ['test-image-1.jpg'],
        });
      });
    });

    test('calls onSubmit with both text and images', async () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Post with image' } });

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          content: 'Post with image',
          images: ['test-image-1.jpg'],
        });
      });
    });

    test('clears text after successful submission', async () => {
      mockOnSubmit.mockResolvedValue();
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(textField.value).toBe('');
      });
    });

    test('shows posting indicator while submitting', async () => {
      mockOnSubmit.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      expect(screen.getByRole('button', { name: 'Posting...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Posting...' })).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument();
      });
    });

    test('does not submit when text is only whitespace', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: '   ' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      
      // Button should be disabled
      expect(postButton).toBeDisabled();
      
      fireEvent.click(postButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('handles submission error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
      
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error submitting post:',
          expect.any(Error)
        );
      });

      // Button should be re-enabled after error
      expect(screen.getByRole('button', { name: 'Post' })).not.toBeDisabled();
      
      consoleErrorSpy.mockRestore();
    });

    test('does not clear content on submission error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error('Submission failed'));
      
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Content should still be there after error
      expect(textField.value).toBe('Test post');
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    test('handles currentUser without profile', () => {
      const userWithoutProfile = {
        id: 1,
        username: 'testuser',
      };

      renderPostComposer({ currentUser: userWithoutProfile });

      const avatar = screen.getByRole('img');
      expect(avatar).toHaveAttribute('src', '/default-avatar.png');
    });

    test('handles missing onSubmit callback', async () => {
      renderPostComposer({ onSubmit: undefined });

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      
      // Should not throw error when clicking
      expect(() => fireEvent.click(postButton)).not.toThrow();
    });
  });

  describe('Component State', () => {
    test('collapses after successful submission', async () => {
      mockOnSubmit.mockResolvedValue();
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      
      // Expand by focusing
      fireEvent.focus(textField);
      fireEvent.change(textField, { target: { value: 'Test post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      fireEvent.click(postButton);

      await waitFor(() => {
        expect(textField.value).toBe('');
      });

      // After submission, the text field should still be accessible
      expect(textField).toBeInTheDocument();
    });

    test('maintains state between text changes', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      
      fireEvent.change(textField, { target: { value: 'First' } });
      expect(textField.value).toBe('First');

      fireEvent.change(textField, { target: { value: 'First Second' } });
      expect(textField.value).toBe('First Second');

      fireEvent.change(textField, { target: { value: 'First Second Third' } });
      expect(textField.value).toBe('First Second Third');
    });

    test('allows text change after adding images', () => {
      renderPostComposer();

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Caption for image' } });

      expect(textField.value).toBe('Caption for image');
    });
  });

  describe('Button States', () => {
    test('post button is disabled with empty content and no images', () => {
      renderPostComposer();

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).toBeDisabled();
    });

    test('post button is enabled with valid text', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Valid post' } });

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).not.toBeDisabled();
    });

    test('post button is enabled with images only', () => {
      renderPostComposer();

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).not.toBeDisabled();
    });

    test('post button is enabled with both text and images', () => {
      renderPostComposer();

      const textField = screen.getByPlaceholderText("What's on your mind?");
      fireEvent.change(textField, { target: { value: 'Post content' } });

      const addImageButton = screen.getByText('Add Image');
      fireEvent.click(addImageButton);

      const postButton = screen.getByRole('button', { name: 'Post' });
      expect(postButton).not.toBeDisabled();
    });
  });
});
