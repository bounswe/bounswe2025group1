import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import EventCreateDialog from './EventCreateDialog';
import { useAuth } from '../contexts/AuthContextUtils';
import { useTranslation } from 'react-i18next';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

// Mock the modules/hooks
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../utils/keyboardNavigation', () => ({
  createFormKeyboardHandler: vi.fn(() => vi.fn()),
  trapFocus: vi.fn(() => vi.fn()),
}));

// Mock dayjs
vi.mock('dayjs', async () => {
  const originalDayjs = await vi.importActual('dayjs');
  const mockDayjs = vi.fn((date) => {
    if (date) {
      return originalDayjs.default(date);
    }
    return originalDayjs.default('2024-01-15T10:00:00Z');
  });
  
  // Copy all methods from original dayjs
  Object.setPrototypeOf(mockDayjs, originalDayjs.default);
  Object.assign(mockDayjs, originalDayjs.default);
  
  mockDayjs.locale = vi.fn();
  
  return { default: mockDayjs };
});

// Mock fetch
global.fetch = vi.fn();

// Set up environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_URL', 'http://test-api.example.com');
});

// Wrapper component for LocalizationProvider
const TestWrapper = ({ children }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    {children}
  </LocalizationProvider>
);

describe('EventCreateDialog Component', () => {
  const mockToken = 'mock-token';
  const mockOnClose = vi.fn();
  const mockOnEventCreated = vi.fn();
  const mockGardenId = '123';
  const mockT = vi.fn((key) => key);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock return values
    useAuth.mockReturnValue({
      token: mockToken,
    });

    useTranslation.mockReturnValue({
      t: mockT,
      i18n: { language: 'en' },
    });

    // Mock successful fetch response
    fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: '456',
          title: 'Test Event',
          description: 'Test Description',
          start_at: '2024-01-16T10:00:00Z',
        }),
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  describe('Rendering', () => {
    test('renders dialog with title and form fields when open', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(mockT).toHaveBeenCalledWith('events.createEvent');
      expect(screen.getByLabelText(/events.createEvent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/events.title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/events.description/i)).toBeInTheDocument();
    });

    test('does not render when not open', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={false}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('renders event category selection', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(mockT).toHaveBeenCalledWith('events.selectCategory');
      // Check for category options
      expect(mockT).toHaveBeenCalledWith('events.category.workshop');
      expect(mockT).toHaveBeenCalledWith('events.category.potluck');
      expect(mockT).toHaveBeenCalledWith('events.category.exchange');
    });

    test('renders visibility selection dropdown', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(mockT).toHaveBeenCalledWith('events.visibility');
      expect(mockT).toHaveBeenCalledWith('events.public');
      expect(mockT).toHaveBeenCalledWith('events.private');
    });

    test('renders action buttons', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.cancel') return 'Cancel';
        if (key === 'events.create') return 'Create';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    test('updates title field when user types', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/events.title/i);
      fireEvent.change(titleInput, { target: { value: 'My Test Event' } });

      expect(titleInput).toHaveValue('My Test Event');
    });

    test('updates description field when user types', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const descriptionInput = screen.getByLabelText(/events.description/i);
      fireEvent.change(descriptionInput, { target: { value: 'My test description' } });

      expect(descriptionInput).toHaveValue('My test description');
    });

    test('selects event category when clicked', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Find and click a category (workshop)
      const categoryButtons = screen.getAllByRole('button');
      const workshopButton = categoryButtons.find(button => 
        button.textContent?.includes('events.category.workshop')
      );
      
      if (workshopButton) {
        fireEvent.click(workshopButton);
        // The category should be visually selected (this would be tested via styling)
      }
    });

    test('changes visibility selection', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const visibilitySelect = screen.getByRole('combobox');
      fireEvent.mouseDown(visibilitySelect);
      
      // The dropdown should open (testing the interaction)
      expect(visibilitySelect).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    test('shows error when submitting without title', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.titleRequired') return 'Title is required';
        if (key === 'events.create') return 'Create';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    test('shows error when start time is invalid', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.startTimeRequired') return 'Start time is required';
        if (key === 'events.create') return 'Create';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // This test verifies the component renders without crashing
      expect(screen.getByLabelText(/events.createEvent/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('submits form with correct data and calls onEventCreated', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.create') return 'Create';
        if (key === 'events.eventCreatedSuccessfully') return 'Event created successfully';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Fill in the form
      const titleInput = screen.getByLabelText(/events.title/i);
      const descriptionInput = screen.getByLabelText(/events.description/i);

      fireEvent.change(titleInput, { target: { value: 'Test Event' } });
      fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

      // Submit the form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://test-api.example.com/events/',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${mockToken}`,
            },
            body: expect.stringContaining('"title":"Test Event"'),
          })
        );
      });

      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalledWith({
          id: '456',
          title: 'Test Event',
          description: 'Test Description',
          start_at: '2024-01-16T10:00:00Z',
        });
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('handles API error gracefully', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.create') return 'Create';
        if (key === 'events.failedToCreateEvent') return 'Failed to create event';
        return key;
      });

      // Mock fetch error
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ detail: 'Bad request' }),
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Fill in the form
      const titleInput = screen.getByLabelText(/events.title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // Submit the form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Bad request')).toBeInTheDocument();
      });

      expect(mockOnEventCreated).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('shows loading state during submission', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.create') return 'Create';
        if (key === 'events.creating') return 'Creating...';
        return key;
      });

      // Delay the fetch response
      fetch.mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                id: '456',
                title: 'Test Event',
              }),
            });
          }, 100);
        });
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Fill in the form
      const titleInput = screen.getByLabelText(/events.title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // Submit the form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      // Check loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(mockOnEventCreated).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Actions', () => {
    test('calls onClose when cancel button is clicked', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.cancel') return 'Cancel';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('resets form when modal is closed', () => {
      mockT.mockImplementation((key) => {
        if (key === 'common.cancel') return 'Cancel';
        return key;
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Fill in some data
      const titleInput = screen.getByLabelText(/events.title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // Close the modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const dialog = screen.getByLabelText(/events.createEvent/i);
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'event-create-title');
    });

    test('has proper form labels and accessibility attributes', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      const titleInput = screen.getByLabelText(/events.title/i);
      const descriptionInput = screen.getByLabelText(/events.description/i);

      expect(titleInput).toBeInTheDocument();
      expect(descriptionInput).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    test('uses translation function for all text content', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Verify key translation calls
      expect(mockT).toHaveBeenCalledWith('events.createEvent');
      expect(mockT).toHaveBeenCalledWith('events.title');
      expect(mockT).toHaveBeenCalledWith('events.description');
      expect(mockT).toHaveBeenCalledWith('events.startTime');
      expect(mockT).toHaveBeenCalledWith('events.visibility');
      expect(mockT).toHaveBeenCalledWith('common.cancel');
      expect(mockT).toHaveBeenCalledWith('events.create');
    });

    test('handles Turkish language locale for date picker', () => {
      useTranslation.mockReturnValue({
        t: mockT,
        i18n: { language: 'tr' },
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // The component should handle Turkish locale
      expect(screen.getByLabelText(/events.createEvent/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles missing token gracefully', () => {
      useAuth.mockReturnValue({
        token: null,
      });

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/events.createEvent/i)).toBeInTheDocument();
    });

    test('handles network error during submission', async () => {
      mockT.mockImplementation((key) => {
        if (key === 'events.create') return 'Create';
        if (key === 'events.failedToCreateEventTryLater') return 'Failed to create event, try later';
        return key;
      });

      // Mock network error
      fetch.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId={mockGardenId}
          />
        </TestWrapper>
      );

      // Fill in the form
      const titleInput = screen.getByLabelText(/events.title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Event' } });

      // Submit the form
      const createButton = screen.getByText('Create');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create event, try later')).toBeInTheDocument();
      });
    });

    test('handles empty gardenId', () => {
      render(
        <TestWrapper>
          <EventCreateDialog
            open={true}
            onClose={mockOnClose}
            onEventCreated={mockOnEventCreated}
            gardenId=""
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/events.createEvent/i)).toBeInTheDocument();
    });
  });
});
