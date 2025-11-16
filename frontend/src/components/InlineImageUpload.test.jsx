import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import InlineImageUpload from './InlineImageUpload';
import { useTranslation } from 'react-i18next';

// Mock the modules/hooks
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('InlineImageUpload Component', () => {
  const mockOnImagesChange = vi.fn();
  const mockT = vi.fn((key) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
    
    // Mock FileReader
    globalThis.FileReader = vi.fn(() => ({
      readAsDataURL: vi.fn(function() {
        this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
      }),
      result: 'data:image/png;base64,mockBase64',
    }));
  });

  describe('Rendering', () => {
    test('renders upload button in normal mode', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('renders compact mode correctly', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} compact={true} />);

      const iconButton = screen.getByRole('button');
      expect(iconButton).toBeInTheDocument();
    });

    test('displays file input (hidden)', () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveStyle({ display: 'none' });
    });

    test('accepts correct file types', () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/gif,image/webp');
    });

    test('allows multiple file selection', () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('multiple');
    });

    test('displays image count in normal mode', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(mockT).toHaveBeenCalledWith(expect.stringContaining('imageUpload'));
    });

    test('displays image count in compact mode', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          compact={true}
        />
      );

      expect(screen.getByText(/1/)).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    test('respects maxImages prop', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} maxImages={5} />);

      expect(mockT).toHaveBeenCalled();
    });

    test('respects maxSizeMB prop', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} maxSizeMB={10} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('respects acceptedTypes prop', () => {
      const customTypes = ['image/jpeg', 'image/png'];
      const { container } = render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          acceptedTypes={customTypes}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', customTypes.join(','));
    });

    test('respects disabled prop', () => {
      const { container } = render(
        <InlineImageUpload onImagesChange={mockOnImagesChange} disabled={true} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeDisabled();
    });

    test('disables button when disabled prop is true', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Initial Images', () => {
    test('renders initial images', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,test2', name: 'test2.png', size: 200, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('test1.png')).toBeInTheDocument();
      expect(screen.getByText('test2.png')).toBeInTheDocument();
    });

    test('handles empty initial images array', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} initialImages={[]} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('updates when initialImages prop changes', () => {
      const { rerender } = render(
        <InlineImageUpload onImagesChange={mockOnImagesChange} initialImages={[]} />
      );

      const newImages = [
        { base64: 'data:image/png;base64,new', name: 'new.png', size: 100, type: 'image/png' },
      ];

      rerender(
        <InlineImageUpload onImagesChange={mockOnImagesChange} initialImages={newImages} />
      );

      expect(screen.getByText('new.png')).toBeInTheDocument();
    });
  });

  describe('File Upload Button', () => {
    test('clicking button triggers file input click', () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    test('compact mode button triggers file input click', () => {
      const { container } = render(
        <InlineImageUpload onImagesChange={mockOnImagesChange} compact={true} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput, 'click');

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Image Removal', () => {
    test('renders delete button for each image', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,test2', name: 'test2.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg[data-testid="DeleteIcon"]')
      );
      
      expect(deleteButtons.length).toBe(2);
    });

    test('removing image calls onImagesChange with updated array', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,test2', name: 'test2.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButtons = screen.getAllByRole('button').filter(btn => 
        btn.querySelector('svg[data-testid="DeleteIcon"]')
      );
      
      fireEvent.click(deleteButtons[0]);

      expect(mockOnImagesChange).toHaveBeenCalledWith(['data:image/png;base64,test2']);
    });

    test('removing last image calls onImagesChange with empty array', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const deleteButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('svg[data-testid="DeleteIcon"]')
      );
      
      fireEvent.click(deleteButton);

      expect(mockOnImagesChange).toHaveBeenCalledWith([]);
    });
  });

  describe('File Selection and Upload', () => {
    test('handles valid file selection', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    test('handles multiple file selection', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file1 = new File(['test1'], 'test1.png', { type: 'image/png' });
      const file2 = new File(['test2'], 'test2.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file1, file2],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining('data:image/png;base64'),
            expect.stringContaining('data:image/png;base64'),
          ])
        );
      });
    });

    test('resets file input after successful upload', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });

    test('handles empty file selection', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');

      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnImagesChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('File Validation', () => {
    test('shows error for invalid file type', async () => {
      mockT.mockImplementation((key, params) => {
        if (key === 'imageUpload.fileTypeError') {
          return `File type error: ${params?.types}`;
        }
        return key;
      });

      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    test('shows error for file exceeding size limit', async () => {
      mockT.mockImplementation((key, params) => {
        if (key === 'imageUpload.fileSizeError') {
          return `File size exceeds ${params?.size}MB`;
        }
        return key;
      });

      const { container } = render(
        <InlineImageUpload onImagesChange={mockOnImagesChange} maxSizeMB={1} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const file = new File([largeContent], 'large.png', { type: 'image/png' });

      Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    test('shows error when exceeding max images', async () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,test2', name: 'test2.png', size: 100, type: 'image/png' },
      ];

      const { container } = render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          maxImages={2}
        />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test3.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    test('clears error on successful upload after previous error', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      
      // First, trigger an error
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(fileInput, 'files', {
        value: [invalidFile],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Then, upload a valid file
      const validFile = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    test('shows loading indicator during upload', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      // Mock FileReader to delay the loading
      globalThis.FileReader = vi.fn(() => ({
        readAsDataURL: vi.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
          }, 100);
        }),
      }));

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Check for loading indicator
      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    test('disables input during upload', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      // Mock FileReader to delay the loading
      globalThis.FileReader = vi.fn(() => ({
        readAsDataURL: vi.fn(function() {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/png;base64,mockBase64' } });
          }, 100);
        }),
      }));

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(fileInput).toBeDisabled();

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('Image Preview', () => {
    test('displays image preview in grid', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
      ];
      
      const { container } = render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });

    test('displays image names', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test-image.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
        />
      );

      expect(screen.getByText('test-image.png')).toBeInTheDocument();
    });

    test('does not display grid when no images', () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    test('renders icon button in compact mode', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} compact={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    test('shows image count text in compact mode', () => {
      const initialImages = [
        { base64: 'data:image/png;base64,test1', name: 'test1.png', size: 100, type: 'image/png' },
        { base64: 'data:image/png;base64,test2', name: 'test2.png', size: 100, type: 'image/png' },
      ];
      
      render(
        <InlineImageUpload
          onImagesChange={mockOnImagesChange}
          initialImages={initialImages}
          compact={true}
        />
      );

      expect(screen.getByText(/2/)).toBeInTheDocument();
    });

    test('does not show image count when no images in compact mode', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} compact={true} />);

      // Only the button should be present
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });

    test('shows error in compact mode', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'imageUpload.fileTypeError') {
          return 'File type error';
        }
        return key;
      });

      const { container } = render(
        <InlineImageUpload onImagesChange={mockOnImagesChange} compact={true} />
      );

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles file with no name', async () => {
      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], '', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnImagesChange).toHaveBeenCalled();
      });
    });

    test('handles FileReader error', async () => {
      globalThis.FileReader = vi.fn(() => ({
        readAsDataURL: vi.fn(function() {
          this.onerror(new Error('FileReader error'));
        }),
      }));

      const { container } = render(<InlineImageUpload onImagesChange={mockOnImagesChange} />);

      const fileInput = container.querySelector('input[type="file"]');
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    test('handles maxImages of 1', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} maxImages={1} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('handles very large maxImages value', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} maxImages={100} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('handles zero maxSizeMB', () => {
      render(<InlineImageUpload onImagesChange={mockOnImagesChange} maxSizeMB={0} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
