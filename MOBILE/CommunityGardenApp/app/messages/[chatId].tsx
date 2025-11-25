import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebaseConfig';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  serverTimestamp,
  writeBatch,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
  readBy?: string[];
}

interface UserProfile {
  username: string;
  profile_picture: string | null;
}

export default function ChatDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const flatListRef = useRef<FlatList>(null);

  // Get Firebase UID for the current user
  useEffect(() => {
    if (!user) return;
    const uid = `django_${user.id}`;
    setFirebaseUid(uid);
  }, [user]);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId || !db) {
      setLoading(false);
      return;
    }

    const messagesQuery = query(
      collection(db, 'chats', chatId as string, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const messagesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(messagesList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  // Mark messages as read
  useEffect(() => {
    if (!chatId || !firebaseUid || !db || messages.length === 0) return;

    const markMessagesAsRead = async () => {
      try {
        const batch = writeBatch(db!);
        let batchCount = 0;

        messages.forEach((message) => {
          if (message.senderId === firebaseUid) return;
          if (message.readBy && message.readBy.includes(firebaseUid)) return;

          const messageRef = doc(db!, 'chats', chatId as string, 'messages', message.id);
          const updatedReadBy = message.readBy ? [...message.readBy, firebaseUid] : [firebaseUid];

          batch.update(messageRef, {
            readBy: updatedReadBy,
          });

          batchCount++;
        });

        if (batchCount > 0) {
          await batch.commit();
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markMessagesAsRead();
  }, [chatId, messages, firebaseUid]);

  // Fetch user profiles
  useEffect(() => {
    if (!token) return;

    const fetchUserProfiles = async () => {
      const userIdsToFetch = new Set<string>();

      messages.forEach((message) => {
        if (message.senderId !== firebaseUid) {
          const djangoUserId = message.senderId.replace('django_', '');
          if (!userProfiles[djangoUserId]) {
            userIdsToFetch.add(djangoUserId);
          }
        }
      });

      if (userIdsToFetch.size > 0) {
        const newUserProfiles = { ...userProfiles };

        for (const userId of userIdsToFetch) {
          try {
            const response = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/profile/${userId}/`,
              {
                headers: {
                  Authorization: `Token ${token}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              newUserProfiles[userId] = {
                username: data.username || `User ${userId}`,
                profile_picture: data.profile?.profile_picture || null,
              };
            }
          } catch (error) {
            console.error(`Error fetching profile for user ${userId}:`, error);
            newUserProfiles[userId] = {
              username: `User ${userId}`,
              profile_picture: null,
            };
          }
        }

        setUserProfiles(newUserProfiles);
      }
    };

    fetchUserProfiles();
  }, [messages, firebaseUid, token]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !firebaseUid || !db) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const batch = writeBatch(db!);

      // Add message to messages subcollection
      const messagesRef = collection(db!, 'chats', chatId as string, 'messages');
      await addDoc(messagesRef, {
        text: messageText,
        senderId: firebaseUid,
        createdAt: serverTimestamp(),
        readBy: [firebaseUid],
      });

      // Update chat's lastMessage and updatedAt
      const chatRef = doc(db!, 'chats', chatId as string);
      batch.update(chatRef, {
        lastMessage: {
          text: messageText,
          createdAt: serverTimestamp(),
          senderId: firebaseUid,
        },
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText);
    }
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('messages.justNow');
    if (diffMins < 60) return `${diffMins}${t('messages.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('messages.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('messages.daysAgo')}`;
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderId === firebaseUid;
    const djangoUserId = item.senderId.replace('django_', '');
    const userProfile = userProfiles[djangoUserId] || {};
    const senderUsername = userProfile.username || `User ${djangoUserId}`;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {!isOwn && (
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarText}>
              {senderUsername.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.messageContent}>
          <View
            style={[
              styles.messageBubble,
              {
                backgroundColor: isOwn
                  ? colors.tint
                  : colorScheme === 'dark'
                  ? '#333'
                  : '#e0e0e0',
              },
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isOwn ? '#fff' : colors.text },
              ]}
            >
              {item.text}
            </Text>
          </View>
          <View style={styles.messageFooter}>
            {!isOwn && (
              <Text style={[styles.senderName, { color: colors.tabIconDefault }]}>
                {senderUsername} ·{' '}
              </Text>
            )}
            <Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
              {formatTimestamp(item.createdAt)}
            </Text>
            {isOwn && (
              <Ionicons
                name="checkmark-done"
                size={16}
                color={
                  item.readBy && item.readBy.length > 1
                    ? colors.tint
                    : colors.tabIconDefault
                }
                style={styles.readIcon}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
              color: colors.text,
            },
          ]}
          placeholder={t('messages.typeMessage')}
          placeholderTextColor={colors.tabIconDefault}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: newMessage.trim() ? colors.tint : colors.tabIconDefault,
            },
          ]}
          onPress={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageContent: {
    flex: 1,
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 15,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
  },
  senderName: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  readIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
