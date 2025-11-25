import { Image, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WeatherWidget from '@/components/WeatherWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/Config';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUnreadCount } from '../../services/notification';




export default function HomeScreen() {
  const [location, setLocation] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const colors = useAccessibleColors();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setLocation(res.data?.profile?.location || res.data?.location || null);
      } catch (err) {
        console.error('Failed to load profile location');
      }
    };

    if (token) fetchCurrentProfile();
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      const loadUnreadCount = async () => {
        if (!token) return;
        try {
          const count = await fetchUnreadCount(token);
          setUnreadCount(count);
        } catch (err) {
          console.error('Failed to load unread count');
        }
      };
      loadUnreadCount();
    }, [token])
  );

  
  return (

      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('layout.home')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notifications')}
            style={styles.bellContainer}
          >
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
            {unreadCount > 0 && (
              <View style={styles.starBadge}>
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {location ? (
          <WeatherWidget city={location} />
        ) : (
          <Text style={[styles.loadingText, { color: colors.text }]}>{t('home.loadingWeather')}</Text>
        )}
    
        <ThemedView style={[styles.welcomeContainer, { backgroundColor: colors.surface }]}>
          <ThemedText type="title" style={styles.welcomeText}>
            {t('home.welcome')}
          </ThemedText>
          <ThemedText type="subtitle">
            {t('home.subtitle')}
          </ThemedText>
        </ThemedView>
    
        <Image
          source={require('@/assets/images/communitygarden.png')}
          style={[styles.gardenImage, { 
            opacity: colors.background === '#000000' ? 0.8 : 1.0,
            tintColor: colors.background === '#000000' ? colors.text : undefined
          }]}
          resizeMode="contain"
          accessibilityLabel={t('home.accessibilityLabel')}
          accessibilityHint={t('home.accessibilityHint')}
        />
      </SafeAreaView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  bellContainer: {
    position: 'relative',
    padding: 4,
  },
  starBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  welcomeContainer: {
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  welcomeText: {textAlign: 'center',marginBottom: 8,},
  loadingText: {
    marginBottom: 12,
  },
  gardenImage: {
    width: '100%',
    height: 300,
  },
});