import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibleColors } from '../contexts/AccessibilityContextSimple';

interface LanguageSwitcherProps {
  variant?: 'button' | 'modal';
  style?: any;
}

export function LanguageSwitcher({ variant = 'button', style }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const colors = useAccessibleColors();
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState(i18n.language);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  ];

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log('Language changed in component:', lng);
      setCurrentLang(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  const changeLanguage = (languageCode: string) => {
    console.log('Changing language to:', languageCode);
    console.log('Current language before change:', i18n.language);
    
    i18n.changeLanguage(languageCode).then(() => {
      console.log('Language changed successfully to:', i18n.language);
      // Force update the component state
      setCurrentLang(i18n.language);
      setShowModal(false);
      
      // Force a re-render by updating the state
      setTimeout(() => {
        setCurrentLang(i18n.language);
      }, 100);
    }).catch((error) => {
      console.error('Error changing language:', error);
    });
  };

  if (variant === 'modal') {
    return (
      <>
        <TouchableOpacity
          style={[styles.languageButton, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
          onPress={() => setShowModal(true)}
          accessibilityLabel="Change language"
          accessibilityHint="Opens language selection menu"
        >
          <Text style={styles.flag}>{currentLanguage.flag}</Text>
          <Text style={[styles.languageText, { color: colors.text }]}>{currentLanguage.name}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.closeButton}
                  accessibilityLabel="Close language selection"
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.languageList}>
                {languages.map((language) => (
                  <TouchableOpacity
                    key={language.code}
                    style={[
                      styles.languageOption,
                      { backgroundColor: colors.background },
                      currentLang === language.code && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => changeLanguage(language.code)}
                    accessibilityLabel={`Select ${language.name}`}
                    accessibilityHint={`Changes app language to ${language.name}`}
                  >
                    <Text style={styles.flag}>{language.flag}</Text>
                    <Text style={[
                      styles.languageOptionText,
                      { color: currentLang === language.code ? colors.white : colors.text }
                    ]}>
                      {language.name}
                    </Text>
                    {currentLang === language.code && (
                      <Ionicons name="checkmark" size={20} color={colors.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Simple button variant
  return (
    <TouchableOpacity
      style={[styles.simpleButton, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={() => {
        const nextLanguage = currentLang === 'en' ? 'tr' : 'en';
        changeLanguage(nextLanguage);
      }}
      accessibilityLabel={`Switch to ${currentLang === 'en' ? 'Turkish' : 'English'}`}
    >
      <Text style={styles.flag}>{currentLanguage.flag}</Text>
      <Text style={[styles.languageText, { color: colors.text }]}>{currentLanguage.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  simpleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  flag: {
    fontSize: 16,
    marginRight: 8,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    gap: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
});
