import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import InfohubDetail from './InfohubDetail';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  useParams: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

describe('InfohubDetail Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key) => {
    const translations = {
      'common.back': 'Back',
      'infohub.detailsComingSoon': 'Details coming soon',
      'infohub.backToCategories': 'Back to All Categories',
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
    test('renders plant care category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'plant-care' });
      render(<InfohubDetail />);

      expect(screen.getByText('Plant Care')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Back to All Categories')).toBeInTheDocument();
    });

    test('renders pest disease category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'pest-disease' });
      render(<InfohubDetail />);

      expect(screen.getByText('Pest & Disease Control')).toBeInTheDocument();
    });

    test('renders soil composting category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'soil-composting' });
      render(<InfohubDetail />);

      expect(screen.getByText('Soil & Composting')).toBeInTheDocument();
    });

    test('renders gardening calendar category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'gardening-calendar' });
      render(<InfohubDetail />);

      expect(screen.getByText('Gardening Calendar')).toBeInTheDocument();
    });

    test('renders tools techniques category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'tools-techniques' });
      render(<InfohubDetail />);

      expect(screen.getByText('Tools & Techniques')).toBeInTheDocument();
    });

    test('renders sustainable gardening category detail page', () => {
      useParams.mockReturnValue({ categoryId: 'sustainable-gardening' });
      render(<InfohubDetail />);

      expect(screen.getByText('Sustainable Gardening')).toBeInTheDocument();
    });

    test('renders back button', () => {
      useParams.mockReturnValue({ categoryId: 'plant-care' });
      render(<InfohubDetail />);

      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
    });

    test('renders back to categories button', () => {
      useParams.mockReturnValue({ categoryId: 'plant-care' });
      render(<InfohubDetail />);

      const backToCategoriesButton = screen.getByText('Back to All Categories');
      expect(backToCategoriesButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates back to infohub home when back button is clicked', () => {
      useParams.mockReturnValue({ categoryId: 'plant-care' });
      render(<InfohubDetail />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('navigates back to infohub home when back to categories button is clicked', () => {
      useParams.mockReturnValue({ categoryId: 'pest-disease' });
      render(<InfohubDetail />);

      const backToCategoriesButton = screen.getByText('Back to All Categories');
      fireEvent.click(backToCategoriesButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('redirects to infohub home for invalid category', () => {
      useParams.mockReturnValue({ categoryId: 'invalid-category' });
      render(<InfohubDetail />);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });
  });
});
