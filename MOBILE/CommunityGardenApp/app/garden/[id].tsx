// File: app/garden/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, COLORS } from '../../constants/Config';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

interface Garden {
  id: number;
  name: string;
  description?: string;
  location?: string;
  is_public: boolean;
}

interface Membership {
  id: number;
  user: number;
  role: 'MANAGER' | 'WORKER';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  username?: string;
}

export default function GardenDetailScreen() {
  const { id } = useLocalSearchParams();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchGarden();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchMembershipStatus();
      fetchMembers();
    }, [])
  );

  const fetchGarden = async () => {
    try {
      const response = await axios.get(`${API_URL}/gardens/${id}/`);
      setGarden(response.data);
    } catch (error) {
      console.error('Error fetching garden:', error);
      Alert.alert('Error', 'Could not load garden.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchMembershipStatus = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const existing = res.data.find((m: any) => m.garden === parseInt(id as string));
      if (existing) setMembershipStatus(existing.status); // PENDING, ACCEPTED, etc.
    } catch (err) {
      console.error('Membership status fetch error:', err);
    }
  };

  const fetchMembers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/memberships/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const filtered = res.data.filter((m: any) => m.garden === parseInt(id as string));
      setMembers(filtered);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const handleJoin = async () => {
    if (!token) return;
    setJoining(true);
    try {
      await axios.post(`${API_URL}/memberships/`, { garden: id }, {
        headers: { Authorization: `Token ${token}` },
      });
      setMembershipStatus('PENDING');
      Alert.alert('Request Sent', 'Your join request has been submitted.');
    } catch (error) {
      console.error('Join error:', error.response?.data || error);
      Alert.alert('Error', 'Could not send join request.');
    } finally {
      setJoining(false);
    }
  };

  if (loading || !garden) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.primary} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{garden.name}</Text>
      {garden.description ? <Text style={styles.description}>{garden.description}</Text> : null}
      {garden.location ? <Text style={styles.location}>📍 {garden.location}</Text> : null}
      <Text style={styles.public}>{garden.is_public ? '🌿 Public Garden' : '🔒 Private Garden'}</Text>

      {membershipStatus && (
        <Text style={styles.status}>
          Membership Status: {membershipStatus === 'PENDING' ? 'Request Pending' : membershipStatus}
        </Text>
      )}

      {garden.is_public && !membershipStatus && (
        <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joining}>
          <Text style={styles.buttonText}>{joining ? 'Sending Request...' : 'Join Garden'}</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>👥 Garden Members</Text>
      <FlatList
        data={members}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.memberCard}>
            <Text style={styles.memberText}>User ID: {item.user}</Text>
            <Text style={styles.memberText}>Role: {item.role}</Text>
            <Text style={styles.memberText}>Status: {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No members found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 10 },
  description: { fontSize: 16, color: COLORS.text, marginBottom: 8 },
  location: { fontSize: 14, color: '#666', marginBottom: 6 },
  public: { fontSize: 14, marginBottom: 8, fontStyle: 'italic', color: COLORS.primary },
  status: { fontSize: 14, marginBottom: 16, color: COLORS.primaryDark },
  button: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark, marginVertical: 12 },
  memberCard: { padding: 10, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10 },
  memberText: { fontSize: 14, color: COLORS.text },
  empty: { color: COLORS.text, fontSize: 14, textAlign: 'center', marginTop: 8 },
});
