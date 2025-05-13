import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { API_URL, COLORS } from '@/constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';

interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
}

interface ForumComment {
  id: number;
  content: string;
  author: string;
  created_at: string;
}

export default function ForumPostScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const router = useRouter();

  const fetchPostAndComments = async () => {
    try {
      setLoading(true);
      const postResponse = await axios.get(`${API_URL}/forum/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setPost(postResponse.data);

      const commentsResponse = await axios.get(`${API_URL}/forum/comments/?forum_post=${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      setComments(commentsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching post data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }
    try {
      await axios.post(
        `${API_URL}/forum/comments/`,
        { forum_post: id, content: commentText },
        { headers: { Authorization: `Token ${token}` } }
      );
      setCommentText('');
      await fetchPostAndComments();
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
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
    <>
      <Stack.Screen
        options={{
          title: post?.title || 'Forum Post',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>{post?.title}</Text>
        <Text style={styles.author}>By {post?.author} • {post ? formatDate(post.created_at) : ''}</Text>
        <Text style={styles.content}>{post?.content}</Text>
        <Text style={styles.commentsHeader}>Comments</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{item.author} • {formatDate(item.created_at)}</Text>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No comments yet.</Text>}
        />
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.commentButton} onPress={handleAddComment}>
            <Text style={styles.commentButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: COLORS.background },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  author: { fontSize: 14, color: '#666', marginBottom: 8 },
  content: { fontSize: 16, marginBottom: 16 },
  commentsHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  commentCard: { backgroundColor: '#f0f4f8', padding: 12, borderRadius: 8, marginBottom: 8 },
  commentAuthor: { fontSize: 12, color: '#666', marginBottom: 4 },
  commentContent: { fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 20 },
  commentInputContainer: { flexDirection: 'row', marginTop: 16 },
  commentInput: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 8, marginRight: 8 },
  commentButton: { backgroundColor: COLORS.primary, padding: 10, borderRadius: 8, justifyContent: 'center' },
  commentButtonText: { color: 'white', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 