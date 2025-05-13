import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL, COLORS } from '../../constants/Config';

export default function UserProfileScreen() {
  const { token, user } = useAuth();
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/profile/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setUserData(res.data);

        // Check if following
        const followingRes = await axios.get(`${API_URL}/profile/following/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setIsFollowing(followingRes.data.some((u: any) => String(u.id) === String(id)));
      } catch (err) {
        setError('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    try {
      await axios.post(
        `${API_URL}/profile/follow/`,
        { user_id: id },
        { headers: { Authorization: `Token ${token}` } }
      );
      setIsFollowing(true);
    } catch (err) {
      alert('Error following user.');
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.post(
        `${API_URL}/profile/unfollow/`,
        { user_id: id },
        { headers: { Authorization: `Token ${token}` } }
      );
      setIsFollowing(false);
    } catch (err) {
      alert('Error unfollowing user.');
    }
  };

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

        {/* Only show follow/unfollow if not own profile */}
        {userData && user && String(userData.id) !== String(user.id) && (
          isFollowing ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: COLORS.primary, marginBottom: 8 }}>You are following this user.</Text>
              <TouchableOpacity style={styles.unfollowButton} onPress={handleUnfollow}>
                <Text style={styles.unfollowButtonText}>Unfollow</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
            </View>
          )
        )}
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
  followButton: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, marginTop: 12 },
  followButtonText: { color: 'white', fontWeight: 'bold' },
  unfollowButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginTop: 12 },
  unfollowButtonText: { color: '#d00', fontWeight: 'bold' },
});