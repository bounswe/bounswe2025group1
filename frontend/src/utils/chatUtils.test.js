import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firestore functions
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDoc = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ _serverTimestamp: true }));

vi.mock('firebase/firestore', () => ({
  doc: (...args) => mockDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
}));

// Import the function to test after mocking
import { createDirectMessage } from './chatUtils';

describe('chatUtils - createDirectMessage', () => {
  const mockDb = { name: 'mock-firestore-db' };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates consistent chat ID with sorted UIDs', async () => {
    mockDoc.mockReturnValue({ id: 'django_123_django_456' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const uid1 = 'django_456';
    const uid2 = 'django_123';
    
    const chatId = await createDirectMessage(mockDb, uid1, uid2);
    
    // Should sort UIDs alphabetically
    expect(chatId).toBe('django_123_django_456');
  });

  it('returns the same chat ID regardless of parameter order', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const chatId1 = await createDirectMessage(mockDb, 'django_100', 'django_200');
    const chatId2 = await createDirectMessage(mockDb, 'django_200', 'django_100');
    
    expect(chatId1).toBe(chatId2);
    expect(chatId1).toBe('django_100_django_200');
  });

  it('calls doc with correct parameters', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'chats', 'django_123_django_456');
  });

  it('checks if chat already exists', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    expect(mockGetDoc).toHaveBeenCalledWith(mockChatRef);
  });

  it('creates new chat when it does not exist', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    expect(mockSetDoc).toHaveBeenCalledWith(
      mockChatRef,
      expect.objectContaining({
        type: 'direct',
        members: ['django_123', 'django_456'],
        createdAt: { _serverTimestamp: true },
        updatedAt: { _serverTimestamp: true },
        lastMessage: expect.objectContaining({
          text: 'Chat started',
          createdAt: { _serverTimestamp: true },
          senderId: 'system'
        })
      })
    );
  });

  it('does not create chat if it already exists', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => true });

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('returns chat ID even when chat already exists', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const chatId = await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    expect(chatId).toBe('django_123_django_456');
  });

  it('sets correct chat type as direct', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    expect(setDocCall.type).toBe('direct');
  });

  it('includes both members in the chat', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_789', 'django_321');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    expect(setDocCall.members).toContain('django_789');
    expect(setDocCall.members).toContain('django_321');
    expect(setDocCall.members).toHaveLength(2);
  });

  it('uses serverTimestamp for createdAt and updatedAt', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    expect(setDocCall.createdAt).toEqual({ _serverTimestamp: true });
    expect(setDocCall.updatedAt).toEqual({ _serverTimestamp: true });
  });

  it('sets initial lastMessage correctly', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    expect(setDocCall.lastMessage).toEqual({
      text: 'Chat started',
      createdAt: { _serverTimestamp: true },
      senderId: 'system'
    });
  });

  it('handles Firebase errors gracefully', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockRejectedValue(new Error('Firebase connection error'));

    await expect(
      createDirectMessage(mockDb, 'django_123', 'django_456')
    ).rejects.toThrow('Firebase connection error');
  });

  it('handles setDoc errors when creating new chat', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockRejectedValue(new Error('Permission denied'));

    await expect(
      createDirectMessage(mockDb, 'django_123', 'django_456')
    ).rejects.toThrow('Permission denied');
  });

  it('works with numeric user IDs in Firebase UID format', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const uid1 = 'django_999';
    const uid2 = 'django_111';
    
    const chatId = await createDirectMessage(mockDb, uid1, uid2);
    
    expect(chatId).toBe('django_111_django_999');
  });

  it('handles identical UIDs by creating consistent ID', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const uid = 'django_123';
    
    const chatId = await createDirectMessage(mockDb, uid, uid);
    
    // Even with same UID, should create predictable ID
    expect(chatId).toBe('django_123_django_123');
  });

  it('preserves member order in members array as passed', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_999', 'django_111');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    // Members array should contain both UIDs as passed (not necessarily sorted)
    expect(setDocCall.members).toEqual(['django_999', 'django_111']);
  });

  it('creates chat with correct document structure', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    const setDocCall = mockSetDoc.mock.calls[0][1];
    
    // Verify all required fields are present
    expect(setDocCall).toHaveProperty('type');
    expect(setDocCall).toHaveProperty('members');
    expect(setDocCall).toHaveProperty('createdAt');
    expect(setDocCall).toHaveProperty('updatedAt');
    expect(setDocCall).toHaveProperty('lastMessage');
    expect(setDocCall.lastMessage).toHaveProperty('text');
    expect(setDocCall.lastMessage).toHaveProperty('createdAt');
    expect(setDocCall.lastMessage).toHaveProperty('senderId');
  });

  it('calls functions in correct order', async () => {
    const mockChatRef = { id: 'chat_ref' };
    mockDoc.mockReturnValue(mockChatRef);
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    await createDirectMessage(mockDb, 'django_123', 'django_456');
    
    // Verify call order
    expect(mockDoc).toHaveBeenCalledBefore(mockGetDoc);
    expect(mockGetDoc).toHaveBeenCalledBefore(mockSetDoc);
  });

  it('returns correct chat ID format', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const chatId = await createDirectMessage(mockDb, 'django_abc', 'django_xyz');
    
    // Chat ID should follow the pattern: sortedUid1_sortedUid2
    expect(chatId).toMatch(/^django_[a-z]+_django_[a-z]+$/);
    expect(chatId).toBe('django_abc_django_xyz');
  });

  it('handles UIDs with special characters', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => false });
    mockSetDoc.mockResolvedValue(undefined);

    const uid1 = 'django_user-123';
    const uid2 = 'django_user-456';
    
    const chatId = await createDirectMessage(mockDb, uid1, uid2);
    
    expect(chatId).toBe('django_user-123_django_user-456');
  });

  it('maintains consistency across multiple calls with same users', async () => {
    mockDoc.mockReturnValue({ id: 'chat_ref' });
    mockGetDoc.mockResolvedValue({ exists: () => true });

    const chatId1 = await createDirectMessage(mockDb, 'django_123', 'django_456');
    const chatId2 = await createDirectMessage(mockDb, 'django_123', 'django_456');
    const chatId3 = await createDirectMessage(mockDb, 'django_456', 'django_123');
    
    expect(chatId1).toBe(chatId2);
    expect(chatId2).toBe(chatId3);
  });
});
