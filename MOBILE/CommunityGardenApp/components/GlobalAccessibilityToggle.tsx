/**
 * Global Accessibility Toggle Component
 * Floating button that appears on all tabs for easy access
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccessibility, useAccessibleColors } from '../contexts/AccessibilityContextSimple';
import { HighContrastToggle } from './AccessibilityToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

export function GlobalAccessibilityToggle() {
  const [showModal, setShowModal] = useState(false);
  const { isHighContrast } = useAccessibility();
  const colors = useAccessibleColors();

  return (
    <>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          { 
            backgroundColor: isHighContrast ? colors.primary : colors.secondary,
            borderColor: colors.border,
          }
        ]}
        onPress={() => setShowModal(true)}
        accessibilityLabel="Open accessibility settings"
        accessibilityHint="Opens accessibility options for the entire app"
      >
        <Ionicons 
          name={isHighContrast ? "eye" : "eye-off"} 
          size={24} 
          color={isHighContrast ? colors.white : colors.text} 
        />
      </TouchableOpacity>

      {/* Settings Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Accessibility Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
                accessibilityLabel="Close accessibility settings"
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                These settings apply to the entire app and improve visibility for users with visual impairments.
              </Text>
              
              <HighContrastToggle 
                variant="switch" 
                style={styles.toggleContainer}
              />

              <View style={styles.languageSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
                <LanguageSwitcher variant="button" style={styles.languageButton} />
              </View>
              
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  High contrast mode increases color contrast ratios to meet WCAG 2.1 AA accessibility standards.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100, // Above tab bar
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 2,
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: '60%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 24,
  },
  toggleContainer: {
    marginBottom: 24,
  },
  languageSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  languageButton: {
    alignSelf: 'flex-start',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
});
