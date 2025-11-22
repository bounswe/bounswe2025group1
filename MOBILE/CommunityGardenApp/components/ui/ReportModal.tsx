import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useAuth } from '../../contexts/AuthContext';
import { createReport, ContentType, ReportReason } from '../../services/report';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  contentType: ContentType;
  objectId: number;
}

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'abuse', label: 'moderation.reasons.abuse' },
  { value: 'spam', label: 'moderation.reasons.spam' },
  { value: 'illegal', label: 'moderation.reasons.illegal' },
  { value: 'other', label: 'moderation.reasons.other' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  onSuccess,
  contentType,
  objectId,
}) => {
  const { t } = useTranslation();
  const colors = useAccessibleColors();
  const { token } = useAuth();

  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setSelectedReason(null);
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(
        t('common.error'),
        t('moderation.selectReason') || 'Please select a reason'
      );
      return;
    }

    if (!token) {
      Alert.alert(
        t('common.error'),
        t('common.notAuthenticated') || 'You must be logged in'
      );
      return;
    }

    setLoading(true);
    try {
      await createReport(
        {
          content_type: contentType,
          object_id: objectId,
          reason: selectedReason,
          description: description.trim(),
        },
        token
      );

      Alert.alert(
        t('common.success'),
        t('moderation.reportSubmitted') || 'Report submitted successfully'
      );

      resetForm();
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error submitting report:', error);
      const errorMessage =
        error.response?.data?.detail ||
        t('moderation.reportError') ||
        'Failed to submit report';
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
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
              {t('moderation.reportContent') || 'Report Content'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Reason Selection */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('moderation.reason') || 'Reason'} *
            </Text>
            <View style={styles.reasonContainer}>
              {REPORT_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason.value}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor:
                        selectedReason === reason.value
                          ? colors.primary
                          : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.value)}
                >
                  <Text
                    style={[
                      styles.reasonButtonText,
                      {
                        color:
                          selectedReason === reason.value
                            ? '#fff'
                            : colors.text,
                      },
                    ]}
                  >
                    {t(reason.label) || reason.value}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.label, { color: colors.text }]}>
              {t('moderation.description') || 'Description'}{' '}
              {t('common.optional') || '(Optional)'}
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
                t('moderation.descriptionPlaceholder') ||
                'Provide additional details about this report...'
              }
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
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
                  {t('moderation.submit') || 'Submit Report'}
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
    maxHeight: '70%',
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
  reasonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  reasonButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  reasonButtonText: {
    fontSize: 14,
    fontWeight: '500',
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

export default ReportModal;
