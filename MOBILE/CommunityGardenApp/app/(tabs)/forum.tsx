import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/Config';
import ForumListScreen from '../forum/ForumListScreen';

export default function ForumScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ForumListScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
}); 