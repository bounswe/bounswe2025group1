import { Image, StyleSheet, View ,Text} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WeatherWidget from '@/components/WeatherWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/Config';
import { useTranslation } from 'react-i18next';




export default function HomeScreen() {
  const [location, setLocation] = useState<string | null>(null);
  const { user, token } = useAuth();
  const colors = useAccessibleColors();
  const { t } = useTranslation();
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

  
  return (
    
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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