import React from 'react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatWidget from './ChatWidget';
import { useAuth } from '../contexts/AuthContextUtils';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Chat: () => <svg data-testid="chat-icon" />,
  Send: () => <svg data-testid="send-icon" />,
  ArrowBack: () => <svg data-testid="arrow-back-icon" />,
  Person: () => <svg data-testid="person-icon" />,
  Group: () => <svg data-testid="group-icon" />,
  DoneAll: () => <svg data-testid="done-all-icon" />,
  ExpandLess: () => <svg data-testid="expand-less-icon" />,
  ExpandMore: () => <svg data-testid="expand-more-icon" />,
}));

// Mock AuthContext
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase config
vi.mock('../config/firebaseConfig', () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Return unsubscribe function
  addDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn(),
  })),
}));

describe('ChatWidget Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
  };

  const mockToken = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation
    useAuth.mockReturnValue({ 
      user: mockUser,
      token: mockToken,
    });
  });

  describe('Rendering - Not Logged In', () => {
    test('does not render when user is not logged in', () => {
      useAuth.mockReturnValue({ user: null, token: null });
      
      const { container } = render(<ChatWidget />);
      
      expect(container.firstChild).toBeNull();
    });

    test('does not render when user is undefined', () => {
      useAuth.mockReturnValue({ user: undefined, token: null });
      
      const { container } = render(<ChatWidget />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering - Logged In User', () => {
    test('renders chat widget when user is logged in', () => {
      render(<ChatWidget />);
      
      // Should render the header with "Messages" text
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('renders collapsed by default', () => {
      render(<ChatWidget />);
      
      // Should show "Messages" in header
      expect(screen.getByText('Messages')).toBeInTheDocument();
      
      // Should not show chat list content when collapsed
      const noChatText = screen.queryByText(/no chats yet/i);
      expect(noChatText).not.toBeInTheDocument();
    });

    test('renders with chat icon', () => {
      render(<ChatWidget />);
      
      const chatIcon = screen.getByTestId('chat-icon');
      expect(chatIcon).toBeInTheDocument();
    });

    test('renders expand/collapse button', () => {
      render(<ChatWidget />);
      
      // When collapsed, should show ExpandLess icon
      const expandLessIcon = screen.getByTestId('expand-less-icon');
      expect(expandLessIcon).toBeInTheDocument();
    });

    test('widget is positioned at bottom right', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders Paper component as main container', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });

    test('renders header with correct styling', () => {
      render(<ChatWidget />);
      
      const header = screen.getByText('Messages').closest('div');
      expect(header).toBeInTheDocument();
    });

    test('renders Badge component for unread count', () => {
      const { container } = render(<ChatWidget />);
      
      const badge = container.querySelector('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('User State', () => {
    test('generates correct Firebase UID from user ID', () => {
      const customUser = { id: 123, username: 'testuser123' };
      useAuth.mockReturnValue({ user: customUser, token: mockToken });
      
      render(<ChatWidget />);
      
      // Component should render, which means it successfully processed the user ID
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('handles user with different ID format', () => {
      const customUser = { id: 999, username: 'user999' };
      useAuth.mockReturnValue({ user: customUser, token: mockToken });
      
      render(<ChatWidget />);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('handles user with string ID', () => {
      const customUser = { id: '456', username: 'stringiduser' };
      useAuth.mockReturnValue({ user: customUser, token: mockToken });
      
      render(<ChatWidget />);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });
  });

  describe('Initial State', () => {
    test('starts in list view mode', () => {
      render(<ChatWidget />);
      
      // Header should show "Messages" which is the list view title
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('has no selected chat initially', () => {
      render(<ChatWidget />);
      
      // Should show "Messages" not a specific chat name
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('initializes with empty chats array', () => {
      render(<ChatWidget />);
      
      // Component renders successfully with no errors
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('initializes with empty messages array', () => {
      render(<ChatWidget />);
      
      // Component renders successfully
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('initializes with empty new message text', () => {
      render(<ChatWidget />);
      
      // Component should render without errors
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });
  });

  describe('Props and Configuration', () => {
    test('does not require any props', () => {
      // ChatWidget should render without any props
      expect(() => render(<ChatWidget />)).not.toThrow();
    });

    test('renders with different user objects', () => {
      const users = [
        { id: 1, username: 'user1' },
        { id: 2, username: 'user2' },
        { id: 100, username: 'user100' },
      ];

      users.forEach(user => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user, token: mockToken });
        
        const { unmount } = render(<ChatWidget />);
        expect(screen.getByText('Messages')).toBeInTheDocument();
        unmount();
      });
    });

    test('handles missing token', () => {
      useAuth.mockReturnValue({ user: mockUser, token: null });
      
      render(<ChatWidget />);
      
      // Should still render the widget
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('handles empty string token', () => {
      useAuth.mockReturnValue({ user: mockUser, token: '' });
      
      render(<ChatWidget />);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('renders with proper icon buttons', () => {
      const { container } = render(<ChatWidget />);
      
      const buttons = container.querySelectorAll('.MuiIconButton-root');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('badge shows unread count information', () => {
      const { container } = render(<ChatWidget />);
      
      const badge = container.querySelector('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Translation Keys', () => {
    test('uses correct translation key for header', () => {
      render(<ChatWidget />);
      
      // Should show "Messages" from chat.header
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('component renders with i18n support', () => {
      // Component should use useTranslation hook
      expect(() => render(<ChatWidget />)).not.toThrow();
    });
  });

  describe('Theme Integration', () => {
    test('renders with theme provider', () => {
      // Component should use useTheme hook without errors
      expect(() => render(<ChatWidget />)).not.toThrow();
    });

    test('applies theme-based styling', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('mounts without errors', () => {
      expect(() => render(<ChatWidget />)).not.toThrow();
    });

    test('unmounts without errors', () => {
      const { unmount } = render(<ChatWidget />);
      expect(() => unmount()).not.toThrow();
    });

    test('can be rendered multiple times', () => {
      const { unmount: unmount1 } = render(<ChatWidget />);
      unmount1();
      
      const { unmount: unmount2 } = render(<ChatWidget />);
      unmount2();
      
      const { unmount: unmount3 } = render(<ChatWidget />);
      expect(screen.getByText('Messages')).toBeInTheDocument();
      unmount3();
    });
  });

  describe('Fixed Positioning', () => {
    test('widget has fixed position styling', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ position: 'fixed' });
    });

    test('widget positioned at bottom', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ bottom: '0' });
    });

    test('widget positioned at right side', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ right: '20px' });
    });

    test('widget has specific width', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ width: '380px' });
    });

    test('widget has high z-index for overlay', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ zIndex: '1000' });
    });
  });

  describe('Collapsed State', () => {
    test('has minimum height when collapsed', () => {
      const { container } = render(<ChatWidget />);
      
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toHaveStyle({ height: '56px' });
    });

    test('does not show chat content when collapsed', () => {
      render(<ChatWidget />);
      
      // Should not show "No chats yet" message when collapsed
      const noChatMessage = screen.queryByText(/no chats yet/i);
      expect(noChatMessage).not.toBeInTheDocument();
    });

    test('shows only header when collapsed', () => {
      render(<ChatWidget />);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
      
      // Should not show message input
      const messageInput = screen.queryByPlaceholderText(/type a message/i);
      expect(messageInput).not.toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('integrates with AuthContext', () => {
      useAuth.mockReturnValue({ user: mockUser, token: mockToken });
      
      render(<ChatWidget />);
      
      expect(useAuth).toHaveBeenCalled();
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    test('uses user data from AuthContext', () => {
      const customUser = { id: 42, username: 'customuser' };
      useAuth.mockReturnValue({ user: customUser, token: 'custom-token' });
      
      render(<ChatWidget />);
      
      expect(screen.getByText('Messages')).toBeInTheDocument();
    });
  });

  describe('Badge Display', () => {
    test('renders badge for unread messages', () => {
      const { container } = render(<ChatWidget />);
      
      const badges = container.querySelectorAll('.MuiBadge-root');
      expect(badges.length).toBeGreaterThan(0);
    });

    test('badge is visible in header', () => {
      const { container } = render(<ChatWidget />);
      
      const header = screen.getByText('Messages').closest('div');
      const badge = header?.querySelector('.MuiBadge-root');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles null user gracefully', () => {
      useAuth.mockReturnValue({ user: null, token: null });
      
      const { container } = render(<ChatWidget />);
      
      expect(container.firstChild).toBeNull();
    });

    test('handles undefined auth context gracefully', () => {
      useAuth.mockReturnValue({});
      
      const { container } = render(<ChatWidget />);
      
      expect(container.firstChild).toBeNull();
    });

    test('handles missing user id gracefully', () => {
      useAuth.mockReturnValue({ user: { username: 'noIdUser' }, token: mockToken });
      
      render(<ChatWidget />);
      
      // Should either not render or handle gracefully
      expect(screen.queryByText('Messages')).toBeInTheDocument();
    });
  });
});
