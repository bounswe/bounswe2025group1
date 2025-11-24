import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  Notification,
  NotificationCategory,
} from '../../services/notification';

const getCategoryIcon = (category: NotificationCategory): string => {
  switch (category) {
    case 'TASK':
      return 'tasks';
    case 'SOCIAL':
      return 'users';
    case 'FORUM':
      return 'comments';
    case 'WEATHER':
      return 'cloud';
    default:
      return 'bell';
  }
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      const data = await fetchNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [token])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (id: number) => {
    if (!token) return;
    try {
      await markAsRead(id, token);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      await markAllAsRead(token);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert(t('common.error'), t('notifications.markAllError'));
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        { backgroundColor: colors.surface },
        !item.read && styles.unreadCard,
      ]}
      onPress={() => handleMarkAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FontAwesome
          name={getCategoryIcon(item.category) as any}
          size={20}
          color={item.read ? colors.textSecondary : colors.primary}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.message,
            { color: colors.text },
            !item.read && styles.unreadText,
          ]}
        >
          {item.message}
        </Text>
        <View style={styles.metaContainer}>
          <Text style={[styles.category, { color: colors.textSecondary }]}>
            {t(`notifications.categories.${item.category}`)}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {formatTimestamp(item.timestamp)}
          </Text>
        </View>
      </View>
      {!item.read && (
        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>
          {t('notifications.title')}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllButton, { backgroundColor: colors.primary }]}
            onPress={handleMarkAllAsRead}
          >
            <Text style={[styles.markAllText, { color: colors.white }]}>
              {t('notifications.markAllRead')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <Text style={[styles.unreadCountText, { color: colors.textSecondary }]}>
          {unreadCount} {t('notifications.unreadCount')}
        </Text>
      )}

      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="bell-o" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('notifications.noNotifications')}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  unreadCountText: {
    fontSize: 14,
    marginBottom: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  category: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
});
