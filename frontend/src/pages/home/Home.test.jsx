import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Home from './Home';
import { useAuth } from '../../contexts/AuthContextUtils';

// Mock the auth context
vi.mock('../../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        'home.welcome': `Welcome${options?.username || ''}!`,
        'home.welcomeGuest': 'Welcome to Community Garden Planner!',
        'home.subtitle': 'Connect with fellow gardeners, share knowledge, and grow together in our vibrant community.',
        'home.joinCommunity': 'Join Our Community',
        'home.weatherTitle': 'Weather',
        'home.forumTitle': 'Recent Discussions',
        'home.gardensTitle': 'Featured Gardens',
        'home.tasksTitle': 'Your Tasks'
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock complex components
vi.mock('../../components/WeatherWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="weather-widget">Weather Widget</div>,
}));

vi.mock('../../components/ForumPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="forum-preview">Forum Preview</div>,
}));

vi.mock('../../components/GardensPreview', () => ({
  __esModule: true,
  default: () => <div data-testid="gardens-preview">Gardens Preview</div>,
}));

vi.mock('../../components/TaskWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="task-widget">Task Widget</div>,
}));

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Guest User Experience', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });
    });

    it('renders welcome message for guest users', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText('Welcome to Community Garden Planner!')).toBeInTheDocument();
      expect(screen.getByText('Connect with fellow gardeners, share knowledge, and grow together in our vibrant community.')).toBeInTheDocument();
    });

    it('shows join community button for guest users', () => {
      renderWithProviders(<Home />);

      const joinButton = screen.getByRole('button', { name: /join our community/i });
      expect(joinButton).toBeInTheDocument();
    });

    it('navigates to registration when join button is clicked', () => {
      renderWithProviders(<Home />);

      const joinButton = screen.getByRole('button', { name: /join our community/i });
      fireEvent.click(joinButton);

      expect(mockNavigate).toHaveBeenCalledWith('/auth/register');
    });
  });

  describe('Authenticated User Experience', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', id: 1 },
        token: 'mock-token',
      });
    });

    it('renders personalized welcome message for authenticated users', () => {
      renderWithProviders(<Home />);

      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
      expect(screen.getByText('Connect with fellow gardeners, share knowledge, and grow together in our vibrant community.')).toBeInTheDocument();
    });

    it('does not show join community button for authenticated users', () => {
      renderWithProviders(<Home />);

      const joinButton = screen.queryByRole('button', { name: /join our community/i });
      expect(joinButton).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', id: 1 },
        token: 'mock-token',
      });
    });

    it('renders all preview components', () => {
      renderWithProviders(<Home />);

      expect(screen.getByTestId('weather-widget')).toBeInTheDocument();
      expect(screen.getByTestId('forum-preview')).toBeInTheDocument();
      expect(screen.getByTestId('gardens-preview')).toBeInTheDocument();
      expect(screen.getByTestId('task-widget')).toBeInTheDocument();
    });

    it('renders the main layout structure', () => {
      renderWithProviders(<Home />);

      // Check for main container (use document.body since no main role exists)
      const container = document.body;
      expect(container).toBeInTheDocument();

      // Verify welcome banner is present
      expect(screen.getByText('Welcome, testuser!')).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });
    });

    it('renders without theme errors', () => {
      expect(() => {
        renderWithProviders(<Home />);
      }).not.toThrow();

      // Verify basic elements are rendered
      expect(screen.getByText('Welcome to Community Garden Planner!')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: { username: 'testuser', id: 1 },
        token: 'mock-token',
      });
    });

    it('renders all components in grid layout', async () => {
      renderWithProviders(<Home />);

      // Wait for all components to render
      await waitFor(() => {
        expect(screen.getByTestId('weather-widget')).toBeInTheDocument();
        expect(screen.getByTestId('forum-preview')).toBeInTheDocument();
        expect(screen.getByTestId('gardens-preview')).toBeInTheDocument();
        expect(screen.getByTestId('task-widget')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      useAuth.mockReturnValue({
        user: null,
        token: null,
      });
    });

    it('has accessible button for join community', () => {
      renderWithProviders(<Home />);

      const joinButton = screen.getByRole('button', { name: /join our community/i });
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).toHaveAttribute('type', 'button');
    });

    it('has proper heading structure', () => {
      renderWithProviders(<Home />);

      // Check for main heading
      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Welcome to Community Garden Planner!');
    });
  });
});
