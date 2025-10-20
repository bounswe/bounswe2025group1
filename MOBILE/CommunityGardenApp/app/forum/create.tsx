import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { API_URL } from '@/constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function CreatePostScreen() {
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(t('common.error'), t('forum.errors.commentEmpty'));
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/forum/`,
        { title, content },
        { headers: { Authorization: `Token ${token}` } }
      );
      Alert.alert(t('common.success'), t('forum.createPost'));
      router.push('/forum');
    } catch (error) {
      Alert.alert(t('common.error'), t('forum.errors.fetchFailed'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t('forum.createPost')}</Text>
      <TextInput
        style={[styles.input, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholder={t('forum.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.contentInput, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }]}
        placeholder={t('forum.post.addComment')}
        placeholderTextColor={colors.textSecondary}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
      />
      <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleCreatePost}>
        <Text style={[styles.createButtonText, { color: colors.white }]}>{t('forum.createPost')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16 },
  contentInput: { height: 120, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16, textAlignVertical: 'top' },
  createButton: { padding: 12, borderRadius: 8, alignItems: 'center' },
  createButtonText: { fontWeight: 'bold' },
}); 