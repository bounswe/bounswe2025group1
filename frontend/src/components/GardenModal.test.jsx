import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import GardenModal from './GardenModal';
import { useTranslation } from 'react-i18next';
import * as keyboardNavigation from '../utils/keyboardNavigation';

// Mock the modules/hooks
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../utils/keyboardNavigation', () => ({
  createFormKeyboardHandler: vi.fn(() => vi.fn()),
  createButtonKeyboardHandler: vi.fn(() => vi.fn()),
  trapFocus: vi.fn(() => vi.fn()),
}));

vi.mock('./LocationPicker', () => ({
  default: ({ value, onChange, label, required }) => (
    <div data-testid="location-picker">
      <label>{label}{required && ' *'}</label>
      <input
        data-testid="location-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Select location"
      />
    </div>
  ),
}));

vi.mock('./ImageUpload', () => ({
  default: ({ label, maxImages, onImagesChange, initialImages }) => (
    <div data-testid={`image-upload-${label}`}>
      <label>{label}</label>
      <input
        type="file"
        data-testid={`image-input-${label}`}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          const images = files.map((file, idx) => `data:image/png;base64,test${idx}`);
          onImagesChange(images);
        }}
        multiple={maxImages > 1}
      />
      <div data-testid="initial-images">
        {initialImages?.length || 0} images
      </div>
    </div>
  ),
}));

describe('GardenModal Component', () => {
  const mockT = vi.fn((key) => key);
  const mockOnClose = vi.fn();
  const mockHandleChange = vi.fn();
  const mockHandleTogglePublic = vi.fn();
  const mockHandleSubmit = vi.fn();
  const mockHandleDelete = vi.fn();

  const defaultForm = {
    name: '',
    description: '',
    location: '',
    isPublic: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
  });

  describe('Rendering', () => {
    test('renders modal when open is true', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith('gardens.createGarden');
    });

    test('does not render modal when open is false', () => {
      render(
        <GardenModal
          open={false}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders create mode title', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(mockT).toHaveBeenCalledWith('gardens.createGarden');
    });

    test('renders edit mode title', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
        />
      );

      expect(mockT).toHaveBeenCalledWith('gardens.editGarden');
    });

    test('renders all form fields', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(mockT).toHaveBeenCalledWith('gardens.gardenName');
      expect(mockT).toHaveBeenCalledWith('gardens.description');
      expect(mockT).toHaveBeenCalledWith('gardens.gardenLocation');
      expect(mockT).toHaveBeenCalledWith('gardens.makeGardenPublic');
    });

    test('renders delete button in edit mode', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          handleDelete={mockHandleDelete}
          mode="edit"
        />
      );

      expect(mockT).toHaveBeenCalledWith('gardens.deleteGarden');
    });

    test('does not render delete button in create mode', () => {
      mockT.mockImplementation((key) => {
        if (key === 'gardens.deleteGarden') return 'Delete Garden';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(screen.queryByText('Delete Garden')).not.toBeInTheDocument();
    });

    test('renders LocationPicker component', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    });

    test('renders image upload components', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(mockT).toHaveBeenCalledWith('gardens.coverImage');
      expect(mockT).toHaveBeenCalledWith('gardens.galleryImages');
    });
  });

  describe('Form Interaction', () => {
    test('name field displays form value', () => {
      const formWithName = { ...defaultForm, name: 'My Garden' };
      
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={formWithName}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const nameInput = screen.getByDisplayValue('My Garden');
      expect(nameInput).toBeInTheDocument();
    });

    test('description field displays form value', () => {
      const formWithDescription = { ...defaultForm, description: 'Test description' };
      
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={formWithDescription}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const descriptionInput = screen.getByDisplayValue('Test description');
      expect(descriptionInput).toBeInTheDocument();
    });

    test('calls handleChange when name field changes', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const nameInput = screen.getAllByRole('textbox')[0];
      fireEvent.change(nameInput, { target: { name: 'name', value: 'New Garden' } });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    test('calls handleChange when description field changes', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const descriptionInput = screen.getAllByRole('textbox')[1];
      fireEvent.change(descriptionInput, { target: { name: 'description', value: 'New description' } });

      expect(mockHandleChange).toHaveBeenCalled();
    });

    test('calls handleTogglePublic when switch is toggled', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const switchInput = screen.getByRole('switch');
      fireEvent.click(switchInput);

      expect(mockHandleTogglePublic).toHaveBeenCalled();
    });

    test('switch reflects isPublic state', () => {
      const formWithPublic = { ...defaultForm, isPublic: true };
      
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={formWithPublic}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const switchInput = screen.getByRole('switch');
      expect(switchInput).toBeChecked();
    });

    test('location picker receives correct value', () => {
      const formWithLocation = { ...defaultForm, location: 'Istanbul, Turkey' };
      
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={formWithLocation}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const locationInput = screen.getByTestId('location-input');
      expect(locationInput).toHaveValue('Istanbul, Turkey');
    });

    test('location change calls handleChange with correct structure', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const locationInput = screen.getByTestId('location-input');
      fireEvent.change(locationInput, { target: { value: 'Ankara, Turkey' } });

      expect(mockHandleChange).toHaveBeenCalledWith({
        target: { name: 'location', value: 'Ankara, Turkey' },
      });
    });
  });

  describe('Form Submission', () => {
    test('submits form data with form values', async () => {
      const formData = { ...defaultForm, name: 'Test Garden', description: 'Test Description' };
      
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={formData}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: /gardens.createGarden/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHandleSubmit).toHaveBeenCalled();
        const callArgs = mockHandleSubmit.mock.calls[0];
        expect(callArgs[1]).toMatchObject({
          name: 'Test Garden',
          description: 'Test Description',
        });
      });
    });
  });

  describe('Button Actions', () => {
    test('calls onClose when cancel button is clicked', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.cancel') return 'Cancel';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('calls handleDelete when delete button is clicked in edit mode', () => {
      mockT.mockImplementation((key) => {
        if (key === 'gardens.deleteGarden') return 'Delete Garden';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          handleDelete={mockHandleDelete}
          mode="edit"
        />
      );

      const deleteButton = screen.getByText('Delete Garden');
      fireEvent.click(deleteButton);

      expect(mockHandleDelete).toHaveBeenCalled();
    });

    test('submit button shows create text in create mode', () => {
      mockT.mockImplementation((key) => {
        if (key === 'gardens.createGarden') return 'Create Garden';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const submitButton = screen.getByRole('button', { name: 'Create Garden' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('submit button shows save text in edit mode', () => {
      mockT.mockImplementation((key) => {
        if (key === 'gardens.saveChanges') return 'Save Changes';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
        />
      );

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('Existing Images', () => {
    test('initializes cover image from existingImages', async () => {
      const existingImages = {
        cover_image: {
          image_base64: 'data:image/png;base64,existingCover',
        },
        images: [],
      };

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
          existingImages={existingImages}
        />
      );

      await waitFor(() => {
        const initialImagesDisplay = screen.getAllByTestId('initial-images')[0];
        expect(initialImagesDisplay.textContent).toBe('1 images');
      });
    });

    test('initializes gallery images from existingImages', async () => {
      const existingImages = {
        cover_image: null,
        images: [
          { image_base64: 'data:image/png;base64,img1', is_cover: false },
          { image_base64: 'data:image/png;base64,img2', is_cover: false },
        ],
      };

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
          existingImages={existingImages}
        />
      );

      await waitFor(() => {
        const initialImagesDisplay = screen.getAllByTestId('initial-images')[1];
        expect(initialImagesDisplay.textContent).toBe('2 images');
      });
    });

    test('filters out cover image from gallery images', async () => {
      const existingImages = {
        cover_image: {
          image_base64: 'data:image/png;base64,cover',
        },
        images: [
          { image_base64: 'data:image/png;base64,cover', is_cover: true },
          { image_base64: 'data:image/png;base64,img1', is_cover: false },
          { image_base64: 'data:image/png;base64,img2', is_cover: false },
        ],
      };

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
          existingImages={existingImages}
        />
      );

      await waitFor(() => {
        const galleryImagesDisplay = screen.getAllByTestId('initial-images')[1];
        expect(galleryImagesDisplay.textContent).toBe('2 images');
      });
    });

    test('clears images in create mode', async () => {
      const { rerender } = render(
        <GardenModal
          open={false}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      rerender(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      await waitFor(() => {
        const initialImagesDisplays = screen.getAllByTestId('initial-images');
        expect(initialImagesDisplays[0].textContent).toBe('0 images');
        expect(initialImagesDisplays[1].textContent).toBe('0 images');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('sets up keyboard handler for form', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(keyboardNavigation.createFormKeyboardHandler).toHaveBeenCalledWith(
        expect.any(Function),
        mockOnClose
      );
    });

    test('creates button keyboard handlers', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.cancel') return 'Cancel';
        return key;
      });

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      expect(keyboardNavigation.createButtonKeyboardHandler).toHaveBeenCalled();
    });
  });

  describe('Modal Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'garden-modal-title');
    });

    test('title has correct id for aria-labelledby', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const title = screen.getByRole('dialog').querySelector('#garden-modal-title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Modal Lifecycle', () => {
    test('resets images when modal closes', async () => {
      const { rerender } = render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      // Add an image
      const coverImageInput = screen.getByTestId('image-input-gardens.coverImage');
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(coverImageInput, { target: { files: [file] } });

      // Close modal
      const cancelButton = screen.getAllByRole('button')[0];
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();

      // Reopen modal
      rerender(
        <GardenModal
          open={false}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      rerender(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      // Images should be reset
      await waitFor(() => {
        const initialImagesDisplays = screen.getAllByTestId('initial-images');
        expect(initialImagesDisplays[0].textContent).toBe('0 images');
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles null existingImages', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
          existingImages={null}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    test('handles empty existingImages object', async () => {
      const existingImages = {
        cover_image: null,
        images: [],
      };

      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
          existingImages={existingImages}
        />
      );

      await waitFor(() => {
        const initialImagesDisplays = screen.getAllByTestId('initial-images');
        expect(initialImagesDisplays[0].textContent).toBe('0 images');
        expect(initialImagesDisplays[1].textContent).toBe('0 images');
      });
    });

    test('handles form with all empty fields', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="create"
        />
      );

      const nameInput = screen.getAllByRole('textbox')[0];
      const descriptionInput = screen.getAllByRole('textbox')[1];
      
      expect(nameInput).toHaveValue('');
      expect(descriptionInput).toHaveValue('');
    });

    test('handles missing handleDelete prop', () => {
      render(
        <GardenModal
          open={true}
          onClose={mockOnClose}
          form={defaultForm}
          handleChange={mockHandleChange}
          handleTogglePublic={mockHandleTogglePublic}
          handleSubmit={mockHandleSubmit}
          mode="edit"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});
