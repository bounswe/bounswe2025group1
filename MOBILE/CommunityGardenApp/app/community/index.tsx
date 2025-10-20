import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { API_URL } from '@/constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Add a type for community members
interface CommunityMember {
  user_id: number;
  username: string;
  status: string;
}

export default function CommunityScreen() {
  const { token, user } = useAuth();
  const colors = useAccessibleColors();
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [followingIds, setFollowingIds] = useState<number[]>([]);
  const router = useRouter();
  const { t } = useTranslation();

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
      Alert.alert(t('common.success'), t('community.followSuccess'));
      setFollowingIds(prev => [...prev, userId]);
    } catch (err) {
      Alert.alert(t('common.error'), t('community.followError'));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{t('community.title')}</Text>
      <FlatList
        data={members}
        keyExtractor={(item: CommunityMember) => item.user_id.toString()}
        renderItem={({ item }: { item: CommunityMember }) => (
            <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/user/${item.user_id}`)}
            activeOpacity={0.8}
            >
            <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
            {!followingIds.includes(item.user_id) && (
                <TouchableOpacity
                style={[styles.followButton, { backgroundColor: colors.primary }]}
                onPress={(e) => {
                    e.stopPropagation(); // Prevent navigation
                    handleFollow(item.user_id);
                }}
                >
                <Text style={[styles.followText, { color: colors.white }]}>{t('community.follow')}</Text>
                </TouchableOpacity>
            )}
            </TouchableOpacity>
            
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('community.noMembers')}</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: -30, paddingHorizontal: 20, flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  card: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: { fontSize: 16 },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followText: { fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 20 },
});
