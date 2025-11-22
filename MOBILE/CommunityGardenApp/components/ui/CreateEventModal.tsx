import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import {
  createEvent,
  updateEvent,
  CreateEventData,
  GardenEvent,
  EventVisibility,
} from '../../services/event';

interface CreateEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (event: GardenEvent) => void;
  gardenId: number;
  editEvent?: GardenEvent | null;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
  visible,
  onClose,
  onSuccess,
  gardenId,
  editEvent,
}) => {
  const { t } = useTranslation();
  const colors = useAccessibleColors();

  const [title, setTitle] = useState(editEvent?.title || '');
  const [description, setDescription] = useState(editEvent?.description || '');
  const [date, setDate] = useState(
    editEvent ? new Date(editEvent.start_at) : new Date()
  );
  const [isPublic, setIsPublic] = useState(
    editEvent ? editEvent.visibility === 'PUBLIC' : false
  );
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDate(new Date());
    setIsPublic(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(
        t('common.error'),
        t('events.titleRequired') || 'Event title is required'
      );
      return;
    }

    if (date < new Date()) {
      Alert.alert(
        t('common.error'),
        t('events.futureDateRequired') || 'Please select a future date'
      );
      return;
    }

    setLoading(true);
    try {
      const eventData: CreateEventData = {
        garden: gardenId,
        title: title.trim(),
        description: description.trim(),
        start_at: date.toISOString(),
        visibility: isPublic ? 'PUBLIC' : 'PRIVATE',
      };

      let result: GardenEvent;
      if (editEvent) {
        result = await updateEvent(editEvent.id, {
          title: eventData.title,
          description: eventData.description,
          start_at: eventData.start_at,
          visibility: eventData.visibility,
        });
      } else {
        result = await createEvent(eventData);
      }

      Alert.alert(
        t('common.success'),
        editEvent
          ? t('events.updateSuccess') || 'Event updated successfully'
          : t('events.createSuccess') || 'Event created successfully'
      );

      resetForm();
      onSuccess(result);
    } catch (error: any) {
      console.error('Error saving event:', error);
      Alert.alert(
        t('common.error'),
        error.response?.data?.detail ||
          t('events.saveError') ||
          'Failed to save event'
      );
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {editEvent
                ? t('events.editEvent') || 'Edit Event'
                : t('events.createEvent') || 'Create Event'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('events.title') || 'Title'} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t('events.titlePlaceholder') || 'Enter event title'}
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />

            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('events.description') || 'Description'}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={
                t('events.descriptionPlaceholder') || 'Enter event description'
              }
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            {/* Date Picker */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('events.date') || 'Date'} *
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}

            {/* Time Picker */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('events.time') || 'Time'} *
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={colors.textSecondary} />
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {formatTime(date)}
              </Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={date}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
              />
            )}

            {/* Visibility Toggle */}
            <View style={styles.switchRow}>
              <View>
                <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>
                  {t('events.publicEvent') || 'Public Event'}
                </Text>
                <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                  {isPublic
                    ? t('events.visibleToAll') || 'Visible to all users'
                    : t('events.visibleToMembers') || 'Only visible to garden members'}
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                thumbColor={isPublic ? colors.primary : colors.textSecondary}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                {t('common.cancel') || 'Cancel'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                loading && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editEvent
                    ? t('common.save') || 'Save'
                    : t('common.create') || 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 14,
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CreateEventModal;
