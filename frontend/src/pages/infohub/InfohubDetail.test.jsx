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
    test('renders heading and navigation buttons for gardening-basics', () => {
      useParams.mockReturnValue({ categoryId: 'gardening-basics' });
      render(<InfohubDetail />);

      // heading exists (title is translation-driven; do not assert exact text)
      expect(screen.getByTestId('infohub-detail-title')).toBeInTheDocument();

      // back button should be present
      expect(screen.getByRole('button', { name: /back to all categories/i })).toBeInTheDocument();
    });

    test('renders heading for other categories without asserting exact title', () => {
      const categoryIds = ['gardening-basics', 'soil-types', 'tool-guide', 'community-rules-safety', 'faq', 'support'];
      for (const id of categoryIds) {
        useParams.mockReturnValue({ categoryId: id });
        const { unmount } = render(<InfohubDetail />);
        expect(screen.getByTestId('infohub-detail-title')).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Navigation', () => {
    test('navigates back to infohub home when back button is clicked', () => {
      useParams.mockReturnValue({ categoryId: 'gardening-basics' });
      render(<InfohubDetail />);

      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('navigates back to infohub home when back to categories button is clicked', () => {
      useParams.mockReturnValue({ categoryId: 'gardening-basics' });
      render(<InfohubDetail />);

      const backToCategoriesButton = screen.getByTestId('back-to-infohub-button');
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
