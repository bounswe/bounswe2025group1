import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchReports,
  reviewReport,
  Report,
} from '../../services/report';

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getReasonColor = (reason: string): string => {
  switch (reason) {
    case 'abuse':
      return '#f44336';
    case 'spam':
      return '#ff9800';
    case 'illegal':
      return '#9c27b0';
    default:
      return '#757575';
  }
};

export default function ModerationScreen() {
  const { token, user } = useAuth();
  const colors = useAccessibleColors();
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadReports = async () => {
    if (!token) return;
    try {
      const data = await fetchReports(token);
      setReports(data);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      if (error.response?.status === 403) {
        Alert.alert(
          t('common.error'),
          t('moderation.accessDenied') || 'You do not have permission to view reports'
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [token])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleReview = async (reportId: number, isValid: boolean) => {
    if (!token) return;

    const action = isValid
      ? t('moderation.deleteContent') || 'delete this content'
      : t('moderation.dismissReport') || 'dismiss this report';

    Alert.alert(
      t('common.confirm'),
      t('moderation.confirmAction', { action }) || `Are you sure you want to ${action}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: isValid ? 'destructive' : 'default',
          onPress: async () => {
            setReviewingId(reportId);
            try {
              await reviewReport(reportId, { is_valid: isValid }, token);
              Alert.alert(
                t('common.success'),
                t('moderation.reviewSuccess') || 'Report reviewed successfully'
              );
              // Remove the reviewed report from the list
              setReports(prev => prev.filter(r => r.id !== reportId));
            } catch (error) {
              console.error('Error reviewing report:', error);
              Alert.alert(
                t('common.error'),
                t('moderation.reviewError') || 'Failed to review report'
              );
            } finally {
              setReviewingId(null);
            }
          },
        },
      ]
    );
  };

  const renderReport = ({ item }: { item: Report }) => (
    <View style={[styles.reportCard, { backgroundColor: colors.surface }]}>
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <View
            style={[
              styles.reasonBadge,
              { backgroundColor: getReasonColor(item.reason) + '20' },
            ]}
          >
            <Text
              style={[
                styles.reasonText,
                { color: getReasonColor(item.reason) },
              ]}
            >
              {t(`moderation.reasons.${item.reason}`) || item.reason}
            </Text>
          </View>
          <Text style={[styles.contentType, { color: colors.textSecondary }]}>
            {item.content_type === 'forumpost' ? 'Forum Post' : 'Comment'} #{item.object_id}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {formatTimestamp(item.created_at)}
        </Text>
      </View>

      {item.description && (
        <Text style={[styles.description, { color: colors.text }]}>
          {item.description}
        </Text>
      )}

      <View style={styles.reportFooter}>
        <Text style={[styles.reporterText, { color: colors.textSecondary }]}>
          {t('moderation.reportedBy') || 'Reported by user'} #{item.reporter}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.dismissButton,
            { borderColor: colors.border },
          ]}
          onPress={() => handleReview(item.id, false)}
          disabled={reviewingId === item.id}
        >
          {reviewingId === item.id ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={18} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                {t('moderation.dismiss') || 'Dismiss'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.approveButton,
            { backgroundColor: '#f44336' },
          ]}
          onPress={() => handleReview(item.id, true)}
          disabled={reviewingId === item.id}
        >
          {reviewingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                {t('moderation.deleteContent') || 'Delete Content'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const unreviewedCount = reports.filter(r => !r.reviewed).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>
          {t('moderation.title') || 'Moderation'}
        </Text>
        <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
      </View>

      {unreviewedCount > 0 && (
        <Text style={[styles.unreviewedCountText, { color: colors.textSecondary }]}>
          {unreviewedCount} {t('moderation.pendingReports') || 'pending reports'}
        </Text>
      )}

      <FlatList
        data={reports}
        keyExtractor={item => item.id.toString()}
        renderItem={renderReport}
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
              <Ionicons name="shield-checkmark-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('moderation.noReports') || 'No reports to review'}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={reports.length === 0 ? styles.emptyList : undefined}
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
  unreviewedCountText: {
    fontSize: 14,
    marginBottom: 12,
  },
  reportCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportHeaderLeft: {
    flex: 1,
  },
  reasonBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  contentType: {
    fontSize: 12,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  reportFooter: {
    marginBottom: 12,
  },
  reporterText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  dismissButton: {
    borderWidth: 1,
  },
  approveButton: {
    // backgroundColor set inline
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
