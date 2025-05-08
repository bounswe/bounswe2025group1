import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from 'expo-router';
import { COLORS } from '../../constants/Config';
import axios from 'axios';
import { API_URL } from '../../constants/Config';
import { Ionicons } from '@expo/vector-icons';

export default function GardenListScreen() {
  const [gardens, setGardens] = useState([]);
  const [filteredGardens, setFilteredGardens] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    fetchGardens();
  }, []);

  const fetchGardens = async () => {
    try {
      const response = await axios.get(`${API_URL}/gardens/`);
      setGardens(response.data);
      setFilteredGardens(response.data);
    } catch (error) {
      setGardens([]);
      setFilteredGardens([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    setSearch(text);
    const value = text.toLowerCase();
    setFilteredGardens(
      gardens.filter(garden =>
        garden.name.toLowerCase().includes(value) ||
        garden.description.toLowerCase().includes(value) ||
        garden.location.toLowerCase().includes(value)
      )
    );
  };

  const renderGarden = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('garden-detail', { id: item.id })}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <Text style={styles.gardenName}>{item.name}</Text>
        <Text style={styles.gardenDesc}>{item.description}</Text>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>{item.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color={COLORS.primaryDark} />
          <Text style={styles.infoText}>{item.members} members • {item.tasks} tasks</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Community Gardens</Text>
      <Text style={styles.subtitle}>Explore and join community gardens in your area or create your own.</Text>
      <TextInput
        style={styles.search}
        placeholder="Search gardens by name, description or location..."
        value={search}
        onChangeText={handleSearch}
      />
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : filteredGardens.length > 0 ? (
        <FlatList
          data={filteredGardens}
          renderItem={renderGarden}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      ) : (
        <Text style={styles.noResults}>No gardens found matching your search.</Text>
      )}
      {/* Floating Create Garden Button (to be implemented) */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  search: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: '#eee',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  gardenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  gardenDesc: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 4,
  },
  noResults: {
    textAlign: 'center',
    color: COLORS.text,
    marginTop: 40,
    fontSize: 16,
  },
}); 