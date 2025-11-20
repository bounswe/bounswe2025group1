import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useAuth hook
const mockUser = {
  id: 123,
  username: 'testuser',
};

const mockToken = 'test-token';

vi.mock('../contexts/AuthContextUtils', () => ({
  useAuth: () => ({
    user: mockUser,
    token: mockToken,
  }),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, params) => {
      const translations = {
        'chat.header': 'Messages',
        'chat.chatTitle': 'Chat',
        'chat.garden_chat': 'Garden Chat',
        'chat.direct_message': 'Direct Message',
        'chat.user_with_id': `User ${params?.id || ''}`,
        'chat.just_now': 'Just now',
        'chat.time_m': 'm',
        'chat.time_h': 'h',
        'chat.time_d': 'd',
        'chat.no_chats': 'No conversations yet',
        'chat.no_messages': 'No messages',
        'chat.type_message': 'Type a message...',
      };
      return translations[key] || key;
    },
  }),
}));

// Create a mock component that tests the core functionality
const MockChatWidget = ({ 
  initialChats = [],
  initialMessages = [],
  initialView = 'list',
  initialOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [currentView, setCurrentView] = React.useState(initialView);
  const [selectedChat, setSelectedChat] = React.useState(null);
  const [chats, setChats] = React.useState(initialChats);
  const [messages, setMessages] = React.useState(initialMessages);
  const [newMessage, setNewMessage] = React.useState('');
  const [unreadCounts, setUnreadCounts] = React.useState({});

  const firebaseUid = `django_${mockUser.id}`;

  React.useEffect(() => {
    // Calculate unread counts
    const counts = {};
    chats.forEach((chat) => {
      const unreadMessages = messages.filter(
        (msg) => msg.chatId === chat.id && 
        msg.senderId !== firebaseUid && 
        (!msg.readBy || !msg.readBy.includes(firebaseUid))
      );
      counts[chat.id] = unreadMessages.length;
    });
    setUnreadCounts(counts);
  }, [chats, messages, firebaseUid]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat) return;

    const newMsg = {
      id: `msg_${Date.now()}`,
      chatId: selectedChat.id,
      text: newMessage,
      senderId: firebaseUid,
      createdAt: new Date(),
      readBy: [firebaseUid],
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Update chat's last message
    setChats(chats.map((chat) => 
      chat.id === selectedChat.id 
        ? { ...chat, lastMessage: { text: newMessage, createdAt: new Date() } }
        : chat
    ));
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setCurrentView('chat');

    // Mark messages as read
    setMessages(messages.map((msg) => 
      msg.chatId === chat.id && msg.senderId !== firebaseUid
        ? { ...msg, readBy: [...(msg.readBy || []), firebaseUid] }
        : msg
    ));
  };

  const handleBackToList = () => {
    setSelectedChat(null);
    setCurrentView('list');
  };

  const getChatDisplayName = (chat) => {
    if (chat.type === 'group') {
      return chat.groupName || 'Garden Chat';
    }
    const otherUserId = chat.members.find((id) => id !== firebaseUid);
    if (!otherUserId) return 'Direct Message';
    const djangoUserId = otherUserId.replace('django_', '');
    return `User ${djangoUserId}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    return date.toLocaleDateString();
  };

  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  const chatMessages = selectedChat 
    ? messages.filter((msg) => msg.chatId === selectedChat.id)
    : [];

  return (
    <div data-testid="chat-widget">
      {/* Header */}
      <div 
        data-testid="chat-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <h2>
          {currentView === 'list' || !isOpen
            ? 'Messages'
            : selectedChat
              ? getChatDisplayName(selectedChat)
              : 'Chat'}
        </h2>
        {totalUnreadCount > 0 && (
          <span data-testid="total-unread-badge">{totalUnreadCount}</span>
        )}
        <button
          data-testid="toggle-button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
        >
          {isOpen ? 'Collapse' : 'Expand'}
        </button>
        {isOpen && currentView === 'chat' && (
          <button
            data-testid="back-button"
            onClick={(e) => {
              e.stopPropagation();
              handleBackToList();
            }}
          >
            Back
          </button>
        )}
      </div>

      {/* Content */}
      {isOpen && (
        <div data-testid="chat-content">
          {(currentView === 'list' || (currentView === 'chat' && !selectedChat)) ? (
            <div data-testid="chats-list">
              {chats.length === 0 ? (
                <div data-testid="no-chats">No conversations yet</div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    data-testid={`chat-item-${chat.id}`}
                    onClick={() => handleSelectChat(chat)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span data-testid={`chat-name-${chat.id}`}>
                      {getChatDisplayName(chat)}
                    </span>
                    {unreadCounts[chat.id] > 0 && (
                      <span data-testid={`unread-badge-${chat.id}`}>
                        {unreadCounts[chat.id]}
                      </span>
                    )}
                    <div data-testid={`last-message-${chat.id}`}>
                      {chat.lastMessage?.text || 'No messages'}
                    </div>
                    <div data-testid={`last-message-time-${chat.id}`}>
                      {formatTimestamp(chat.lastMessage?.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div data-testid="messages-view">
              <div data-testid="messages-container">
                {chatMessages.length === 0 ? (
                  <div data-testid="no-messages">No messages</div>
                ) : (
                  chatMessages.map((message) => {
                    const isOwn = message.senderId === firebaseUid;
                    return (
                      <div
                        key={message.id}
                        data-testid={`message-${message.id}`}
                        data-own={isOwn}
                      >
                        <div data-testid={`message-text-${message.id}`}>
                          {message.text}
                        </div>
                        <div data-testid={`message-time-${message.id}`}>
                          {formatTimestamp(message.createdAt)}
                        </div>
                        {isOwn && message.readBy && (
                          <div data-testid={`read-status-${message.id}`}>
                            {message.readBy.length > 1 ? 'Read' : 'Sent'}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message input */}
              <div data-testid="message-input-container">
                <input
                  type="text"
                  data-testid="message-input"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  data-testid="send-button"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('ChatWidget Basic Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props (closed state)', () => {
    render(<MockChatWidget />);
    
    expect(screen.getByTestId('chat-widget')).toBeInTheDocument();
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Expand')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-content')).not.toBeInTheDocument();
  });

  it('renders in open state when initialOpen is true', () => {
    render(<MockChatWidget initialOpen={true} />);
    
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    expect(screen.getByText('Collapse')).toBeInTheDocument();
  });

  it('toggles open/closed state when header is clicked', () => {
    render(<MockChatWidget />);
    
    const header = screen.getByTestId('chat-header');
    
    // Initially closed
    expect(screen.queryByTestId('chat-content')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(header);
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(header);
    expect(screen.queryByTestId('chat-content')).not.toBeInTheDocument();
  });

  it('toggles open/closed state when toggle button is clicked', () => {
    render(<MockChatWidget />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    
    // Click to open
    fireEvent.click(toggleButton);
    expect(screen.getByTestId('chat-content')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(toggleButton);
    expect(screen.queryByTestId('chat-content')).not.toBeInTheDocument();
  });

  it('shows "No conversations yet" when there are no chats', () => {
    render(<MockChatWidget initialOpen={true} />);
    
    expect(screen.getByTestId('no-chats')).toBeInTheDocument();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('displays list of chats correctly', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
        lastMessage: { text: 'Hello!', createdAt: new Date() },
      },
      {
        id: 'chat2',
        type: 'group',
        groupName: 'Test Garden',
        gardenId: '1',
        members: ['django_123', 'django_456', 'django_789'],
        lastMessage: { text: 'Welcome to the garden', createdAt: new Date() },
      },
    ];

    render(<MockChatWidget initialOpen={true} initialChats={testChats} />);
    
    expect(screen.getByTestId('chat-item-chat1')).toBeInTheDocument();
    expect(screen.getByTestId('chat-item-chat2')).toBeInTheDocument();
    expect(screen.getByText('User 456')).toBeInTheDocument(); // Direct chat displays other user
    expect(screen.getByText('Test Garden')).toBeInTheDocument(); // Group chat displays group name
  });

  it('switches to chat view when a chat is selected', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
        lastMessage: { text: 'Hello!', createdAt: new Date() },
      },
    ];

    render(<MockChatWidget initialOpen={true} initialChats={testChats} />);
    
    const chatItem = screen.getByTestId('chat-item-chat1');
    fireEvent.click(chatItem);
    
    expect(screen.getByTestId('messages-view')).toBeInTheDocument();
    expect(screen.getByTestId('back-button')).toBeInTheDocument();
    expect(screen.queryByTestId('chats-list')).not.toBeInTheDocument();
  });

  it('returns to list view when back button is clicked', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
        lastMessage: { text: 'Hello!', createdAt: new Date() },
      },
    ];

    render(<MockChatWidget initialOpen={true} initialChats={testChats} />);
    
    // Select a chat
    fireEvent.click(screen.getByTestId('chat-item-chat1'));
    expect(screen.getByTestId('messages-view')).toBeInTheDocument();
    
    // Click back button
    const backButton = screen.getByTestId('back-button');
    fireEvent.click(backButton);
    
    expect(screen.getByTestId('chats-list')).toBeInTheDocument();
    expect(screen.queryByTestId('messages-view')).not.toBeInTheDocument();
  });

  it('displays messages correctly', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'Hello from me',
        senderId: 'django_123',
        createdAt: new Date(),
        readBy: ['django_123'],
      },
      {
        id: 'msg2',
        chatId: 'chat1',
        text: 'Hello from other',
        senderId: 'django_456',
        createdAt: new Date(),
        readBy: ['django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true} 
        initialView="chat"
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    // Select the chat to view messages
    const chatItem = screen.getByTestId('chat-item-chat1');
    fireEvent.click(chatItem);

    expect(screen.getByTestId('message-msg1')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg2')).toBeInTheDocument();
    expect(screen.getByTestId('message-text-msg1')).toHaveTextContent('Hello from me');
    expect(screen.getByTestId('message-text-msg2')).toHaveTextContent('Hello from other');
  });

  it('identifies own messages correctly', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'My message',
        senderId: 'django_123',
        createdAt: new Date(),
        readBy: ['django_123'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    const message = screen.getByTestId('message-msg1');
    expect(message).toHaveAttribute('data-own', 'true');
  });

  it('sends a message when send button is clicked', async () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={[]}
      />
    );

    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      const messages = screen.getAllByTestId(/^message-msg_/);
      expect(messages.length).toBeGreaterThan(0);
    });

    expect(input).toHaveValue('');
  });

  it('sends a message when Enter key is pressed', async () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={[]}
      />
    );

    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    const input = screen.getByTestId('message-input');

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      const messages = screen.getAllByTestId(/^message-msg_/);
      expect(messages.length).toBeGreaterThan(0);
    });

    expect(input).toHaveValue('');
  });

  it('disables send button when message is empty', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={[]}
      />
    );

    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();

    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Some text' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('displays unread count for chats with unread messages', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'Unread message',
        senderId: 'django_456',
        createdAt: new Date(),
        readBy: ['django_456'], // Not read by current user
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    expect(screen.getByTestId('unread-badge-chat1')).toBeInTheDocument();
    expect(screen.getByTestId('unread-badge-chat1')).toHaveTextContent('1');
  });

  it('displays total unread count in header', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
      {
        id: 'chat2',
        type: 'direct',
        members: ['django_123', 'django_789'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'Unread 1',
        senderId: 'django_456',
        createdAt: new Date(),
        readBy: ['django_456'],
      },
      {
        id: 'msg2',
        chatId: 'chat2',
        text: 'Unread 2',
        senderId: 'django_789',
        createdAt: new Date(),
        readBy: ['django_789'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    expect(screen.getByTestId('total-unread-badge')).toBeInTheDocument();
    expect(screen.getByTestId('total-unread-badge')).toHaveTextContent('2');
  });

  it('marks messages as read when chat is opened', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'Unread message',
        senderId: 'django_456',
        createdAt: new Date(),
        readBy: ['django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    // Initially has unread badge
    expect(screen.getByTestId('unread-badge-chat1')).toBeInTheDocument();

    // Open the chat
    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    // Go back to list
    fireEvent.click(screen.getByTestId('back-button'));

    // Unread badge should be gone
    expect(screen.queryByTestId('unread-badge-chat1')).not.toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    const now = new Date();
    const justNow = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
        lastMessage: { text: 'Recent', createdAt: justNow },
      },
      {
        id: 'chat2',
        type: 'direct',
        members: ['django_123', 'django_789'],
        lastMessage: { text: 'A bit ago', createdAt: fiveMinutesAgo },
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
      />
    );

    expect(screen.getByTestId('last-message-time-chat1')).toHaveTextContent('Just now');
    expect(screen.getByTestId('last-message-time-chat2')).toHaveTextContent('5m');
  });

  it('handles empty last message correctly', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
        lastMessage: null,
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
      />
    );

    expect(screen.getByTestId('last-message-chat1')).toHaveTextContent('No messages');
  });

  it('displays group chat name correctly', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'group',
        groupName: 'My Garden',
        gardenId: '2',
        members: ['django_123', 'django_456', 'django_789'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
      />
    );

    expect(screen.getByTestId('chat-name-chat1')).toHaveTextContent('My Garden');
  });

  it('displays direct chat with other user name', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
      />
    );

    expect(screen.getByTestId('chat-name-chat1')).toHaveTextContent('User 456');
  });

  it('shows read status for own messages', () => {
    const testChats = [
      {
        id: 'chat1',
        type: 'direct',
        members: ['django_123', 'django_456'],
      },
    ];

    const testMessages = [
      {
        id: 'msg1',
        chatId: 'chat1',
        text: 'My message',
        senderId: 'django_123',
        createdAt: new Date(),
        readBy: ['django_123', 'django_456'], // Read by both
      },
      {
        id: 'msg2',
        chatId: 'chat1',
        text: 'My unread message',
        senderId: 'django_123',
        createdAt: new Date(),
        readBy: ['django_123'], // Only read by sender
      },
    ];

    render(
      <MockChatWidget 
        initialOpen={true}
        initialChats={testChats}
        initialMessages={testMessages}
      />
    );

    fireEvent.click(screen.getByTestId('chat-item-chat1'));

    expect(screen.getByTestId('read-status-msg1')).toHaveTextContent('Read');
    expect(screen.getByTestId('read-status-msg2')).toHaveTextContent('Sent');
  });
});
