import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PlantDetail from './PlantDetail';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPlantById, fetchPlants, fetchSoilTypes } from '../../services/plantService';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../services/plantService', () => ({
  fetchPlantById: vi.fn(),
  fetchPlants: vi.fn(),
  fetchSoilTypes: vi.fn(),
}));

describe('PlantDetail Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key, defaultValue) => defaultValue || key);

  const mockPlantData = {
    id: 1,
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    type: 'vegetable',
    description: 'A popular garden vegetable',
    difficulty: 'easy',
    season: 'summer',
    edible: true,
    toxicity: 'none',
    image: '🍅',
    growthRequirements: {
      light: 8,
      water: 7,
      soil: 6,
    },
    growthCharacteristics: {
      height: '100-180cm',
      spacing: '60cm',
    },
    habitat: 'Full sun',
    sunlight: 'Full sun, 6-8 hours daily',
    soil: 'Well-drained, rich in organic matter',
    watering: { frequency: 'Regular watering' },
    notes: 'Supports recommended',
    climateZone: '5-9',
    commonProblems: ['Blight', 'Aphids'],
    companionPlants: { growsWellWith: ['Basil', 'Marigold'], avoidNear: [] },
    distribution: 'Worldwide',
    spacing: '60cm',
    growthDuration: '60-80 days',
  };

  const mockSoilTypesData = [
    {
      id: 'loamy',
      name: 'Loamy Soil',
      description: 'A balanced mix of sand, silt, and clay',
      color: '#8B4513',
    },
  ];

  const mockRelatedPlantsData = {
    data: [
      {
        id: 2,
        name: 'Basil',
        scientificName: 'Ocimum basilicum',
        type: 'herb',
        image: '🌿',
      },
    ],
    total: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ plantId: '1' });
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
    fetchPlantById.mockResolvedValue(mockPlantData);
    fetchSoilTypes.mockResolvedValue(mockSoilTypesData);
    fetchPlants.mockResolvedValue(mockRelatedPlantsData);
  });

  describe('Rendering', () => {
    test('renders plant detail page with plant name', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });
    });

    test('renders plant scientific name', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Solanum lycopersicum')).toBeInTheDocument();
      });
    });

    test('renders plant description', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('A popular garden vegetable')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      fetchPlantById.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<PlantDetail />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows error message on fetch failure', async () => {
      fetchPlantById.mockRejectedValue(new Error('Failed to load plant'));
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load plant')).toBeInTheDocument();
      });
    });

    test('renders plant type and difficulty chips', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('vegetable')).toBeInTheDocument();
        expect(screen.getByText('easy')).toBeInTheDocument();
      });
    });
  });

  describe('Information Display', () => {
    test('displays plant information sections', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Check that plant information is displayed
      expect(screen.getByText('A popular garden vegetable')).toBeInTheDocument();
    });

    test('displays plant characteristics', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Check for plant type and difficulty
      expect(screen.getByText('vegetable')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates back to plant list when back button is clicked', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Back to Plants')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Plants');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plants');
    });
  });

  describe('Growth Requirements Display', () => {
    test('displays sunlight information', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Check if habitat information is present (includes sunlight)
      await waitFor(() => {
        expect(screen.getByText(mockPlantData.habitat)).toBeInTheDocument();
      });
    });

    test('displays soil information', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Well-drained/i)).toBeInTheDocument();
      });
    });
  });

  describe('Related Plants', () => {
    test('fetches related plants data', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Just checking the component calls fetchPlants for related plants
      await waitFor(() => {
        expect(fetchPlants).toHaveBeenCalled();
      });
    });
  });

  describe('Plant Information Display', () => {
    test('displays edible badge when plant is edible', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      expect(screen.getByText(/edible/i)).toBeInTheDocument();
    });

    test('displays toxicity information when present', async () => {
      const toxicPlant = {
        ...mockPlantData,
        toxicity: 'mild',
      };
      fetchPlantById.mockResolvedValue(toxicPlant);

      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      expect(screen.getByText(/mild/i)).toBeInTheDocument();
    });

    test('displays season information', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      expect(screen.getByText('summer')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles missing plant data gracefully', async () => {
      fetchPlantById.mockResolvedValue(null);

      render(<PlantDetail />);

      await waitFor(() => {
        // Should show some error or loading state
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    test('handles network errors', async () => {
      fetchPlantById.mockRejectedValue(new Error('Network error'));

      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Soil Type Recommendation', () => {
    test('loads soil types data', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(fetchSoilTypes).toHaveBeenCalled();
      });
    });

    test('displays soil type chip when available', async () => {
      render(<PlantDetail />);

      await waitFor(() => {
        expect(screen.getByText('Tomato')).toBeInTheDocument();
      });

      // Check if soil type chip is displayed
      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });
    });
  });
});
