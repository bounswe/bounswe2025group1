import axios from 'axios';
import { API_URL } from '../constants/Config';

export interface ForumPost {
  id: number;
  title: string;
  content: string;
  author: string;
  author_username?: string;
  created_at: string;
  updated_at?: string;
}

export interface ForumComment {
  id: number;
  forum_post: number;
  content: string;
  author: string;
  created_at: string;
}

export interface CreateForumPostPayload {
  title: string;
  content: string;
}

export interface CreateForumCommentPayload {
  forum_post: number | string;
  content: string;
}

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 5000;

export const validateForumPostInput = (
  title: string,
  content: string
): { isValid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Title is required' };
  }

  if (title.trim().length > MAX_TITLE_LENGTH) {
    return { isValid: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or less` };
  }

  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Content is required' };
  }

  if (content.trim().length > MAX_CONTENT_LENGTH) {
    return { isValid: false, error: `Content must be ${MAX_CONTENT_LENGTH} characters or less` };
  }

  return { isValid: true };
};

export const isNonEmptyText = (value: string): boolean => value.trim().length > 0;

export const createForumPostPayload = (title: string, content: string): CreateForumPostPayload => ({
  title: title.trim(),
  content: content.trim(),
});

export const createForumCommentPayload = (
  forumPostId: number | string,
  content: string
): CreateForumCommentPayload => ({
  forum_post: forumPostId,
  content: content.trim(),
});

export const filterForumPosts = (posts: ForumPost[], searchTerm: string): ForumPost[] => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  const normalizedTerm = searchTerm?.trim().toLowerCase();
  if (!normalizedTerm) {
    return posts;
  }

  return posts.filter((post) => {
    const title = post.title?.toLowerCase() ?? '';
    const content = post.content?.toLowerCase() ?? '';
    const author =
      (post.author ?? post.author_username ?? '').toString().toLowerCase();

    return (
      title.includes(normalizedTerm) ||
      content.includes(normalizedTerm) ||
      author.includes(normalizedTerm)
    );
  });
};

export const formatForumDate = (dateInput: string | number | Date): string => {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

export const fetchForumPosts = async (
  token: string,
  options: { followingOnly?: boolean } = {}
): Promise<ForumPost[]> => {
  const url = options.followingOnly
    ? `${API_URL}/forum/?following=true`
    : `${API_URL}/forum/`;

  const response = await axios.get(url, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const fetchForumPostById = async (
  postId: number | string,
  token: string
): Promise<ForumPost> => {
  const response = await axios.get(`${API_URL}/forum/${postId}/`, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const createForumPost = async (
  payload: CreateForumPostPayload,
  token: string
): Promise<ForumPost> => {
  const response = await axios.post(`${API_URL}/forum/`, payload, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

export const fetchForumComments = async (
  forumPostId: number | string,
  token: string
): Promise<ForumComment[]> => {
  const response = await axios.get(
    `${API_URL}/forum/comments/?forum_post=${forumPostId}`,
    {
      headers: { Authorization: `Token ${token}` },
    }
  );
  return response.data;
};

export const createForumComment = async (
  payload: CreateForumCommentPayload,
  token: string
): Promise<ForumComment> => {
  const response = await axios.post(`${API_URL}/forum/comments/`, payload, {
    headers: { Authorization: `Token ${token}` },
  });
  return response.data;
};

