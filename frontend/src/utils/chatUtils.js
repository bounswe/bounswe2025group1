/**
 * Chat utility functions for direct messaging
 */
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Create or get a direct message chat between two users
 * @param {Object} db - Firestore database instance
 * @param {string} uid1 - First user's Firebase UID
 * @param {string} uid2 - Second user's Firebase UID
 * @returns {Promise<string>} The chat ID
 */
export const createDirectMessage = async (db, uid1, uid2) => {
  // Sort UIDs to ensure consistent chat ID regardless of who initiates
  const [sortedUid1, sortedUid2] = [uid1, uid2].sort();
  const chatId = `${sortedUid1}_${sortedUid2}`;
  
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  
  // If chat doesn't exist, create it
  if (!chatDoc.exists()) {
    await setDoc(chatRef, {
      type: 'direct',
      members: [uid1, uid2],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: {
        text: 'Chat started',
        createdAt: serverTimestamp(),
        senderId: 'system'
      }
    });
  }
  
  return chatId;
};
