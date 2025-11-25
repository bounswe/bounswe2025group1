import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { API_URL } from '@/constants/Config';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

// Add ForumPost type
interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  author_username: string;
  created_at: string;
}

export default function ForumListScreen() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<ForumPost[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const url = showFollowingOnly
          ? `${API_URL}/forum/?following=true`
          : `${API_URL}/forum/`;
        const response = await axios.get(url, {
          headers: { Authorization: `Token ${token}` },
        });
        setPosts(response.data);
        setFilteredPosts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forum posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token, showFollowingOnly]);

  const handleSearch = (text: string) => {
    setSearchTerm(text);
    if (text === '') {
      setFilteredPosts(posts);
      return;
    }
    const filtered = posts.filter((post: ForumPost) => 
      post.title.toLowerCase().includes(text.toLowerCase()) || 
      post.content.toLowerCase().includes(text.toLowerCase()) || 
      (post.author && post.author.toString().toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredPosts(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.communityButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push({ pathname: '/community' })}
      >
        <Text style={[styles.communityButtonText, { color: colors.white }]}>{t('forum.goToCommunity')}</Text>
      </TouchableOpacity>
      <Text style={[styles.header, { color: colors.text }]}>{t('forum.title')}</Text>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, { 
            borderColor: colors.primary,
            backgroundColor: !showFollowingOnly ? colors.primary : colors.surface 
          }]}
          onPress={() => setShowFollowingOnly(false)}
        >
          <Text style={[styles.filterButtonText, { 
            color: !showFollowingOnly ? colors.white : colors.primary 
          }]}>
            {t('forum.filter.allPosts')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, { 
            borderColor: colors.primary,
            backgroundColor: showFollowingOnly ? colors.primary : colors.surface 
          }]}
          onPress={() => setShowFollowingOnly(true)}
        >
          <Text style={[styles.filterButtonText, { 
            color: showFollowingOnly ? colors.white : colors.primary 
          }]}>
            {t('forum.filter.following')}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.searchInput, { 
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.text 
        }]}
        placeholder={t('forum.searchPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        value={searchTerm}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/forum/${item.id}`)}
            activeOpacity={0.8}
          >
            <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.content, { color: colors.textSecondary }]}>{item.content.substring(0, 100)}...</Text>
            <Text style={[styles.author, { color: colors.textSecondary }]}>{t('forum.post.by')} {item.author_username} • {formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('forum.noPosts')}</Text>}
      />
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/forum/create')}
      >
        <Text style={[styles.createButtonText, { color: colors.white }]}>{t('forum.createPost')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: -45, paddingHorizontal:14 ,flex: 1 },
  communityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  communityButtonText: {
    fontWeight: '600',
  },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginBottom: 16 },
  card: { padding: 12, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { fontSize: 14, marginVertical: 4 },
  author: { fontSize: 12 },
  emptyText: { textAlign: 'center', marginTop: 20 },
  createButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 16,marginBottom:30 },
  createButtonText: { fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 