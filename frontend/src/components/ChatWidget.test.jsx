import React from 'react';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChatWidget from './ChatWidget';
import { useAuth } from '../contexts/AuthContextUtils';
import * as firestore from 'firebase/firestore';

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  Chat: () => <div data-testid="chat-icon">Chat</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
  ArrowBack: () => <div data-testid="arrow-back-icon">Back</div>,
  Person: () => <div data-testid="person-icon">Person</div>,
  Group: () => <div data-testid="group-icon">Group</div>,
  DoneAll: () => <div data-testid="done-all-icon">Read</div>,
  ExpandLess: () => <div data-testid="expand-less-icon">Collapse</div>,
  ExpandMore: () => <div data-testid="expand-more-icon">Expand</div>,
}));

// Mock AuthContext
vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: vi.fn(),
}));

// Mock Firebase config
vi.mock('../config/firebaseConfig', () => ({
  db: {},
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock Firestore
vi.mock('firebase/firestore', () => {
  return {
    collection: vi.fn((db, ...path) => ({ path })), // Return path to identify collection
    query: vi.fn((ref, ...args) => ({ ref, args })), // Return ref to identify query source
    where: vi.fn((field, op, val) => ({ type: 'where', field, op, val })),
    orderBy: vi.fn((field, dir) => ({ type: 'orderBy', field, dir })),
    onSnapshot: vi.fn(),
    addDoc: vi.fn(),
    doc: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    writeBatch: vi.fn(() => ({
      update: vi.fn(),
      commit: vi.fn(),
    })),
  };
});

describe('ChatWidget Component', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
  };
  const mockToken = 'test-token-123';
  const mockFirebaseUid = 'django_1';

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser, token: mockToken });

    // Default onSnapshot implementation
    firestore.onSnapshot.mockImplementation((q, callback) => {
      callback({ docs: [] });
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders collapsed initially', () => {
    render(<ChatWidget />);
    expect(screen.getByText('chat.header')).toBeInTheDocument();
    expect(screen.queryByText('chat.no_chats')).not.toBeInTheDocument();
  });

  test('expands when clicked', () => {
    render(<ChatWidget />);
    fireEvent.click(screen.getByText('chat.header'));
    expect(screen.getByText('chat.no_chats')).toBeInTheDocument();
  });

  test('displays chats list', async () => {
    const mockChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_1', 'django_2'],
        lastMessage: { text: 'Hello', createdAt: new Date() },
        updatedAt: new Date(),
      },
    ];

    firestore.onSnapshot.mockImplementation((q, callback) => {
      console.log('onSnapshot called with:', JSON.stringify(q, null, 2));
      // Check if it's the chats query
      // The chats query is on 'chats' collection
      // q.ref.path should be ['chats']

      if (q.ref && q.ref.path && q.ref.path[0] === 'chats' && q.ref.path.length === 1) {
        callback({
          docs: mockChats.map(chat => ({
            id: chat.id,
            data: () => chat,
          })),
        });
      } else {
        callback({ docs: [] });
      }
      return vi.fn();
    });

    render(<ChatWidget />);
    fireEvent.click(screen.getByText('chat.header'));

    await waitFor(() => {
      expect(screen.getByText('chat.user_with_id')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });
});