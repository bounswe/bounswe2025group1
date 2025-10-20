/**
 * High Contrast Toggle Component
 * Provides an accessible way to toggle high-contrast mode
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useAccessibility, useAccessibleColors } from '../contexts/AccessibilityContextSimple';
import { useTranslation } from 'react-i18next';

interface HighContrastToggleProps {
  style?: any;
  showLabel?: boolean;
  variant?: 'switch' | 'button';
}

export function HighContrastToggle({
  style,
  showLabel = true,
  variant = 'switch'
}: HighContrastToggleProps) {
  const { isHighContrast, toggleHighContrast } = useAccessibility();
  const colors = useAccessibleColors();
  const { t } = useTranslation();

  // Debug: Log toggle state
  console.log('HighContrastToggle - isHighContrast:', isHighContrast);

  if (variant === 'switch') {
    return (
      <View style={[styles.container, style]}>
        {showLabel && (
          <Text style={[styles.label, { color: colors.text }]}>
            {t('accessibility.highContrastMode')}
          </Text>
        )}
        <Switch
          value={isHighContrast}
          onValueChange={() => {
            console.log('Switch toggled! Current state:', isHighContrast);
            toggleHighContrast();
          }}
          trackColor={{
            false: colors.border,
            true: colors.primary
          }}
          thumbColor={isHighContrast ? colors.white : colors.textSecondary}
          accessibilityLabel="Toggle high contrast mode"
          accessibilityHint="Turns on high contrast colors for better visibility"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isHighContrast ? colors.primary : colors.surface,
          borderColor: colors.border,
        },
        style
      ]}
      onPress={toggleHighContrast}
      accessibilityLabel={isHighContrast ? "Turn off high contrast mode" : "Turn on high contrast mode"}
      accessibilityHint="Toggles high contrast colors for better visibility"
      accessibilityRole="button"
    >
      <Text style={[
        styles.buttonText,
        { color: isHighContrast ? colors.white : colors.text }
      ]}>
        {isHighContrast ? 'High Contrast: ON' : 'High Contrast: OFF'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Minimum touch target size
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

/**
 * Accessibility Settings Screen Component
 * Complete accessibility settings interface
 */
export function AccessibilitySettings() {
  const { themeKey, setTheme, validateCurrentTheme } = useAccessibility();
  const colors = useAccessibleColors();

  const themeOptions: { key: ThemeKey; label: string; description: string }[] = [
    {
      key: 'standard',
      label: 'Standard Theme',
      description: 'Default theme with WCAG AA compliance'
    },
    {
      key: 'highContrast',
      label: 'High Contrast Light',
      description: 'High contrast theme for light backgrounds'
    },
    {
      key: 'dark',
      label: 'Dark Theme',
      description: 'Dark theme with WCAG AA compliance'
    },
    {
      key: 'highContrastDark',
      label: 'High Contrast Dark',
      description: 'High contrast theme for dark backgrounds'
    },
  ];

  return (
    <View style={[styles.settingsContainer, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Accessibility Settings
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          High Contrast Mode
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Improves visibility for users with visual impairments
        </Text>
        <HighContrastToggle variant="switch" />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Theme Selection
        </Text>
        <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
          Choose a theme that works best for you
        </Text>

        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.themeOption,
              {
                backgroundColor: themeKey === option.key ? colors.primary : colors.surface,
                borderColor: colors.border,
              }
            ]}
            onPress={() => setTheme(option.key)}
            accessibilityLabel={`Select ${option.label}`}
            accessibilityHint={option.description}
            accessibilityRole="button"
          >
            <View style={styles.themeOptionContent}>
              <Text style={[
                styles.themeOptionLabel,
                { color: themeKey === option.key ? colors.white : colors.text }
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.themeOptionDescription,
                { color: themeKey === option.key ? colors.white : colors.textSecondary }
              ]}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.validateButton, { backgroundColor: colors.secondary }]}
        onPress={validateCurrentTheme}
        accessibilityLabel="Validate current theme accessibility"
        accessibilityHint="Checks if current theme meets accessibility standards"
      >
        <Text style={[styles.validateButtonText, { color: colors.text }]}>
          Validate Theme Accessibility
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const settingsStyles = StyleSheet.create({
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeOption: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    minHeight: 44,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeOptionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  validateButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  validateButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
