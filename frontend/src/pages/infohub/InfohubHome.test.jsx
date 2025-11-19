import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import InfohubHome from './InfohubHome';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('InfohubHome Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key) => {
    const translations = {
      'infohub.title': 'Community Garden Infohub',
      'infohub.subtitle': 'Learn, Grow, Connect.',
      'infohub.exploreMore': 'Explore',
      'infohub.categories.plantCare.title': 'Plant Care',
      'infohub.categories.pestDisease.title': 'Pest & Disease Control',
      'infohub.categories.soilComposting.title': 'Soil & Composting',
      'infohub.categories.gardeningCalendar.title': 'Gardening Calendar',
      'infohub.categories.toolsTechniques.title': 'Tools & Techniques',
      'infohub.categories.sustainableGardening.title': 'Sustainable Gardening',
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
  });

  describe('Rendering', () => {
    test('renders infohub home page with title and subtitle', () => {
      render(<InfohubHome />);

      expect(screen.getByText('Community Garden Infohub')).toBeInTheDocument();
      expect(screen.getByText('Learn, Grow, Connect.')).toBeInTheDocument();
    });

    test('renders all 6 category cards', () => {
      render(<InfohubHome />);

      expect(screen.getByText('Plant Care')).toBeInTheDocument();
      expect(screen.getByText('Pest & Disease Control')).toBeInTheDocument();
      expect(screen.getByText('Soil & Composting')).toBeInTheDocument();
      expect(screen.getByText('Gardening Calendar')).toBeInTheDocument();
      expect(screen.getByText('Tools & Techniques')).toBeInTheDocument();
      expect(screen.getByText('Sustainable Gardening')).toBeInTheDocument();
    });

    test('renders explore buttons for each category', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      expect(exploreButtons).toHaveLength(6);
    });

    test('renders category images', () => {
      render(<InfohubHome />);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(6);
      images.forEach(img => {
        expect(img).toHaveAttribute('src');
      });
    });
  });

  describe('Navigation', () => {
    test('navigates to plant care detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plant-care');
    });

    test('navigates to pest disease detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[1]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/pest-disease');
    });

    test('navigates to soil composting detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[2]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/soil-composting');
    });

    test('navigates to gardening calendar detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[3]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/gardening-calendar');
    });

    test('navigates to tools techniques detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[4]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/tools-techniques');
    });

    test('navigates to sustainable gardening detail when explore button is clicked', () => {
      render(<InfohubHome />);

      const exploreButtons = screen.getAllByText('Explore');
      fireEvent.click(exploreButtons[5]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/sustainable-gardening');
    });
  });
});
