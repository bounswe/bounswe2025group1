import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { listPublicGardens } from '../../services/garden';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Garden {
  id: number;
  name: string;
  description?: string;
  location?: string;
  is_public: boolean;
  created_at: string;
}

export default function GardensScreen() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    fetchGardens();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchGardens();
    }, [])
  );

  const fetchGardens = async () => {
    try {
      const data = await listPublicGardens();
      setGardens(data);
    } catch (error) {
      console.error('Error fetching gardens:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGarden = ({ item }: { item: Garden }) => (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
      {item.description ? <Text style={[styles.desc, { color: colors.textSecondary }]}>{item.description}</Text> : null}
      {item.location ? <Text style={[styles.loc, { color: colors.textSecondary }]}>📍 {item.location}</Text> : null}
  
      <TouchableOpacity
        style={[styles.detailButton, { backgroundColor: colors.primary }]}
        onPress={() =>
          router.push({
            pathname: '/garden/[id]',
            params: { id: item.id.toString() },
          })
        }
      >
        <Text style={[styles.detailButtonText, { color: colors.white }]}>Go to Detail</Text>
      </TouchableOpacity>
    </View>
  );
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={gardens}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGarden}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textSecondary }]}>No public gardens found.</Text>}
      />
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/garden/CreateGardenScreen')}
      >
        <Text style={[styles.fabText, { color: colors.white }]}>＋</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
  },
  loc: {
    marginTop: 6,
    fontSize: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 4,
  },
  fabText: {
    fontSize: 30,
    lineHeight: 34,
  },
  detailButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  detailButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
});