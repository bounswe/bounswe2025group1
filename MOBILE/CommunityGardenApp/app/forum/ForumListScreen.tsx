import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { API_URL, COLORS } from '@/constants/Config';
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.communityButton}
        onPress={() => router.push({ pathname: '/community' })}
      >
        <Text style={styles.communityButtonText}>{t('forum.goToCommunity')}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>{t('forum.title')}</Text>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !showFollowingOnly && styles.filterButtonActive]}
          onPress={() => setShowFollowingOnly(false)}
        >
          <Text style={[styles.filterButtonText, !showFollowingOnly && styles.filterButtonTextActive]}>
            {t('forum.filter.allPosts')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, showFollowingOnly && styles.filterButtonActive]}
          onPress={() => setShowFollowingOnly(true)}
        >
          <Text style={[styles.filterButtonText, showFollowingOnly && styles.filterButtonTextActive]}>
            {t('forum.filter.following')}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder={t('forum.searchPlaceholder')}
        value={searchTerm}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/forum/${item.id}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content}>{item.content.substring(0, 100)}...</Text>
            <Text style={styles.author}>{t('forum.post.by')} {item.author_username} • {formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('forum.noPosts')}</Text>}
      />
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/forum/create')}
      >
        <Text style={styles.createButtonText}>{t('forum.createPost')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: -45, paddingHorizontal:14 ,flex: 1, backgroundColor: COLORS.background },
  communityButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  communityButtonText: {
    color: 'white',
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
    borderColor: COLORS.primary,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  searchInput: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 8, marginBottom: 16 },
  card: { backgroundColor: '#f0f4f8', padding: 12, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { fontSize: 14, marginVertical: 4 },
  author: { fontSize: 12, color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 20 },
  createButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 16,marginBottom:30 },
  createButtonText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 