import { Image, StyleSheet, View ,Text} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WeatherWidget from '@/components/WeatherWidget';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants/Config';




export default function HomeScreen() {
  const [location, setLocation] = useState<string | null>(null);
  const { user, token } = useAuth()
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
    <SafeAreaView style={styles.container}>
      <WeatherWidget city={location || 'Istanbul'} />  {/* ✅ First, weather widget aligned to top-right */}

      <ThemedView style={styles.welcomeContainer}>
        <ThemedText type="title" style={styles.welcomeText}>
          Welcome to the Garden Community App!
        </ThemedText>
        <ThemedText type="subtitle">
          Connect, grow, and share with fellow gardeners 🌱
        </ThemedText>
      </ThemedView>

      <Image
        source={require('@/assets/images/communitygarden.png')}
        style={styles.gardenImage}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBE9',
    padding: 20,
  },
  welcomeContainer: {
    marginTop: 16,
    marginBottom: 20,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F7FBE9',
  },
  welcomeText: {textAlign: 'center',marginBottom: 8,},
  gardenImage: {
    width: '100%',
    height: 300,
  },
});