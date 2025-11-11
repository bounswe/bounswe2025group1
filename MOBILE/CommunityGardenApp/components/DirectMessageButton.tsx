import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../config/firebaseConfig';
import { createDirectMessage } from '../utils/chatUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

interface DirectMessageButtonProps {
  targetUserId: number;
  variant?: 'text' | 'contained' | 'outlined';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

/**
 * Button component to initiate a direct message with a user
 */
const DirectMessageButton: React.FC<DirectMessageButtonProps> = ({
  targetUserId,
  variant = 'outlined',
  size = 'small',
  style,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    if (!user || !targetUserId || !db) {
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

      // Navigate to the chat screen
      router.push(`/messages/${chatId}` as any);
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

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    if (variant === 'contained') {
      baseStyle.push({ backgroundColor: colors.tint });
    } else if (variant === 'outlined') {
      baseStyle.push({
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.tint,
      });
    }

    if (size === 'small') {
      baseStyle.push(styles.small);
    } else if (size === 'large') {
      baseStyle.push(styles.large);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];
    
    if (variant === 'contained') {
      baseStyle.push({ color: '#fff' });
    } else {
      baseStyle.push({ color: colors.tint });
    }

    if (size === 'small') {
      baseStyle.push(styles.smallText);
    } else if (size === 'large') {
      baseStyle.push(styles.largeText);
    }

    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={handleStartChat}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'contained' ? '#fff' : colors.tint} />
      ) : (
        <>
          <Ionicons
            name="chatbubble"
            size={size === 'small' ? 16 : 20}
            color={variant === 'contained' ? '#fff' : colors.tint}
            style={styles.icon}
          />
          <Text style={getTextStyle()}>Message</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  large: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 16,
  },
});

export default DirectMessageButton;
