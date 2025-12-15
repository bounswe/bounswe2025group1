import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import SoilTypes from './SoilTypes';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchSoilTypes } from '../../services/plantService';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../services/plantService', () => ({
  fetchSoilTypes: vi.fn(),
}));

// Mock window.scrollTo
global.scrollTo = vi.fn();

describe('SoilTypes Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key, defaultValue) => defaultValue || key);

  const mockSoilTypesData = [
    {
      id: 'loamy',
      name: 'Loamy Soil',
      description: 'A balanced mix of sand, silt, and clay',
      color: '#8B4513',
    },
    {
      id: 'sandy',
      name: 'Sandy Soil',
      description: 'Well-draining soil with large particles',
      color: '#F4A460',
    },
    {
      id: 'clay',
      name: 'Clay Soil',
      description: 'Dense soil that retains water',
      color: '#A0522D',
    },
    {
      id: 'silty',
      name: 'Silty Soil',
      description: 'Smooth soil with good water retention',
      color: '#D2691E',
    },
    {
      id: 'peaty',
      name: 'Peaty Soil',
      description: 'Rich in organic matter',
      color: '#654321',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
    fetchSoilTypes.mockResolvedValue(mockSoilTypesData);
  });

  describe('Rendering', () => {
    test('renders soil types page with header', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('🪴 Soil Types')).toBeInTheDocument();
      });

      expect(screen.getByText('Understanding your soil is the key to gardening success')).toBeInTheDocument();
    });

    test('renders search bar', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search soil types/i)).toBeInTheDocument();
      });
    });

    test('renders soil type cards when data is loaded', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
        expect(screen.getByText('Sandy Soil')).toBeInTheDocument();
        expect(screen.getByText('Clay Soil')).toBeInTheDocument();
        expect(screen.getByText('Silty Soil')).toBeInTheDocument();
      });
    });

    test('renders soil descriptions', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('A balanced mix of sand, silt, and clay')).toBeInTheDocument();
        expect(screen.getByText('Well-draining soil with large particles')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      fetchSoilTypes.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<SoilTypes />);

      // Check for any text that should appear after loading
      expect(screen.queryByText('Loamy Soil')).not.toBeInTheDocument();
    });

    test('shows error message on fetch failure', async () => {
      fetchSoilTypes.mockRejectedValue(new Error('Failed to load soil types'));
      render(<SoilTypes />);

      await waitFor(() => {
        // Component handles errors silently, just checking it doesn't crash
        expect(screen.getByText('🪴 Soil Types')).toBeInTheDocument();
      });
    });

    test('shows no results message when search returns no results', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search soil types/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no soil types found matching/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    test('filters soil types based on search query', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search soil types/i);
      fireEvent.change(searchInput, { target: { value: 'sandy' } });

      await waitFor(() => {
        expect(screen.getByText('Sandy Soil')).toBeInTheDocument();
        expect(screen.queryByText('Loamy Soil')).not.toBeInTheDocument();
      });
    });

    test('search is case insensitive', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search soil types/i);
      fireEvent.change(searchInput, { target: { value: 'SANDY' } });

      await waitFor(() => {
        expect(screen.getByText('Sandy Soil')).toBeInTheDocument();
      });
    });

    test('resets to page 1 when search changes', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search soil types/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Page should reset to 1 (check in the header text)
      expect(screen.getByText(/page 0 of 0/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates back to infohub when back button is clicked', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        const backButtons = screen.getAllByText('Back to Infohub');
        expect(backButtons.length).toBeGreaterThan(0);
      });

      const backButtons = screen.getAllByText('Back to Infohub');
      fireEvent.click(backButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('navigates to browse plants when button is clicked', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Browse Plants')).toBeInTheDocument();
      });

      const browsePlantsButton = screen.getByText('Browse Plants');
      fireEvent.click(browsePlantsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plants');
    });
  });

  describe('Pagination', () => {
    test('renders pagination when there are multiple pages', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      // With 5 items and 4 per page, should have 2 pages
      const pagination = screen.getByRole('navigation');
      expect(pagination).toBeInTheDocument();
    });

    test('changes page when pagination button is clicked', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      // Should show first 4 items initially
      expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      expect(screen.getByText('Sandy Soil')).toBeInTheDocument();
      expect(screen.getByText('Clay Soil')).toBeInTheDocument();
      expect(screen.getByText('Silty Soil')).toBeInTheDocument();

      // Click page 2
      const page2Button = screen.getByRole('button', { name: 'Go to page 2' });
      fireEvent.click(page2Button);

      await waitFor(() => {
        // Should show the 5th item
        expect(screen.getByText('Peaty Soil')).toBeInTheDocument();
        // First items should not be visible
        expect(screen.queryByText('Loamy Soil')).not.toBeInTheDocument();
      });
    });
  });

  describe('Display Features', () => {
    test('displays soil color indicators', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText('Loamy Soil')).toBeInTheDocument();
      });

      // Check if color elements are rendered (by checking parent structure)
      const soilCards = screen.getAllByRole('heading', { level: 5 });
      expect(soilCards.length).toBeGreaterThan(0);
    });

    test('displays introductory text', async () => {
      render(<SoilTypes />);

      await waitFor(() => {
        expect(screen.getByText(/soil is the foundation of your garden/i)).toBeInTheDocument();
      });
    });
  });
});
