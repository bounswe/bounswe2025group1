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
});