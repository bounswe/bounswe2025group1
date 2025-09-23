import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { API_URL, COLORS } from '@/constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Add a type for community members
interface CommunityMember {
  user_id: number;
  username: string;
  status: string;
}

export default function CommunityScreen() {
  const { token, user } = useAuth();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCommunityUsers = async () => {
      try {
        const profileRes = await axios.get(`${API_URL}/profile/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const username = profileRes.data.username;

        // Fetch who current user is already following
        const followingRes = await axios.get(`${API_URL}/profile/following/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const followed = followingRes.data.map((u: any) => u.id);
        setFollowingIds(followed);

        // Fetch user's accepted gardens
        const membershipRes = await axios.get(`${API_URL}/memberships/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const acceptedGardenIds = membershipRes.data
          .filter((m: any) => m.status === 'ACCEPTED' && m.username === username)
          .map((m: any) => m.garden);

        // Collect all unique users from those gardens
        const communitySet = new Map();

        for (const gardenId of acceptedGardenIds) {
          const res = await axios.get(`${API_URL}/memberships/?garden=${gardenId}`, {
            headers: { Authorization: `Token ${token}` },
          });

          for (const member of res.data) {
            if (
              member.username !== username &&
              member.status === 'ACCEPTED' &&
              !communitySet.has(member.user_id)
            ) {
              communitySet.set(member.user_id, member);
            }
          }
        }

        setMembers(Array.from(communitySet.values()));
      } catch (err) {
        console.error('Failed to fetch community members:', err);
      }
    };

    fetchCommunityUsers();
  }, []);

  const handleFollow = async (userId: number) => {
    try {
      await axios.post(
        `${API_URL}/profile/follow/`,
        { user_id: userId },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      Alert.alert('Followed successfully!');
      setFollowingIds(prev => [...prev, userId]);
    } catch (err) {
      Alert.alert('Error following user.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Community Members</Text>
      <FlatList
        data={members}
        keyExtractor={(item: CommunityMember) => item.user_id.toString()}
        renderItem={({ item }: { item: CommunityMember }) => (
            <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/user/${item.user_id}`)}
            activeOpacity={0.8}
            >
            <Text style={styles.username}>{item.username}</Text>
            {!followingIds.includes(item.user_id) && (
                <TouchableOpacity
                style={styles.followButton}
                onPress={(e) => {
                    e.stopPropagation(); // Prevent navigation
                    handleFollow(item.user_id);
                }}
                >
                <Text style={styles.followText}>Follow</Text>
                </TouchableOpacity>
            )}
            </TouchableOpacity>
            
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>No members found.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: -30,paddingHorizontal: 20, flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    backgroundColor: '#f0f4f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontSize: 16 },
  followButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followText: { color: 'white', fontWeight: 'bold' },
});
