// File: app/garden/CreateGardenScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createGarden } from '../../services/garden';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useTranslation } from 'react-i18next';
import ImagePicker from '../../components/ui/ImagePicker';
import { COLORS } from '../../constants/Config';


interface ImageData {
  base64: string;
  uri: string;
  mimeType: string;
  fileName: string;
}

export default function CreateGardenScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<ImageData[]>([]);
  const [galleryImages, setGalleryImages] = useState<ImageData[]>([]);

  const router = useRouter();
  const colors = useAccessibleColors();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert(t('garden.create.validation'), t('garden.create.nameRequired'));
      return;
    }

    setLoading(true);
    try {
      const gardenData: any = {
        name,
        description,
        location,
        is_public: isPublic
      };

      // Add cover image if selected
      if (coverImage.length > 0) {
        gardenData.cover_image_base64 = coverImage[0].base64;
      }

      // Add gallery images if selected
      if (galleryImages.length > 0) {
        gardenData.gallery_base64 = galleryImages.map(img => img.base64);
      }

      await createGarden(gardenData);
      Alert.alert('Success', 'Garden created successfully!');
      // Navigate to gardens tab instead of going back
      router.replace('/(tabs)/gardens');
    } catch (error) {
      console.error('Error creating garden:', error);
      Alert.alert(t('garden.create.error'), t('garden.create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>{t('garden.create.title')}</Text>

      <TextInput
        placeholder={t('garden.create.namePlaceholder')}
        style={[styles.input, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder={t('garden.create.descriptionPlaceholder')}
        style={[styles.input, styles.multiline, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholderTextColor={colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        placeholder={t('garden.create.locationPlaceholder')}
        style={[styles.input, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholderTextColor={colors.textSecondary}
        value={location}
        onChangeText={setLocation}
      />

      <View style={styles.switchRow}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>{t('garden.create.isPublic')}</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          thumbColor={isPublic ? colors.primary : colors.textSecondary}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {/* Cover Image Upload */}
      <ImagePicker
        label="Cover Image (Optional)"
        onImagesChange={setCoverImage}
        maxImages={1}
        allowMultiple={false}
        initialImages={coverImage}
      />

      {/* Gallery Images Upload */}
      <ImagePicker
        label="Gallery Images (Optional)"
        onImagesChange={setGalleryImages}
        maxImages={5}
        allowMultiple={true}
        initialImages={galleryImages}
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.buttonText, { color: colors.white }]}>{t('garden.create.createButton')}</Text>}
      </TouchableOpacity>

      {/* Bottom padding for scroll */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
