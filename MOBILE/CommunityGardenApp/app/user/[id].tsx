import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, COLORS } from '../../constants/Config';

export default function UserProfileScreen() {
  const { token } = useAuth();
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setUserData(res.data);
      } catch (err) {
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </SafeAreaView>
    );
  }
  console.log("userdata",userData)
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.username}>@{userData.username}</Text>

        <Text style={styles.label}>First Name:</Text>
        <Text style={styles.value}>{userData.first_name || 'N/A'}</Text>

        <Text style={styles.label}>Last Name:</Text>
        <Text style={styles.value}>{userData.last_name || 'N/A'}</Text>

        <Text style={styles.label}>Email:</Text>
        <Text style={styles.value}>{userData.email || 'Hidden'}</Text>

        <Text style={styles.label}>Location:</Text>
        <Text style={styles.value}>{userData.profile?.location || 'Unknown'}</Text>

       
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  username: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 16 },
  label: { fontWeight: 'bold', marginTop: 12, color: COLORS.primary },
  value: { fontSize: 16, marginBottom: 8, color: COLORS.text },
});