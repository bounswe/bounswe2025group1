import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, COLORS } from '../../constants/Config';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TABS = ['Gardens', 'Followers', 'Following'];

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (!token) {
        console.error('No token found!');
        setProfile(null);
        setGardens([]);
        setFollowers([]);
        setFollowing([]);
        setLoading(false);
        return;
      }
      const url = `${API_URL}/profile/`;
      console.log('Fetching profile from:', url, 'with token:', token);
      const [profileRes, gardensRes, followersRes, followingRes] = await Promise.all([
        axios.get(url, { headers: { Authorization: `Token ${token}` } }),
        axios.get(`${API_URL}/memberships/my-gardens/`, { headers: { Authorization: `Token ${token}` } }),
        axios.get(`${API_URL}/profile/followers/`, { headers: { Authorization: `Token ${token}` } }),
        axios.get(`${API_URL}/profile/following/`, { headers: { Authorization: `Token ${token}` } }),
      ]);
      setProfile(profileRes.data);
      setGardens(gardensRes.data);
      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
    } catch (error) {
      console.error('Profile fetch error:', error, error?.response?.data);
      setProfile(null);
      setGardens([]);
      setFollowers([]);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load profile. {token ? 'Check your backend, token, or network.' : 'No token found. Please log in again.'}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.primaryDark} style={{ marginBottom: 8 }} />
        <Text style={styles.username}>{profile.username}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <Text style={styles.location}>{profile.profile?.location}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabsRow}>
        {TABS.map((label, idx) => (
          <TouchableOpacity
            key={label}
            style={[styles.tab, tab === idx && styles.tabActive]}
            onPress={() => setTab(idx)}
          >
            <Text style={[styles.tabText, tab === idx && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContent}>
        {tab === 0 && (
          <View>
            <Text style={styles.sectionTitle}>Your Gardens</Text>
            <FlatList
              data={gardens}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.gardenCard}>
                  <Text style={styles.gardenName}>{item.name}</Text>
                  <Text style={styles.gardenDesc}>{item.description}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No gardens yet.</Text>}
            />
          </View>
        )}
        {tab === 1 && (
          <View>
            <Text style={styles.sectionTitle}>Followers</Text>
            <FlatList
              data={followers}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.followerCard}>
                  <Ionicons name="person-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.followerName}>{item.username}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No followers yet.</Text>}
            />
          </View>
        )}
        {tab === 2 && (
          <View>
            <Text style={styles.sectionTitle}>Following</Text>
            <FlatList
              data={following}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.followerCard}>
                  <Ionicons name="person-outline" size={24} color={COLORS.primaryDark} />
                  <Text style={styles.followerName}>{item.username}</Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Not following anyone yet.</Text>}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { color: COLORS.error, fontSize: 18, marginBottom: 16 },
  header: { alignItems: 'center', padding: 24, backgroundColor: COLORS.white, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  username: { fontSize: 22, fontWeight: 'bold', color: COLORS.primaryDark },
  email: { fontSize: 15, color: COLORS.text },
  location: { fontSize: 14, color: COLORS.text, marginBottom: 8 },
  logoutButton: { marginTop: 12, backgroundColor: COLORS.error, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  logoutText: { color: COLORS.white, fontWeight: 'bold', fontSize: 15 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e0e0e0', marginTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 3, borderColor: COLORS.primaryDark },
  tabText: { fontSize: 16, color: COLORS.text },
  tabTextActive: { color: COLORS.primaryDark, fontWeight: 'bold' },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primaryDark, marginBottom: 8 },
  gardenCard: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  gardenName: { fontWeight: 'bold', fontSize: 15, color: COLORS.primaryDark },
  gardenDesc: { fontSize: 13, color: COLORS.text },
  followerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  followerName: { marginLeft: 10, fontSize: 15, color: COLORS.primaryDark },
  emptyText: { color: COLORS.text, fontSize: 14, textAlign: 'center', marginVertical: 8 },
}); 