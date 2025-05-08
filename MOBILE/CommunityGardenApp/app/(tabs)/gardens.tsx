import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from 'expo-router';
import { listPublicGardens } from '../../services/garden';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/Config';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

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
    <TouchableOpacity onPress={() => router.push({ pathname: '/garden/[id]', params: { id: item.id.toString() } })} style={styles.card}>
      <Text style={styles.title}>{item.name}</Text>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      {item.location ? <Text style={styles.loc}>📍 {item.location}</Text> : null}
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={gardens}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderGarden}
        ListEmptyComponent={<Text style={styles.empty}>No public gardens found.</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/garden/CreateGardenScreen')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7fdf7',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
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
    color: '#555',
  },
  loc: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: COLORS.primary,
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
    color: '#fff',
    lineHeight: 34,
  },
});