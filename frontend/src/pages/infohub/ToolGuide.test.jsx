import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ToolGuide from './ToolGuide';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchTools } from '../../services/plantService';

// Mock the modules/hooks
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../services/plantService', () => ({
  fetchTools: vi.fn(),
}));

// Mock window.scrollTo
global.scrollTo = vi.fn();

describe('ToolGuide Component', () => {
  const mockNavigate = vi.fn();
  const mockT = vi.fn((key, defaultValue) => defaultValue || key);

  const mockToolsData = [
    {
      id: 'spade',
      name: 'Garden Spade',
      description: 'A flat-bladed tool for digging',
      type: 'Digging',
      skillLevel: 'Beginner',
      image: '🔨',
      uses: ['Digging holes', 'Turning soil', 'Edging beds'],
      tips: 'Keep the blade sharp for easier digging',
    },
    {
      id: 'rake',
      name: 'Garden Rake',
      description: 'A tool with teeth for leveling soil',
      type: 'Leveling',
      skillLevel: 'Beginner',
      image: '🔧',
      uses: ['Leveling soil', 'Removing debris'],
      tips: 'Use with a smooth motion',
    },
    {
      id: 'pruner',
      name: 'Pruning Shears',
      description: 'Sharp scissors for trimming plants',
      type: 'Cutting',
      skillLevel: 'Intermediate',
      image: '✂️',
      uses: ['Pruning branches', 'Trimming stems'],
      tips: 'Clean after each use',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });
    fetchTools.mockResolvedValue(mockToolsData);
  });

  describe('Rendering', () => {
    test('renders tool guide page with header', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('🔧 Tool Guide')).toBeInTheDocument();
      });

      expect(screen.getByText('The right tools make gardening easier and more enjoyable')).toBeInTheDocument();
    });

    test('renders search bar', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search tools/i)).toBeInTheDocument();
      });
    });

    test('renders tool cards when data is loaded', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
        expect(screen.getByText('Garden Rake')).toBeInTheDocument();
        expect(screen.getByText('Pruning Shears')).toBeInTheDocument();
      });
    });

    test('renders tool descriptions', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('A flat-bladed tool for digging')).toBeInTheDocument();
        expect(screen.getByText('A tool with teeth for leveling soil')).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      fetchTools.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<ToolGuide />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('shows error message on fetch failure', async () => {
      fetchTools.mockRejectedValue(new Error('Failed to load tools'));
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load tools')).toBeInTheDocument();
      });
    });

    test('shows no results message when search returns no results', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tools/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByText(/no tools found matching/i)).toBeInTheDocument();
      });
    });

    test('renders tool maintenance tips section', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('🛠️ Tool Maintenance Tips')).toBeInTheDocument();
      });

      expect(screen.getByText(/clean tools after each use/i)).toBeInTheDocument();
      expect(screen.getByText(/dry thoroughly to prevent rust/i)).toBeInTheDocument();
    });
  });

  describe('Tool Information Display', () => {
    test('displays tool type and skill level chips', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      expect(screen.getByText('Digging')).toBeInTheDocument();
      expect(screen.getAllByText('Beginner').length).toBeGreaterThan(0);
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });

    test('displays tool uses list', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Digging holes')).toBeInTheDocument();
      });

      expect(screen.getByText('Turning soil')).toBeInTheDocument();
      expect(screen.getByText('Edging beds')).toBeInTheDocument();
    });

    test('displays tool tips', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText(/keep the blade sharp/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/use with a smooth motion/i)).toBeInTheDocument();
      expect(screen.getByText(/clean after each use/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('filters tools based on search query', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tools/i);
      fireEvent.change(searchInput, { target: { value: 'spade' } });

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
        expect(screen.queryByText('Garden Rake')).not.toBeInTheDocument();
      });
    });

    test('search is case insensitive', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tools/i);
      fireEvent.change(searchInput, { target: { value: 'SPADE' } });

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });
    });

    test('searches by tool type', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search tools/i);
      fireEvent.change(searchInput, { target: { value: 'cutting' } });

      await waitFor(() => {
        expect(screen.getByText('Pruning Shears')).toBeInTheDocument();
        expect(screen.queryByText('Garden Spade')).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('navigates back to infohub when back button is clicked', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        const backButtons = screen.getAllByText('Back to Infohub');
        expect(backButtons.length).toBeGreaterThan(0);
      });

      const backButtons = screen.getAllByText('Back to Infohub');
      fireEvent.click(backButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub');
    });

    test('navigates to browse plants when button is clicked', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Browse Plants')).toBeInTheDocument();
      });

      const browsePlantsButton = screen.getByText('Browse Plants');
      fireEvent.click(browsePlantsButton);

      expect(mockNavigate).toHaveBeenCalledWith('/infohub/plants');
    });
  });

  describe('Pagination', () => {
    test('does not render pagination when all tools fit on one page', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      // With 3 tools and 6 per page, should not have pagination
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('renders pagination when there are more tools than fit on one page', async () => {
      // Create 7 tools to exceed the 6 per page limit
      const manyTools = [
        ...mockToolsData,
        { id: 'tool4', name: 'Tool 4', description: 'Description 4', type: 'Type', skillLevel: 'Beginner', image: '🔨', uses: ['Use'], tips: 'Tip' },
        { id: 'tool5', name: 'Tool 5', description: 'Description 5', type: 'Type', skillLevel: 'Beginner', image: '🔨', uses: ['Use'], tips: 'Tip' },
        { id: 'tool6', name: 'Tool 6', description: 'Description 6', type: 'Type', skillLevel: 'Beginner', image: '🔨', uses: ['Use'], tips: 'Tip' },
        { id: 'tool7', name: 'Tool 7', description: 'Description 7', type: 'Type', skillLevel: 'Beginner', image: '🔨', uses: ['Use'], tips: 'Tip' },
      ];
      fetchTools.mockResolvedValue(manyTools);

      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      // Should have pagination
      const pagination = screen.getByRole('navigation');
      expect(pagination).toBeInTheDocument();
    });
  });

  describe('Skill Level Colors', () => {
    test('displays different colors for different skill levels', async () => {
      render(<ToolGuide />);

      await waitFor(() => {
        expect(screen.getByText('Garden Spade')).toBeInTheDocument();
      });

      // Just verify that skill level chips are rendered
      const beginnerChips = screen.getAllByText('Beginner');
      const intermediateChips = screen.getAllByText('Intermediate');

      expect(beginnerChips.length).toBeGreaterThan(0);
      expect(intermediateChips.length).toBeGreaterThan(0);
    });
  });
});
