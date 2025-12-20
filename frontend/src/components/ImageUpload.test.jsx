import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ImageUpload from './ImageUpload';

describe('ImageUpload Component', () => {
  const mockOnImagesChange = vi.fn();
  const mockOnCoverImageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.FileReader = class FileReader {
      readAsDataURL() {
        this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
      }
    };
  });

  describe('Rendering', () => {
    test('renders with default label', () => {
      render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      expect(screen.getByText('Upload Images')).toBeInTheDocument();
    });

    test('renders with custom label', () => {
      render(<ImageUpload label="Upload Photos" onImagesChange={mockOnImagesChange} />);

      expect(screen.getByText('Upload Photos')).toBeInTheDocument();
    });

    test('renders upload button', () => {
      render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      expect(screen.getByRole('button', { name: /upload images/i })).toBeInTheDocument();
    });

    test('renders accepted file types in helper text', () => {
      render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      expect(screen.getByText(/jpeg/i)).toBeInTheDocument();
      expect(screen.getByText(/png/i)).toBeInTheDocument();
    });

    test('does not show error alert by default', () => {
      render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('File Input', () => {
    test('file input is hidden', () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    test('file input accepts specified types', () => {
      const { container } = render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          acceptedTypes={['image/jpeg', 'image/png']}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png');
    });

    test('file input allows multiple files', () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
    });

    test('clicking upload button opens file dialog', () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.fn();
      fileInput.click = clickSpy;

      const uploadButton = screen.getByRole('button', { name: /upload images/i });
      fireEvent.click(uploadButton);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('File Upload', () => {
    test('uploads single image successfully', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    test('displays uploaded image preview', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['image'], 'test-image.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('test-image.png')).toBeInTheDocument();
      });
    });

    test('displays file size for uploaded images', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['x'.repeat(1024)], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/kb/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Validation', () => {
    test('shows error when exceeding max images limit', async () => {
      const { container } = render(
        <ImageUpload onImagesChange={mockOnImagesChange} maxImages={2} />
      );

      const files = [
        new File(['1'], '1.png', { type: 'image/png' }),
        new File(['2'], '2.png', { type: 'image/png' }),
        new File(['3'], '3.png', { type: 'image/png' }),
      ];
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files } });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/maximum.*images allowed/i)).toBeInTheDocument();
      });
    });

    test('accepts valid file types', async () => {
      const { container } = render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          acceptedTypes={['image/jpeg']}
        />
      );

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Removal', () => {
    test('removes image when delete button is clicked', async () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButton = screen.getByRole('button', { name: '' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith([]);
      });
    });

    test('removes correct image from multiple images', async () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('image1.png')).toBeInTheDocument();
      expect(screen.getByText('image2.png')).toBeInTheDocument();

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('image1.png')).not.toBeInTheDocument();
        expect(screen.getByText('image2.png')).toBeInTheDocument();
      });
    });

    test('calls onImagesChange with updated array after removal', async () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButtons = screen.getAllByRole('button', { name: '' });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(['data:image/png;base64,img2']);
      });
    });
  });

  describe('Cover Image', () => {
    test('displays cover badge on cover image', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          showCoverToggle={true}
          coverImageIndex={0}
        />
      );

      expect(screen.getByText('Cover')).toBeInTheDocument();
    });

    test('does not show cover badge when showCoverToggle is false', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          showCoverToggle={false}
        />
      );

      expect(screen.queryByText('Cover')).not.toBeInTheDocument();
    });

    test('does not show "Set as Cover" on current cover image', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          showCoverToggle={true}
          coverImageIndex={0}
        />
      );

      expect(screen.queryByText('Set as Cover')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    test('disables upload button when disabled prop is true', () => {
      render(<ImageUpload onImagesChange={mockOnImagesChange} disabled={true} />);

      const uploadButton = screen.getByRole('button', { name: /upload images/i });
      expect(uploadButton).toBeDisabled();
    });

    test('disables file input when disabled', () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} disabled={true} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    test('disables delete buttons when disabled', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          disabled={true}
        />
      );

      const deleteButton = screen.getByRole('button', { name: '' });
      expect(deleteButton).toBeDisabled();
    });

    test('disables upload when max images reached', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 100, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          maxImages={2}
        />
      );

      const uploadButton = screen.getByRole('button', { name: /upload images/i });
      expect(uploadButton).toBeDisabled();
    });
  });

  describe('Upload Progress', () => {
    test('shows uploading state during upload', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      // Mock FileReader to delay
      window.FileReader = class FileReader {
        readAsDataURL() {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
          }, 10);
        }
      };

      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show uploading immediately
      expect(screen.getByText('Uploading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      });
    });

    test('disables upload button during upload', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      window.FileReader = class FileReader {
        readAsDataURL() {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
          }, 10);
        }
      };

      fireEvent.change(fileInput, { target: { files: [file] } });

      const uploadButton = screen.getByRole('button');
      expect(uploadButton).toBeDisabled();

      await waitFor(() => {
        expect(uploadButton).not.toBeDisabled();
      });
    });
  });

  describe('Initial Images', () => {
    test('displays initial images on mount', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'initial.png', size: 1000, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('initial.png')).toBeInTheDocument();
    });

    test('displays multiple initial images', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 200, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('image1.png')).toBeInTheDocument();
      expect(screen.getByText('image2.png')).toBeInTheDocument();
    });
  });

  describe('File Size Formatting', () => {
    test('formats bytes correctly', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'small.png', size: 500, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('500 Bytes')).toBeInTheDocument();
    });

    test('formats kilobytes correctly', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'medium.png', size: 2048, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText(/2 KB/i)).toBeInTheDocument();
    });

    test('formats megabytes correctly', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'large.png', size: 1048576, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText(/1 MB/i)).toBeInTheDocument();
    });

    test('handles zero size', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'empty.png', size: 0, type: 'image/png' },
      ];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('0 Bytes')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty file selection', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [] } });

      // Should not call onImagesChange for empty selection
      await waitFor(() => {
        expect(mockOnImagesChange).not.toHaveBeenCalled();
      });
    });

    test('resets file input after upload', async () => {
      const { container } = render(<ImageUpload onImagesChange={mockOnImagesChange} />);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const fileInput = container.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });

    test('handles custom accepted types', () => {
      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          acceptedTypes={['image/webp']}
        />
      );

      expect(screen.getByText(/webp/i)).toBeInTheDocument();
    });

    test('handles image with string format in removal', async () => {
      const initialImages = ['data:image/png;base64,stringImage'];

      render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButton = screen.getByRole('button', { name: '' });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith([]);
      });
    });
  });

  describe('Grid Layout', () => {
    test('displays images in grid layout', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 100, type: 'image/png' },
      ];

      const { container } = render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });

    test('each image is in a grid item', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,img1', name: 'image1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,img2', name: 'image2.png', size: 100, type: 'image/png' },
      ];

      const { container } = render(
        <ImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const gridItems = container.querySelectorAll('.MuiPaper-root');
      expect(gridItems.length).toBe(2);
    });
  });
});
