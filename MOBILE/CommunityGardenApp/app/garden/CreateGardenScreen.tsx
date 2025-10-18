// File: app/garden/CreateGardenScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { createGarden } from '../../services/garden';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';

export default function CreateGardenScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const colors = useAccessibleColors();

  const handleSubmit = async () => {
    if (!name) {
      Alert.alert('Validation', 'Garden name is required.');
      return;
    }

    setLoading(true);
    try {
      await createGarden({ name, description, location, is_public: isPublic });
      Alert.alert('Success', 'Garden created successfully!');
      router.back(); // Navigate back to previous screen
    } catch (error) {
      console.error('Error creating garden:', error);
      Alert.alert('Error', 'Failed to create garden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Create New Garden</Text>

      <TextInput
        placeholder="Garden Name"
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
        placeholder="Description"
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
        placeholder="Location"
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
        <Text style={[styles.switchLabel, { color: colors.text }]}>Make this garden public</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          thumbColor={isPublic ? colors.primary : colors.textSecondary}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.buttonText, { color: colors.white }]}>Create</Text>}
      </TouchableOpacity>
    </View>
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
