import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, COLORS } from '../../constants/Config';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAccessibleColors, useAccessibleTheme } from '../../contexts/AccessibilityContextSimple';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const TABS = [
  { key: 'Gardens', label: 'profile.gardens' },
  { key: 'Followers', label: 'profile.followers' },
  { key: 'Following', label: 'profile.following' }
];

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const colors = useAccessibleColors();
  const theme = useAccessibleTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        router.replace('/auth/login');
        return;
      }
      fetchProfile();  // always re-fetch to sync followers/following
    }, [token])
  );


  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 16 }}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primaryDark} />
          <Text style={{ color: COLORS.primaryDark, fontWeight: 'bold', marginLeft: 4 }}>Back</Text>
        </TouchableOpacity>
      ),
      headerTitle: 'Garden Detail',
    });
  }, [navigation]);


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
      const headers = { Authorization: `Token ${token}` };
      const url = `${API_URL}/profile/`;
      console.log('Fetching profile from:', url, 'with token:', token);
      const [profileRes, membershipsRes, followersRes, followingRes] = await Promise.all([
        axios.get(`${API_URL}/profile/`, { headers }),
        axios.get(`${API_URL}/memberships/`, { headers }),
        axios.get(`${API_URL}/profile/followers/`, { headers }),
        axios.get(`${API_URL}/profile/following/`, { headers }),
      ]);
      
      const acceptedGardenIds = membershipsRes.data
        .filter(m => m.status === 'ACCEPTED' && m.username === profileRes.data.username)
        .map(m => m.garden);
      

      const gardenDetails = await Promise.all(
        acceptedGardenIds.map(id =>
          axios.get(`${API_URL}/gardens/${id}/`, { headers }).then(res => res.data)
        )
      );
      

      setProfile(profileRes.data);
      setGardens(gardenDetails);
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
    await logout();
    router.replace('/auth/login');
  };

  const handleUnfollow = async (userId: number) => {
    try {
      console.log('Unfollowing user with ID:', userId);
      await axios.delete(
        `${API_URL}/profile/follow/`,
        { 
          data: { user_id: Number(userId) },
          headers: { Authorization: `Token ${token}` } 
        }
      );
      setFollowing(prev => prev.filter((u: any) => u.id !== userId));
    } catch (err) {
      alert('Error unfollowing user.');
    }
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
  const renderGarden = ({ item }: { item: any }) => (
    <View style={[styles.gardenCard, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <Text style={[styles.gardenName, { color: colors.text }]}>{item.name}</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/garden/[id]',
              params: { id: item.id.toString() },
            })
          }
        >
            <Text style={[styles.detailButtonText, { color: colors.primary }]}>{t('profile.goToDetail')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Ionicons name="person-circle-outline" size={80} color={colors.primary} style={{ marginBottom: 8 }} />
        <Text style={[styles.username, { color: colors.text }]}>{profile.username}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{profile.email}</Text>
        <Text style={[styles.location, { color: colors.textSecondary }]}>{profile.profile?.location}</Text>
        
        <View style={styles.settingsRow}>
          <LanguageSwitcher variant="modal" style={styles.languageSwitcher} />
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.error }]} 
            onPress={handleLogout}
            accessibilityLabel="Logout"
            accessibilityHint="Sign out of your account"
          >
            <Text style={[styles.logoutText, { color: colors.white }]}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.tabsRow, { borderColor: colors.border }]}>
        {TABS.map((tabItem, idx) => (
          <TouchableOpacity
            key={tabItem.key}
            style={[styles.tab, tab === idx && { borderBottomColor: colors.primary }]}
            onPress={() => setTab(idx)}
          >
            <Text style={[styles.tabText, {
              color: tab === idx ? colors.primary : colors.text,
              fontWeight: tab === idx ? 'bold' : 'normal'
            }]}>{t(tabItem.label)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContent}>
        {tab === 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.gardens')}</Text>
            <FlatList
              data={gardens}
              keyExtractor={(item, index) => item?.id?.toString() || `fallback-${index}`}
              renderItem={renderGarden} // <-- use your extracted function here
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('profile.noGardens')}</Text>}
            />
          </View>
        )}


        {tab === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.followers')}</Text>
            <FlatList
              data={followers}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => router.push(`/user/${item.id}`)}
                  style={[styles.followerCard, { backgroundColor: colors.surface }]}
                >
                  <Ionicons name="person-outline" size={24} color={colors.primary} />
                  <Text style={[styles.followerName, { color: colors.text }]}>{item.username}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('profile.noFollowers')}</Text>}
            />
          </View>
        )}

        {tab === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.following')}</Text>
            <FlatList
              data={following}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <View style={[styles.followerCard, { backgroundColor: colors.surface }]}>
                  <TouchableOpacity
                    onPress={() => router.push(`/user/${item.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                  >
                    <Ionicons name="person-outline" size={24} color={colors.primary} />
                    <Text style={[styles.followerName, { color: colors.text }]}>{item.username}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.unfollowButton, { backgroundColor: colors.secondary }]}
                    onPress={() => handleUnfollow(item.id)}
                  >
                    <Text style={[styles.unfollowButtonText, { color: colors.error }]}>{t('profile.unfollow')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('profile.notFollowing')}</Text>}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 18, marginBottom: 16 },
  header: { alignItems: 'center', padding: 24, borderBottomWidth: 1, borderColor: '#e0e0e0' },
  username: { fontSize: 22, fontWeight: 'bold' },
  email: { fontSize: 15 },
  location: { fontSize: 14, marginBottom: 8 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  languageSwitcher: { flex: 1, marginRight: 12 },
  logoutButton: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 8 },
  logoutText: { fontWeight: 'bold', fontSize: 15 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 16 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 16 },
  tabContent: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  gardenCard: { borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  gardenName: { fontWeight: 'bold', fontSize: 15 },
  gardenDesc: { fontSize: 13 },
  followerCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1 },
  followerName: { marginLeft: 10, fontSize: 15 },
  emptyText: { fontSize: 14, textAlign: 'center', marginVertical: 8 },
  detailButtonText: { fontSize: 16, fontWeight: '600' },
  row: {flexDirection: 'row',justifyContent: 'space-between',alignItems: 'center',},
  unfollowButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 10,
  },
  unfollowButtonText: {
    fontWeight: 'bold',
  },
});
