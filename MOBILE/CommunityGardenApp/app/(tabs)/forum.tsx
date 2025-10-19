import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import ForumListScreen from '../forum/ForumListScreen';

export default function ForumScreen() {
  const router = useRouter();
  const colors = useAccessibleColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ForumListScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 