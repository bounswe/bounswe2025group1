import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, Alert } from 'react-native';
import { useNavigation } from 'expo-router';
import { listPublicGardens, Garden } from '../../services/garden';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { API_URL } from '../../constants/Config';

// Helper function to extract city from location string
const getCityFromLocation = (location?: string): string | null => {
  if (!location) return null;
  // Extract city (part before the first comma, or the whole string if no comma)
  const city = location.split(',')[0].trim();
  return city || null;
};

// Helper function to normalize city names for comparison (remove extra spaces, handle Turkish characters)
const normalizeCityName = (city: string): string => {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

export default function GardensScreen() {
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [allGardens, setAllGardens] = useState<Garden[]>([]); // Store all gardens
  const [loading, setLoading] = useState(true);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const navigation = useNavigation();
  const router = useRouter();
  const { t } = useTranslation();

  // Fetch user's profile location on mount
  useEffect(() => {
    fetchUserProfileLocation();
    fetchGardens();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchGardens();
      fetchUserProfileLocation();
    }, [token])
  );

  // Filter gardens when showNearbyOnly or userCity changes
  useEffect(() => {
    if (showNearbyOnly && userCity) {
      const normalizedUserCity = normalizeCityName(userCity);
      console.log('=== FILTERING GARDENS ===');
      console.log('User city:', userCity, 'Normalized:', normalizedUserCity);
      
      const filtered = allGardens.filter(garden => {
        if (!garden.location) {
          console.log(`Garden: ${garden.name}, No location - EXCLUDED`);
          return false;
        }
        
        // Parse garden location by commas and check each part
        const locationParts = garden.location.split(',').map(part => part.trim());
        console.log(`Garden: ${garden.name}, Location parts:`, locationParts);
        
        // Check if user's city matches any part of the garden's location
        const matches = locationParts.some(part => {
          const normalizedPart = normalizeCityName(part);
          const isMatch = normalizedPart === normalizedUserCity;
          if (isMatch) {
            console.log(`✅ MATCH: "${part}" (normalized: "${normalizedPart}") matches user city "${normalizedUserCity}"`);
          }
          return isMatch;
        });
        
        if (!matches) {
          console.log(`❌ NO MATCH: ${garden.name} - none of the location parts match "${normalizedUserCity}"`);
        }
        
        return matches;
      });
      
      console.log(`Filtered ${filtered.length} gardens out of ${allGardens.length}`);
      console.log('=== END FILTERING ===');
      setGardens(filtered);
    } else {
      setGardens(allGardens);
    }
  }, [showNearbyOnly, userCity, allGardens]);

  const fetchGardens = async () => {
    try {
      const data = await listPublicGardens();
      console.log('=== FETCHED GARDENS ===');
      data.forEach((garden: Garden) => {
        console.log(`Garden: ${garden.name}, Location: ${garden.location || 'NO LOCATION'}`);
      });
      console.log('=== END FETCHED GARDENS ===');
      setAllGardens(data);
      setGardens(data);
    } catch (error) {
      console.error('Error fetching gardens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's profile location
  const fetchUserProfileLocation = async (showLoading: boolean = false): Promise<string | null> => {
    if (!token) return null;
    
    if (showLoading) {
      setLoadingLocation(true);
    }
    
    try {
      const res = await axios.get(`${API_URL}/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      const profileLocation = res.data?.profile?.location || res.data?.location || null;
      console.log('Profile location from API:', profileLocation);
      
      if (profileLocation) {
        const city = getCityFromLocation(profileLocation);
        console.log('Extracted city from profile:', city);
        if (city) {
          setUserCity(city);
          console.log('User city set to:', city);
          return city;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile location:', error);
      return null;
    } finally {
      if (showLoading) {
        setLoadingLocation(false);
      }
    }
  };

  const handleNearbyToggle = async (value: boolean) => {
    if (value && !userCity) {
      // If no city is available, try to fetch profile location
      const city = await fetchUserProfileLocation(true);
      if (!city) {
        Alert.alert(
          t('gardens.locationErrorTitle') || 'Location Not Set',
          t('gardens.locationNotSetMessage') || 'Please set your location in your profile to use this filter.'
        );
        return; // Don't enable the filter
      }
    }
    
    setShowNearbyOnly(value);
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
            params: { id: (item.id || 0).toString() },
          })
        }
      >
        <Text style={[styles.detailButtonText, { color: colors.white }]}>{t('gardens.goToDetail')}</Text>
      </TouchableOpacity>
    </View>
  );
  if (loading) {
    return <ActivityIndicator style={styles.loader} size="large" />;
  }

  // Filter header component
  const renderFilterHeader = () => (
    <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.filterRow}>
        <Text style={[styles.filterLabel, { color: colors.text }]}>
          {t('gardens.showNearby') || 'Show Nearby Gardens'}
        </Text>
        {loadingLocation ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={showNearbyOnly}
            onValueChange={handleNearbyToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={showNearbyOnly ? colors.white : colors.textSecondary}
          />
        )}
      </View>
      {showNearbyOnly && userCity && (
        <Text style={[styles.filterSubtext, { color: colors.textSecondary }]}>
          {t('gardens.showingGardensIn') || 'Showing gardens in'}: {userCity}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={gardens}
        keyExtractor={(item) => item.id?.toString() || `garden-${item.name}`}
        renderItem={renderGarden}
        ListHeaderComponent={renderFilterHeader}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            {showNearbyOnly && userCity
              ? t('gardens.noNearbyGardens') || `No gardens found in ${userCity}`
              : t('gardens.noGardens') || 'No gardens found.'}
          </Text>
        }
        contentContainerStyle={styles.listContent}
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
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  filterContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  filterSubtext: {
    fontSize: 12,
    marginTop: 8,
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