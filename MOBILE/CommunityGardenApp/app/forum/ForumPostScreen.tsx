import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { API_URL } from '../../constants/Config';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ForumPostScreen() {
  const { t } = useTranslation();
  const { postId } = useLocalSearchParams();
  const { token } = useAuth();
  const colors = useAccessibleColors();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [blockedError, setBlockedError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        const postResponse = await axios.get(`${API_URL}/forum/${postId}/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setPost(postResponse.data);

        const commentsResponse = await axios.get(`${API_URL}/forum/comments/?forum_post=${postId}`, {
          headers: { Authorization: `Token ${token}` },
        });
        setComments(commentsResponse.data);
        setLoading(false);
      } catch (error: any) {
        if (error.response && error.response.status === 403) {
          setBlockedError(true);
          router.back();
          return;
        } else if (error.response && error.response.status === 500) {
          setBlockedError(true);
          router.back();
          return;
        } else {
          Alert.alert(t('common.error'), t('forum.errors.fetchFailed'));
          return;
        }
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId, token]);

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert(t('common.error'), t('forum.errors.commentEmpty'));
      return;
    }
    try {
      const response = await axios.post(
        `${API_URL}/forum/comments/`,
        { forum_post: postId, content: commentText },
        { headers: { Authorization: `Token ${token}` } }
      );
      setComments([...comments, response.data]);
      setCommentText('');
    } catch (error) {
      Alert.alert(t('common.error'), t('forum.errors.commentFailed'));
    }
  };

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading || blockedError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!post) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>{post.title}</Text>
      <Text style={[styles.author, { color: colors.textSecondary }]}>{t('forum.post.by')} {post.author} • {formatDate(post.created_at)}</Text>
      <Text style={[styles.content, { color: colors.text }]}>{post.content}</Text>
      <Text style={[styles.commentsHeader, { color: colors.text }]}>{t('forum.post.comments')}</Text>
      <FlatList
        data={comments}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.commentCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commentAuthor, { color: colors.textSecondary }]}>{item.author} • {formatDate(item.created_at)}</Text>
            <Text style={[styles.commentContent, { color: colors.text }]}>{item.content}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('forum.post.noComments')}</Text>}
      />
      <View style={styles.commentInputContainer}>
        <TextInput
          style={[styles.commentInput, {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text
          }]}
          placeholder={t('forum.post.addComment')}
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={[styles.commentButton, { backgroundColor: colors.primary }]} onPress={handleAddComment}>
          <Text style={[styles.commentButtonText, { color: colors.white }]}>{t('forum.post.postComment')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  author: { fontSize: 14, marginBottom: 8 },
  content: { fontSize: 16, marginBottom: 16 },
  commentsHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  commentCard: { padding: 12, borderRadius: 8, marginBottom: 8 },
  commentAuthor: { fontSize: 12, marginBottom: 4 },
  commentContent: { fontSize: 14 },
  emptyText: { textAlign: 'center', marginTop: 20 },
  commentInputContainer: { flexDirection: 'row', marginTop: 16 },
  commentInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, marginRight: 8 },
  commentButton: { padding: 10, borderRadius: 8, justifyContent: 'center' },
  commentButtonText: { fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 