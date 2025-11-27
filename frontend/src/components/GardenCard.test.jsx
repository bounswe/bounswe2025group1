import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import GardenCard from './GardenCard';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as locationUtils from '../utils/locationUtils';
import { useAuth } from '../contexts/AuthContextUtils';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../utils/locationUtils', () => ({
  translateLocationString: vi.fn((location) => location),
}));

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));
describe('GardenCard Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key) => key);

  const mockGarden = {
    id: 1,
    name: 'Test Garden',
    description: 'This is a test garden description',
    location: 'Istanbul, Turkey',
    image: 'https://example.com/garden.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAuth.mockReturnValue({
      token: 'mock-token',
      user: { id: 1, username: 'testuser' },
    });
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
  });

  describe('Rendering', () => {
    test('renders garden card with default variant', () => {
      render(<GardenCard garden={mockGarden} />);

      expect(screen.getByText('Test Garden')).toBeInTheDocument();
      expect(screen.getByText('This is a test garden description')).toBeInTheDocument();
      expect(screen.getByText('Istanbul, Turkey')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'gardens.viewGarden' })).toBeInTheDocument();
    });

    test('renders garden card with compact variant', () => {
      render(<GardenCard garden={mockGarden} variant="compact" />);

      expect(screen.getByText('Test Garden')).toBeInTheDocument();
      expect(screen.getByText('This is a test garden description')).toBeInTheDocument();
    });

    test('renders garden card with featured variant', () => {
      render(<GardenCard garden={mockGarden} variant="featured" />);

      expect(screen.getByText('Test Garden')).toBeInTheDocument();
      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      expect(button).toBeInTheDocument();
    });

    test('renders garden name correctly', () => {
      render(<GardenCard garden={mockGarden} />);

      const gardenName = screen.getByText('Test Garden');
      expect(gardenName).toBeInTheDocument();
      expect(gardenName.tagName).toBe('H2');
    });

    test('renders location with icon', () => {
      render(<GardenCard garden={mockGarden} />);

      expect(screen.getByText('Istanbul, Turkey')).toBeInTheDocument();
    });
  });

  describe('Description Truncation', () => {
    test('truncates long description in compact variant', () => {
      const longDescriptionGarden = {
        ...mockGarden,
        description: 'This is a very long description that should be truncated when displayed in compact mode because it exceeds the character limit',
      };

      render(<GardenCard garden={longDescriptionGarden} variant="compact" />);

      const description = screen.getByText(/This is a very long description that should be truncated/);
      expect(description.textContent).toHaveLength(63); // 60 chars + "..."
      expect(description.textContent).toContain('...');
    });

    test('does not truncate short description in compact variant', () => {
      const shortDescriptionGarden = {
        ...mockGarden,
        description: 'Short description',
      };

      render(<GardenCard garden={shortDescriptionGarden} variant="compact" />);

      expect(screen.getByText('Short description')).toBeInTheDocument();
    });

    test('shows full description in default variant', () => {
      const longDescriptionGarden = {
        ...mockGarden,
        description: 'This is a very long description that should not be truncated in default mode',
      };

      render(<GardenCard garden={longDescriptionGarden} />);

      expect(screen.getByText('This is a very long description that should not be truncated in default mode')).toBeInTheDocument();
    });
  });

  describe('Image Handling', () => {
    test('displays image from image field', () => {
      render(<GardenCard garden={mockGarden} />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/garden.jpg');
    });

    test('displays image from cover_image.image_base64', () => {
      const gardenWithCoverImage = {
        ...mockGarden,
        cover_image: {
          image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANS',
        },
        image: undefined,
      };

      render(<GardenCard garden={gardenWithCoverImage} />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toHaveAttribute('src', 'data:image/png;base64,iVBORw0KGgoAAAANS');
    });

    test('displays fallback image when no image provided', () => {
      const gardenWithoutImage = {
        ...mockGarden,
        image: undefined,
      };

      render(<GardenCard garden={gardenWithoutImage} />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toHaveAttribute('src', '/gardens/garden1.png');
    });

    test('uses correct fallback image based on garden id', () => {
      const gardenWithId7 = {
        ...mockGarden,
        id: 7,
        image: undefined,
      };

      render(<GardenCard garden={gardenWithId7} />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toHaveAttribute('src', '/gardens/garden2.png'); // 7 % 5 = 2
    });

    test('sets correct image height for default variant', () => {
      render(<GardenCard garden={mockGarden} />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toHaveAttribute('height', '160');
    });

    test('sets correct image height for compact variant', () => {
      render(<GardenCard garden={mockGarden} variant="compact" />);

      const image = screen.getByAltText('Test Garden');
      expect(image).toHaveAttribute('height', '120');
    });
  });

  describe('Navigation', () => {
    test('navigates to garden detail page when button is clicked', () => {
      render(<GardenCard garden={mockGarden} />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/gardens/1');
    });

    test('navigates to correct garden id', () => {
      const gardenWithDifferentId = { ...mockGarden, id: 42 };
      render(<GardenCard garden={gardenWithDifferentId} />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/gardens/42');
    });
  });

  describe('Translation', () => {
    test('uses translation for button text', () => {
      render(<GardenCard garden={mockGarden} />);

      expect(mockT).toHaveBeenCalledWith('gardens.viewGarden');
    });

    test('uses current language for location translation', () => {
      render(<GardenCard garden={mockGarden} />);

      expect(locationUtils.translateLocationString).toHaveBeenCalledWith('Istanbul, Turkey', 'en');
    });

    test('uses Turkish language when i18n language is tr', () => {
      useTranslation.mockReturnValue({
        t: mockT,
        i18n: { language: 'tr' },
      });

      render(<GardenCard garden={mockGarden} />);

      expect(locationUtils.translateLocationString).toHaveBeenCalledWith('Istanbul, Turkey', 'tr');
    });
  });

  describe('Variant Styles', () => {
    test('renders with default variant styles', () => {
      const { container } = render(<GardenCard garden={mockGarden} variant="default" />);

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders with compact variant styles', () => {
      const { container } = render(<GardenCard garden={mockGarden} variant="compact" />);

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });

    test('renders with featured variant styles', () => {
      const { container } = render(<GardenCard garden={mockGarden} variant="featured" />);

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Button Variants', () => {
    test('renders text button for default variant', () => {
      render(<GardenCard garden={mockGarden} variant="default" />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      expect(button).toHaveClass('MuiButton-text');
    });

    test('renders text button for compact variant', () => {
      render(<GardenCard garden={mockGarden} variant="compact" />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      expect(button).toHaveClass('MuiButton-text');
    });

    test('renders contained button for featured variant', () => {
      render(<GardenCard garden={mockGarden} variant="featured" />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      expect(button).toHaveClass('MuiButton-contained');
    });
  });

  describe('Edge Cases', () => {
    test('handles garden with empty description', () => {
      const gardenWithEmptyDescription = {
        ...mockGarden,
        description: '',
      };

      render(<GardenCard garden={gardenWithEmptyDescription} />);

      expect(screen.getByText('Test Garden')).toBeInTheDocument();
    });

    test('handles garden with no location', () => {
      const gardenWithoutLocation = {
        ...mockGarden,
        location: '',
      };

      render(<GardenCard garden={gardenWithoutLocation} />);

      expect(screen.getByText('Test Garden')).toBeInTheDocument();
    });

    test('handles garden with id 0', () => {
      const gardenWithZeroId = {
        ...mockGarden,
        id: 0,
      };

      render(<GardenCard garden={gardenWithZeroId} />);

      const button = screen.getByRole('button', { name: 'gardens.viewGarden' });
      fireEvent.click(button);

      expect(mockNavigate).toHaveBeenCalledWith('/gardens/0');
    });

    test('handles description exactly 60 characters in compact variant', () => {
      const gardenWith60CharDesc = {
        ...mockGarden,
        description: 'A'.repeat(60),
      };

      render(<GardenCard garden={gardenWith60CharDesc} variant="compact" />);

      const description = screen.getByText('A'.repeat(60));
      expect(description.textContent).not.toContain('...');
    });

    test('handles description 61 characters in compact variant', () => {
      const gardenWith61CharDesc = {
        ...mockGarden,
        description: 'A'.repeat(61),
      };

      render(<GardenCard garden={gardenWith61CharDesc} variant="compact" />);

      const description = screen.getByText(/A{60}\.\.\./);
      expect(description.textContent).toContain('...');
    });
  });
});
