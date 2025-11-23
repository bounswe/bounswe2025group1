import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import {
  GardenEvent,
  AttendanceStatus,
  voteAttendance,
  formatEventDate,
  formatEventTime,
  isEventPast,
} from '../../services/event';

interface EventCardProps {
  event: GardenEvent;
  onVote?: (eventId: number, status: AttendanceStatus) => void;
  onPress?: (event: GardenEvent) => void;
  onEdit?: (event: GardenEvent) => void;
  onDelete?: (event: GardenEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onVote,
  onPress,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}) => {
  const { t } = useTranslation();
  const colors = useAccessibleColors();
  const isPast = isEventPast(event.start_at);

  const handleVote = async (status: AttendanceStatus) => {
    try {
      await voteAttendance(event.id, status);
      onVote?.(event.id, status);
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert(
        t('common.error'),
        t('events.voteError') || 'Failed to update attendance'
      );
    }
  };

  const getStatusButtonStyle = (status: AttendanceStatus) => {
    const isSelected = event.my_attendance === status;
    let backgroundColor = colors.surface;
    let textColor = colors.text;

    if (isSelected) {
      switch (status) {
        case 'GOING':
          backgroundColor = '#4CAF50';
          textColor = '#fff';
          break;
        case 'MAYBE':
          backgroundColor = '#FF9800';
          textColor = '#fff';
          break;
        case 'NOT_GOING':
          backgroundColor = '#f44336';
          textColor = '#fff';
          break;
      }
    }

    return { backgroundColor, textColor };
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: isPast ? 0.6 : 1,
        },
      ]}
      onPress={() => onPress?.(event)}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {event.title}
          </Text>
          {event.visibility === 'PRIVATE' && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Ionicons name="lock-closed" size={10} color="#fff" />
              <Text style={styles.badgeText}>
                {t('events.private') || 'Private'}
              </Text>
            </View>
          )}
        </View>

        {/* Edit/Delete buttons */}
        {(canEdit || canDelete) && (
          <View style={styles.actions}>
            {canEdit && (
              <TouchableOpacity
                onPress={() => onEdit?.(event)}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity
                onPress={() => onDelete?.(event)}
                style={styles.actionButton}
              >
                <Ionicons name="trash" size={18} color="#f44336" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Date and Time */}
      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeItem}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
            {formatEventDate(event.start_at)}
          </Text>
        </View>
        <View style={styles.dateTimeItem}>
          <Ionicons name="time" size={16} color={colors.textSecondary} />
          <Text style={[styles.dateTimeText, { color: colors.textSecondary }]}>
            {formatEventTime(event.start_at)}
          </Text>
        </View>
      </View>

      {/* Description */}
      {event.description ? (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={3}
        >
          {event.description}
        </Text>
      ) : null}

      {/* Creator */}
      <Text style={[styles.creator, { color: colors.textSecondary }]}>
        {t('events.createdBy') || 'Created by'}: {event.created_by_username}
      </Text>

      {/* Attendance counts */}
      <View style={styles.countsContainer}>
        <View style={styles.countItem}>
          <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
          <Text style={[styles.countText, { color: colors.text }]}>
            {event.going_count} {t('events.going') || 'Going'}
          </Text>
        </View>
        <View style={styles.countItem}>
          <Ionicons name="help-circle" size={14} color="#FF9800" />
          <Text style={[styles.countText, { color: colors.text }]}>
            {event.maybe_count} {t('events.maybe') || 'Maybe'}
          </Text>
        </View>
        <View style={styles.countItem}>
          <Ionicons name="close-circle" size={14} color="#f44336" />
          <Text style={[styles.countText, { color: colors.text }]}>
            {event.not_going_count} {t('events.notGoing') || 'Not Going'}
          </Text>
        </View>
      </View>

      {/* RSVP Buttons */}
      {!isPast && (
        <View style={styles.rsvpContainer}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              {
                backgroundColor: getStatusButtonStyle('GOING').backgroundColor,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleVote('GOING')}
          >
            <Text
              style={[
                styles.rsvpButtonText,
                { color: getStatusButtonStyle('GOING').textColor },
              ]}
            >
              {t('events.going') || 'Going'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rsvpButton,
              {
                backgroundColor: getStatusButtonStyle('MAYBE').backgroundColor,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleVote('MAYBE')}
          >
            <Text
              style={[
                styles.rsvpButtonText,
                { color: getStatusButtonStyle('MAYBE').textColor },
              ]}
            >
              {t('events.maybe') || 'Maybe'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rsvpButton,
              {
                backgroundColor: getStatusButtonStyle('NOT_GOING').backgroundColor,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleVote('NOT_GOING')}
          >
            <Text
              style={[
                styles.rsvpButtonText,
                { color: getStatusButtonStyle('NOT_GOING').textColor },
              ]}
            >
              {t('events.notGoing') || 'Not Going'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isPast && (
        <View style={[styles.pastBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.pastText, { color: colors.textSecondary }]}>
            {t('events.pastEvent') || 'Past Event'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  dateTimeText: {
    fontSize: 13,
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  creator: {
    fontSize: 12,
    marginBottom: 12,
  },
  countsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  countText: {
    fontSize: 12,
    marginLeft: 4,
  },
  rsvpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rsvpButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  rsvpButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pastBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pastText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EventCard;
