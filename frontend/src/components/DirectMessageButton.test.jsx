import React from 'react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DirectMessageButton from './DirectMessageButton';
import { useAuth } from '../contexts/AuthContextUtils';
import { createDirectMessage } from '../utils/chatUtils';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Chat: () => <svg data-testid="chat-icon" />,
}));

// Mock AuthContext
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

// Mock chatUtils
vi.mock('../utils/chatUtils', () => ({
  createDirectMessage: vi.fn(),
}));

// Mock firebase config
vi.mock('../config/firebaseConfig', () => ({
  db: {},
}));

describe('DirectMessageButton Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
  };

  const mockTargetUserId = 2;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    useAuth.mockReturnValue({ user: mockUser });
    createDirectMessage.mockResolvedValue('django_1_django_2');

    // Mock window.dispatchEvent
    vi.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    test('renders message button with correct text', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    test('renders with chat icon', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const icon = screen.getByTestId('chat-icon');
      expect(icon).toBeInTheDocument();
    });

    test('renders with default variant and size', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-outlined');
      expect(button).toHaveClass('MuiButton-sizeSmall');
    });

    test('renders with custom variant', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} variant="contained" />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-contained');
    });

    test('renders with custom size', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} size="large" />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });

    test('applies custom sx prop', () => {
      const customSx = { backgroundColor: 'red' };
      render(<DirectMessageButton targetUserId={mockTargetUserId} sx={customSx} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });

    test('does not render when user tries to message themselves', () => {
      useAuth.mockReturnValue({ user: mockUser });
      
      render(<DirectMessageButton targetUserId={mockUser.id} />);
      
      const button = screen.queryByRole('button', { name: /message/i });
      expect(button).not.toBeInTheDocument();
    });

    test('renders when no user is logged in', () => {
      useAuth.mockReturnValue({ user: null });
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button Interaction', () => {
    test('button is enabled by default', () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      expect(button).not.toBeDisabled();
    });

    test('creates direct message when clicked', async () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledTimes(1);
        expect(createDirectMessage).toHaveBeenCalledWith(
          {},
          'django_1',
          'django_2'
        );
      });
    });

    test('dispatches openDirectMessage event with chatId', async () => {
      const mockChatId = 'django_1_django_2';
      createDirectMessage.mockResolvedValue(mockChatId);
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(window.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'openDirectMessage',
            detail: { chatId: mockChatId },
          })
        );
      });
    });

    test('shows loading state during chat creation', async () => {
      createDirectMessage.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('chat-id'), 100)));
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      // Button should be disabled while loading
      expect(button).toBeDisabled();
      
      // Should show loading spinner instead of chat icon
      const spinner = screen.getByRole('progressbar');
      expect(spinner).toBeInTheDocument();
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    test('re-enables button after successful chat creation', async () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles error when user is not logged in', async () => {
      useAuth.mockReturnValue({ user: null });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Unable to start chat. Missing user or target.');
      });
      
      consoleSpy.mockRestore();
    });

    test('handles error when targetUserId is missing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectMessageButton targetUserId={null} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith('Unable to start chat. Missing user or target.');
      });
      
      consoleSpy.mockRestore();
    });

    test('handles error during chat creation', async () => {
      const error = new Error('Failed to create chat');
      createDirectMessage.mockRejectedValue(error);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error starting chat:', error);
      });
      
      // Button should be re-enabled after error
      expect(button).not.toBeDisabled();
      
      consoleSpy.mockRestore();
    });

    test('re-enables button after error', async () => {
      createDirectMessage.mockRejectedValue(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Firebase UID Creation', () => {
    test('creates correct Firebase UIDs for current user', async () => {
      const customUser = { id: 123 };
      useAuth.mockReturnValue({ user: customUser });
      
      render(<DirectMessageButton targetUserId={456} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledWith(
          {},
          'django_123',
          'django_456'
        );
      });
    });

    test('creates correct Firebase UIDs for target user', async () => {
      render(<DirectMessageButton targetUserId={789} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledWith(
          {},
          'django_1',
          'django_789'
        );
      });
    });
  });

  describe('Multiple Clicks', () => {
    test('prevents multiple simultaneous chat creations', async () => {
      createDirectMessage.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('chat-id'), 100)));
      
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Should only call createDirectMessage once
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledTimes(1);
      });
    });

    test('allows new chat creation after previous one completes', async () => {
      render(<DirectMessageButton targetUserId={mockTargetUserId} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      
      // First click
      fireEvent.click(button);
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledTimes(1);
      });
      
      // Second click after completion
      fireEvent.click(button);
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined targetUserId', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<DirectMessageButton targetUserId={undefined} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).not.toHaveBeenCalled();
      });
      
      consoleSpy.mockRestore();
    });

    test('handles negative targetUserId', async () => {
      render(<DirectMessageButton targetUserId={-1} />);
      
      const button = screen.getByRole('button', { name: /message/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(createDirectMessage).toHaveBeenCalledWith(
          {},
          'django_1',
          'django_-1'
        );
      });
    });
  });
});
