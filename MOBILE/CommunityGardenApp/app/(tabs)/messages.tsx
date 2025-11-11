import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebaseConfig';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from 'firebase/firestore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

interface Chat {
  id: string;
  type: 'direct' | 'group';
  members: string[];
  groupName?: string;
  lastMessage?: {
    text: string;
    createdAt: any;
    senderId: string;
  };
  updatedAt: any;
}

interface UserProfile {
  username: string;
  profile_picture: string | null;
}

export default function MessagesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firebaseUid, setFirebaseUid] = useState<string | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Get Firebase UID for the current user
  useEffect(() => {
    if (!user) return;
    const uid = `django_${user.id}`;
    setFirebaseUid(uid);
  }, [user]);

  // Subscribe to chats list
  useEffect(() => {
    if (!firebaseUid || !db) {
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('members', 'array-contains', firebaseUid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const chatsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chat[];
        setChats(chatsList);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error fetching chats:', error);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUid]);

  // Calculate unread counts for all chats
  useEffect(() => {
    if (!firebaseUid || !db || chats.length === 0) return;

    const unsubscribes: (() => void)[] = [];

    chats.forEach((chat) => {
      const messagesQuery = query(
        collection(db!, 'chats', chat.id, 'messages'),
        where('senderId', '!=', firebaseUid)
      );

      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const unreadCount = snapshot.docs.filter((doc) => {
            const data = doc.data();
            return !data.readBy || !data.readBy.includes(firebaseUid);
          }).length;

          setUnreadCounts((prev) => ({
            ...prev,
            [chat.id]: unreadCount,
          }));
        },
        (error) => {
          console.error(`Error fetching unread count for chat ${chat.id}:`, error);
        }
      );

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [chats, firebaseUid]);

  // Fetch user profiles
  useEffect(() => {
    if (!token) return;

    const fetchUserProfiles = async () => {
      const userIdsToFetch = new Set<string>();

      chats.forEach((chat) => {
        if (chat.type === 'direct') {
          const otherUserId = chat.members.find((id) => id !== firebaseUid);
          if (otherUserId) {
            const djangoUserId = otherUserId.replace('django_', '');
            if (!userProfiles[djangoUserId]) {
              userIdsToFetch.add(djangoUserId);
            }
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
  }, [chats, firebaseUid, token]);

  const getChatDisplayName = (chat: Chat): string => {
    if (chat.type === 'group') {
      return chat.groupName || 'Garden Chat';
    }
    const otherUserId = chat.members.find((id) => id !== firebaseUid);
    if (!otherUserId) return 'Direct Message';

    const djangoUserId = otherUserId.replace('django_', '');
    return userProfiles[djangoUserId]?.username || `User ${djangoUserId}`;
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  const renderChatItem = ({ item }: { item: Chat }) => {
    const unreadCount = unreadCounts[item.id] || 0;

    return (
      <TouchableOpacity
        style={[styles.chatItem, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/messages/${item.id}` as any)}
      >
        <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
          {item.type === 'group' ? (
            <Ionicons name="people" size={24} color="#fff" />
          ) : (
            <Ionicons name="person" size={24} color="#fff" />
          )}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: colors.text }]} numberOfLines={1}>
              {getChatDisplayName(item)}
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: '#d32f2f' }]}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.lastMessageContainer}>
            <Text
              style={[styles.lastMessage, { color: colors.tabIconDefault }]}
              numberOfLines={1}
            >
              {item.lastMessage?.text || t('messages.noMessages')}
            </Text>
            <Text style={[styles.timestamp, { color: colors.tabIconDefault }]}>
              {formatTimestamp(item.lastMessage?.createdAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('messages.title')}
        </Text>
      </View>
      {chats.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
            {t('messages.noChats')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.tabIconDefault }]}>
            {t('messages.noChatsDescription')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.tint]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
