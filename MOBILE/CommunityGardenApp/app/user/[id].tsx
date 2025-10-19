import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../constants/Config';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';

// @ts-nocheck

export default function UserProfileScreen() {
  const { token, user } = useAuth();
  const colors = useAccessibleColors();
  const { id } = useLocalSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [gardens, setGardens] = useState<any[]>([]);

  const checkBlocking = async (userId: string | number | string[]) => {
    try {
      // Handle array case by taking first element
      const userIdParam = Array.isArray(userId) ? userId[0] : userId;
      const response = await axios.get(`${API_URL}/profile/block/?user_id=${userIdParam}`, {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error checking blocking status:', error);
      return { can_interact: true }; // Default to allowing if check fails
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Handle array case by taking first element
        const userId = Array.isArray(id) ? id[0] : id;
        const blockStatus = await checkBlocking(userId);
        if (!blockStatus.can_interact) {
          setError("You cannot view this profile due to blocking restrictions.");
          setLoading(false);
          return;
        }
        const res = await axios.get(`${API_URL}/profile/${userId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setUserData(res.data);

        // Fetch user's gardens via memberships
        const membershipsRes = await axios.get(`${API_URL}/memberships/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const userMemberships = membershipsRes.data.filter((m: any) => m.user_id === Number(userId) && m.status === 'ACCEPTED');
        const gardenIds = userMemberships.map((m: any) => m.garden);
        const gardenDetails = await Promise.all(
          gardenIds.map((gid: any) =>
            axios.get(`${API_URL}/gardens/${gid}/`, { headers: { Authorization: `Token ${token}` } }).then(res => res.data)
          )
        );
        setGardens(gardenDetails);

        // Check if following
        const followingRes = await axios.get(`${API_URL}/profile/following/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setIsFollowing(followingRes.data.some((u: any) => String(u.id) === String(userId)));

        // Check if blocked
        // REMOVE THIS BLOCK (it causes a 400 error)
        // const blockedRes = await axios.get(`${API_URL}/profile/block/`, {
        //   headers: { Authorization: `Token ${token}` },
        // });
        // setIsBlocked(blockedRes.data.some((u: any) => String(u.id) === String(id)));
      } catch (err: any) {
        console.error('Profile fetch error:', err, err?.response?.data);
        if (err.response?.status === 403) {
          setError('You cannot view this profile due to blocking restrictions.');
        } else {
          setError('Failed to load user profile.');
        }
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
    } catch (err: any) {
      if (err.response?.status === 403) {
        Alert.alert('Error', 'You cannot follow this user due to blocking restrictions.');
      } else {
        Alert.alert('Error', 'Error following user.');
      }
    }
  };

  const handleUnfollow = async () => {
    try {
      await axios.delete(
        `${API_URL}/profile/follow/`,
        { 
          data: { user_id: Number(id) },
          headers: { Authorization: `Token ${token}` } 
        }
      );
      setIsFollowing(false);
    } catch (err) {
      Alert.alert('Error', 'Error unfollowing user.');
    }
  };

  const handleBlock = async () => {
    try {
      await axios.post(
        `${API_URL}/profile/block/`,
        { user_id: id },
        { headers: { Authorization: `Token ${token}` } }
      );
      setIsBlocked(true);
      setIsFollowing(false); // Unfollow when blocking
      Alert.alert('Success', 'User has been blocked.');
      router.back(); // Go back to previous screen
    } catch (err: any) {
      if (err.response?.status === 400) {
        Alert.alert('Error', 'You cannot block yourself.');
      } else {
        Alert.alert('Error', 'Error blocking user.');
      }
    }
  };

  const handleUnblock = async () => {
    try {
      await axios.delete(
        `${API_URL}/profile/block/`,
        { 
          data: { user_id: Number(id) },
          headers: { Authorization: `Token ${token}` } 
        }
      );
      setIsBlocked(false);
      Alert.alert('Success', 'User has been unblocked.');
    } catch (err) {
      Alert.alert('Error', 'Error unblocking user.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.error }}>{error}</Text>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.username, { color: colors.primary }]}>@{userData.username}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Name:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{userData.first_name || ''} {userData.last_name || ''}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Email:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{userData.email || 'Hidden'}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Location:</Text>
        <Text style={[styles.value, { color: colors.textSecondary }]}>{userData.profile?.location || 'Unknown'}</Text>

        <Text style={[styles.label, { color: colors.text }]}>Gardens:</Text>
        {gardens && gardens.length > 0 ? (
          gardens.map((garden: any) => (
            <Text key={garden.id} style={[styles.value, { color: colors.textSecondary }]}>{garden.name}</Text>
          ))
        ) : (
          <Text style={[styles.value, { color: colors.textSecondary }]}>No gardens</Text>
        )}

        {/* Only show follow/unfollow and block/unblock if not own profile */}
        {userData && user && String(userData.id) !== String(user.id) && (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={[isFollowing ? styles.unfollowButtonSmall : styles.followButtonSmall, {
                backgroundColor: isFollowing ? colors.surface : colors.primary
              }]}
              onPress={isFollowing ? handleUnfollow : handleFollow}
            >
              <Text style={[isFollowing ? styles.unfollowButtonTextSmall : styles.followButtonTextSmall, {
                color: isFollowing ? colors.error : colors.white
              }]}>
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Text>
            </TouchableOpacity>
            {/* Only show block/unblock if not own profile, and use checkBlocking result for UI if needed */}
            <TouchableOpacity style={[styles.blockIconButton, { backgroundColor: colors.error }]} onPress={isBlocked ? handleUnblock : handleBlock}>
              <Text style={[styles.blockIconText, { color: colors.white }]}>🚫</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: { fontWeight: 'bold', marginTop: 12 },
  value: { fontSize: 16, marginBottom: 8 },
  actionButtonsRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
  },
  followButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  followButtonTextSmall: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  unfollowButtonSmall: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  unfollowButtonTextSmall: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  blockIconButton: {
    padding: 8,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  blockIconText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});