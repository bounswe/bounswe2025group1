// File: app/garden/CreateGardenScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { createGarden } from '../../services/garden';
import { COLORS } from '../../constants/Config';
import ImagePicker from '../../components/ui/ImagePicker';

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

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Validation', 'Garden name is required.');
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
      Alert.alert('Error', 'Failed to create garden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create New Garden</Text>

      <TextInput
        placeholder="Garden Name"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Description"
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        placeholder="Location"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Make this garden public</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          thumbColor={isPublic ? COLORS.primary : '#ccc'}
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
        style={[styles.button, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Create</Text>}
      </TouchableOpacity>

      {/* Bottom padding for scroll */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
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
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
