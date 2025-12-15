import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PlantList from './PlantList';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPlants } from '../../services/plantService';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../services/plantService', () => ({
  fetchPlants: vi.fn(),
}));

describe('PlantList Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key, defaultValue) => defaultValue || key);

  const mockPlantsData = {
    data: [
      {
        id: 1,
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        type: 'vegetable',
        difficulty: 'easy',
        season: 'summer',
        edible: true,
        toxicity: 'none',
        image: '🍅',
        growthRequirements: { light: 8 },
      },
      {
        id: 2,
        name: 'Basil',
        scientificName: 'Ocimum basilicum',
        type: 'herb',
        difficulty: 'easy',
        season: 'summer',
        edible: true,
        toxicity: 'none',
        image: '🌿',
        growthRequirements: { light: 7 },
      },
    ],
    total: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
    fetchPlants.mockResolvedValue(mockPlantsData);
  });

  describe('Rendering', () => {
    test('renders plant list page with header', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText(/Plant Encyclopedia/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Browse our collection of plants with care guides')).toBeInTheDocument();
    });

    test('renders search bar', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search plants...')).toBeInTheDocument();
      });
    });

    test('renders plant type filter chips', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
        expect(screen.getByText('Vegetable')).toBeInTheDocument();
        expect(screen.getByText('Herb')).toBeInTheDocument();
        expect(screen.getByText('Flower')).toBeInTheDocument();
      });
    });

    test('renders plant cards when data is loaded', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
        expect(screen.getByText('Basil')).toBeInTheDocument();
      });

      expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
      expect(screen.getByText('Ocimum basilicum')).toBeInTheDocument();
    });

    test('shows loading state initially', () => {
      fetchPlants.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<PlantList />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows error message on fetch failure', async () => {
      fetchPlants.mockRejectedValue(new Error('Failed to load plants'));
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load plants')).toBeInTheDocument();
      });
    });

    test('shows no results message when no plants found', async () => {
      fetchPlants.mockResolvedValue({ data: [], total: 0 });
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('No plants found matching your search.')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    test('updates search query when typing in search bar', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search plants...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search plants...');
      fireEvent.change(searchInput, { target: { value: 'tomato' } });

      expect(searchInput.value).toBe('tomato');
    });

    test('filters plants by type when clicking type chip', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Herb')).toBeInTheDocument();
      });

      const herbChip = screen.getByText('Herb');
      fireEvent.click(herbChip);

      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'herb',
          })
        );
      });
    });

    test('resets to page 1 when search changes', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search plants...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search plants...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Should call fetchPlants with page 1
      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 1,
          })
        );
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back to infohub when back button is clicked', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Back to Infohub')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Infohub');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('navigates to plant detail when plant card is clicked', async () => {
      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      const tomatoCard = screen.getByText('Tomato').closest('.MuiCard-root');
      fireEvent.click(tomatoCard);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plants/1');
    });
  });

  describe('Pagination', () => {
    test('renders pagination when there are multiple pages', async () => {
      fetchPlants.mockResolvedValue({
        data: mockPlantsData.data,
        total: 50, // More than one page
      });

      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Check if pagination is rendered
      const pagination = screen.getByRole('navigation');
      expect(pagination).toBeInTheDocument();
    });

    test('does not render pagination when there is only one page', async () => {
      fetchPlants.mockResolvedValue({
        data: mockPlantsData.data,
        total: 2, // Only one page
      });

      render(<PlantList />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Pagination should not be present
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });
});
