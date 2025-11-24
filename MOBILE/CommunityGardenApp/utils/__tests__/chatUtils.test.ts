import { createDirectMessage } from '../chatUtils';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
  Firestore: jest.fn(),
}));

describe('Chat Utils', () => {
  const mockDb = {} as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDirectMessage', () => {
    it('should return existing chat ID if chat exists', async () => {
      const uid1 = 'user1';
      const uid2 = 'user2';
      const chatId = 'user1_user2';

      (doc as jest.Mock).mockReturnValue('mockChatRef');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
      });

      const result = await createDirectMessage(mockDb, uid1, uid2);

      expect(doc).toHaveBeenCalledWith(mockDb, 'chats', chatId);
      expect(getDoc).toHaveBeenCalledWith('mockChatRef');
      expect(setDoc).not.toHaveBeenCalled();
      expect(result).toBe(chatId);
    });

    it('should create new chat if it does not exist', async () => {
      const uid1 = 'user2';
      const uid2 = 'user1';
      // Should sort UIDs
      const chatId = 'user1_user2';

      (doc as jest.Mock).mockReturnValue('mockChatRef');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });
      (serverTimestamp as jest.Mock).mockReturnValue('mockTimestamp');

      const result = await createDirectMessage(mockDb, uid1, uid2);

      expect(doc).toHaveBeenCalledWith(mockDb, 'chats', chatId);
      expect(getDoc).toHaveBeenCalledWith('mockChatRef');
      expect(setDoc).toHaveBeenCalledWith('mockChatRef', {
        type: 'direct',
        members: [uid1, uid2],
        createdAt: 'mockTimestamp',
        updatedAt: 'mockTimestamp',
        lastMessage: {
          text: 'Chat started',
          createdAt: 'mockTimestamp',
          senderId: 'system',
        },
      });
      expect(result).toBe(chatId);
    });
  });
});
