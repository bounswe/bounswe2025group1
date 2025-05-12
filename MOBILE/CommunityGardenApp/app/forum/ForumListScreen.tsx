import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { API_URL, COLORS } from '@/constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function ForumListScreen() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axios.get(`${API_URL}/forum/`, {
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
  }, [token]);

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text === '') {
      setFilteredPosts(posts);
      return;
    }
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(text.toLowerCase()) || 
      post.content.toLowerCase().includes(text.toLowerCase()) || 
      (post.author && post.author.toString().toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredPosts(filtered);
  };

  const formatDate = (dateString) => {
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
      <Text style={styles.header}>Community Forum</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search posts..."
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
            <Text style={styles.author}>By {item.author} • {formatDate(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts found.</Text>}
      />
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/forum/create')}
      >
        <Text style={styles.createButtonText}>Create Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  searchInput: { height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 8, marginBottom: 16 },
  card: { backgroundColor: '#f0f4f8', padding: 12, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { fontSize: 14, marginVertical: 4 },
  author: { fontSize: 12, color: '#666' },
  emptyText: { textAlign: 'center', marginTop: 20 },
  createButton: { backgroundColor: COLORS.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  createButtonText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 