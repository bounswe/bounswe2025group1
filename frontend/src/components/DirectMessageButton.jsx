import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContextUtils';
import { db } from '../config/firebaseConfig';
import { createDirectMessage } from '../utils/chatUtils';

/**
 * Button component to initiate a direct message with a user
 * @param {Object} props
 * @param {number} props.targetUserId - Django user ID of the target user
 * @param {string} props.variant - Button variant (text, contained, outlined)
 * @param {string} props.size - Button size
 */
const DirectMessageButton = ({ targetUserId, variant = 'outlined', size = 'small', sx }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user || !targetUserId) {
      console.error('Unable to start chat. Missing user or target.');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase UIDs (format: django_{userId})
      const currentFirebaseUid = `django_${user.id}`;
      const targetFirebaseUid = `django_${targetUserId}`;

      // Create or get the direct message chat
      const chatId = await createDirectMessage(db, currentFirebaseUid, targetFirebaseUid);

      // Dispatch custom event to open chat widget with this chat
      window.dispatchEvent(new CustomEvent('openDirectMessage', { 
        detail: { chatId } 
      }));
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if trying to message yourself
  if (user && user.id === targetUserId) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      startIcon={loading ? <CircularProgress size={16} /> : <ChatIcon />}
      onClick={handleStartChat}
      disabled={loading}
      sx={sx}
    >
      Message
    </Button>
  );
};

export default DirectMessageButton;
