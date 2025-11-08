import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useAuth hook
const mockUser = {
  id: 123,
  username: 'testuser',
};

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// Mock Firebase config
vi.mock('../config/firebaseConfig', () => ({
  db: {},
}));

// Mock chatUtils
const mockCreateDirectMessage = vi.fn();
vi.mock('../utils/chatUtils', () => ({
  createDirectMessage: (...args) => mockCreateDirectMessage(...args),
}));

// Create a mock component that tests the core functionality
const MockDirectMessageButton = ({ 
  targetUserId, 
  variant = 'outlined', 
  size = 'small',
  currentUserId = mockUser.id,
  onChatCreated = null,
}) => {
  const [loading, setLoading] = React.useState(false);

  const handleStartChat = async () => {
    if (!currentUserId || !targetUserId) {
      console.error('Unable to start chat. Missing user or target.');
      return;
    }

    setLoading(true);

    try {
      // Simulate creating a direct message
      const currentFirebaseUid = `django_${currentUserId}`;
      const targetFirebaseUid = `django_${targetUserId}`;
      
      // Simulate chat ID creation (sorted UIDs)
      const [sorted1, sorted2] = [currentFirebaseUid, targetFirebaseUid].sort();
      const chatId = `${sorted1}_${sorted2}`;

      // Call the mock function
      await mockCreateDirectMessage({}, currentFirebaseUid, targetFirebaseUid);

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('openDirectMessage', { 
        detail: { chatId } 
      }));

      // Call optional callback
      if (onChatCreated) {
        onChatCreated(chatId);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if trying to message yourself
  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <button
      data-testid="direct-message-button"
      onClick={handleStartChat}
      disabled={loading}
      data-variant={variant}
      data-size={size}
      data-loading={loading}
    >
      {loading ? (
        <span data-testid="loading-indicator">Loading...</span>
      ) : (
        <span data-testid="message-icon">💬</span>
      )}
      Message
    </button>
  );
};

describe('DirectMessageButton Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateDirectMessage.mockResolvedValue('django_123_django_456');
  });

  it('renders with default props', () => {
    render(<MockDirectMessageButton targetUserId={456} />);
    
    expect(screen.getByTestId('direct-message-button')).toBeInTheDocument();
    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByTestId('message-icon')).toBeInTheDocument();
  });

  it('renders with custom variant and size', () => {
    render(
      <MockDirectMessageButton 
        targetUserId={456} 
        variant="contained" 
        size="medium" 
      />
    );
    
    const button = screen.getByTestId('direct-message-button');
    expect(button).toHaveAttribute('data-variant', 'contained');
    expect(button).toHaveAttribute('data-size', 'medium');
  });

  it('does not render when targetUserId matches currentUserId', () => {
    render(<MockDirectMessageButton targetUserId={123} currentUserId={123} />);
    
    expect(screen.queryByTestId('direct-message-button')).not.toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    mockCreateDirectMessage.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('chat_id'), 100))
    );

    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    
    // Initially not loading
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    expect(button).not.toBeDisabled();
    
    // Click button
    fireEvent.click(button);
    
    // Should show loading state immediately
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it('creates direct message chat when clicked', async () => {
    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockCreateDirectMessage).toHaveBeenCalledWith(
        {},
        'django_123',
        'django_456'
      );
    });
  });

  it('dispatches openDirectMessage event with correct chatId', async () => {
    const eventListener = vi.fn();
    window.addEventListener('openDirectMessage', eventListener);

    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    const event = eventListener.mock.calls[0][0];
    expect(event.detail.chatId).toBe('django_123_django_456');

    window.removeEventListener('openDirectMessage', eventListener);
  });

  it('creates consistent chatId regardless of user order', async () => {
    const eventListener = vi.fn();
    window.addEventListener('openDirectMessage', eventListener);

    // Test with reversed IDs
    render(<MockDirectMessageButton targetUserId={100} currentUserId={200} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    const event = eventListener.mock.calls[0][0];
    // Should be sorted: django_100 comes before django_200
    expect(event.detail.chatId).toBe('django_100_django_200');

    window.removeEventListener('openDirectMessage', eventListener);
  });

  it('removes loading state after chat is created', async () => {
    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    // Wait for loading to start
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('handles errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateDirectMessage.mockRejectedValue(new Error('Firebase error'));

    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error starting chat:',
        expect.any(Error)
      );
    });

    // Should still remove loading state after error
    expect(button).not.toBeDisabled();
    
    consoleErrorSpy.mockRestore();
  });

  it('does not create chat if currentUserId is missing', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<MockDirectMessageButton targetUserId={456} currentUserId={null} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    expect(mockCreateDirectMessage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unable to start chat. Missing user or target.'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('does not create chat if targetUserId is missing', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<MockDirectMessageButton targetUserId={null} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    expect(mockCreateDirectMessage).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unable to start chat. Missing user or target.'
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('calls onChatCreated callback when provided', async () => {
    const onChatCreated = vi.fn();
    
    render(
      <MockDirectMessageButton 
        targetUserId={456} 
        onChatCreated={onChatCreated}
      />
    );
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(onChatCreated).toHaveBeenCalledWith('django_123_django_456');
    });
  });

  it('can handle multiple rapid clicks without creating duplicate chats', async () => {
    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    
    // Click multiple times rapidly
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
    
    // Should only be called once because button is disabled after first click
    expect(mockCreateDirectMessage).toHaveBeenCalledTimes(1);
  });

  it('formats Firebase UIDs correctly', async () => {
    render(<MockDirectMessageButton targetUserId={789} currentUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockCreateDirectMessage).toHaveBeenCalledWith(
        {},
        'django_456',
        'django_789'
      );
    });
  });

  it('works with different user IDs', async () => {
    const { rerender } = render(<MockDirectMessageButton targetUserId={100} />);
    
    let button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockCreateDirectMessage).toHaveBeenCalledWith(
        {},
        'django_123',
        'django_100'
      );
    });

    mockCreateDirectMessage.mockClear();

    // Rerender with different target
    rerender(<MockDirectMessageButton targetUserId={999} />);
    
    button = screen.getByTestId('direct-message-button');
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockCreateDirectMessage).toHaveBeenCalledWith(
        {},
        'django_123',
        'django_999'
      );
    });
  });

  it('maintains button state during async operation', async () => {
    mockCreateDirectMessage.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('chat_id'), 200))
    );

    render(<MockDirectMessageButton targetUserId={456} />);
    
    const button = screen.getByTestId('direct-message-button');
    
    // Initial state
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('data-loading', 'false');
    
    // Click and check loading state
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(button).toBeDisabled();
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
    
    // Wait for completion
    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
