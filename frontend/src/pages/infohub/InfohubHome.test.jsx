import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import InfohubHome from './InfohubHome';
import { useNavigate } from 'react-router-dom';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('InfohubHome Component', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe('Rendering', () => {
    test('renders the main title and subtitle', () => {
      render(<InfohubHome />);

      expect(screen.getByRole('heading', { level: 2, name: /Information Hub/i })).toBeInTheDocument();
      expect(screen.getByText(/Your complete guide to community gardening/i)).toBeInTheDocument();
    });

    test('renders Browse by Category section', () => {
      render(<InfohubHome />);

      expect(screen.getByText('Browse by Category')).toBeInTheDocument();
    });

    test('renders all three main category cards', () => {
      render(<InfohubHome />);

      expect(screen.getByText('Plant Encyclopedia')).toBeInTheDocument();
      expect(screen.getByText('Soil Types')).toBeInTheDocument();
      expect(screen.getByText('Tool Guide')).toBeInTheDocument();
    });

    test('renders Getting Started section', () => {
      render(<InfohubHome />);

      expect(screen.getByText(/Getting Started/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome to the Information Hub!/i)).toBeInTheDocument();
    });

    test('renders Quick Links section with all links', () => {
      render(<InfohubHome />);

      expect(screen.getByText(/Quick Links/i)).toBeInTheDocument();
      expect(screen.getByText('Gardening Basics')).toBeInTheDocument();
      expect(screen.getByText('Community Rules & Safety')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('navigates to plants page when Plant Encyclopedia card is clicked', () => {
      render(<InfohubHome />);

      const plantCard = screen.getByText('Plant Encyclopedia').closest('div[class*="MuiCard"]');
      fireEvent.click(plantCard);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plants');
    });

    test('navigates to soil-types page when Soil Types card is clicked', () => {
      render(<InfohubHome />);

      const soilCard = screen.getByText('Soil Types').closest('div[class*="MuiCard"]');
      fireEvent.click(soilCard);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/soil-types');
    });

    test('navigates to tool-guide page when Tool Guide card is clicked', () => {
      render(<InfohubHome />);

      const toolCard = screen.getByText('Tool Guide').closest('div[class*="MuiCard"]');
      fireEvent.click(toolCard);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/tool-guide');
    });

    test('navigates to gardening-basics when quick link is clicked', () => {
      render(<InfohubHome />);

      const gardeningBasicsLink = screen.getByText('Gardening Basics');
      fireEvent.click(gardeningBasicsLink);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/gardening-basics');
    });

    test('navigates to faq when FAQ quick link is clicked', () => {
      render(<InfohubHome />);

      const faqLink = screen.getByText('FAQ');
      fireEvent.click(faqLink);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/faq');
    });

    test('navigates to support when Support quick link is clicked', () => {
      render(<InfohubHome />);

      const supportLink = screen.getByText('Support');
      fireEvent.click(supportLink);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/support');
    });
  });
});
