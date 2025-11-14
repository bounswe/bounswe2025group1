// File: services/__tests__/forum.test.ts

import axios from 'axios';
import {
  validateForumPostInput,
  isNonEmptyText,
  createForumPostPayload,
  createForumCommentPayload,
  filterForumPosts,
  formatForumDate,
  fetchForumPosts,
  fetchForumPostById,
  createForumPost,
  fetchForumComments,
  createForumComment,
  ForumPost,
  ForumComment,
} from '../forum';
import { API_URL } from '../../constants/Config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Forum service helpers', () => {
  describe('validateForumPostInput', () => {
    it('returns valid when both title and content are provided', () => {
      const result = validateForumPostInput('My Title', 'Some meaningful content');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty title', () => {
      const result = validateForumPostInput('', 'Content');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title is required');
    });

    it('rejects overly long title', () => {
      const longTitle = 'a'.repeat(201);
      const result = validateForumPostInput(longTitle, 'Content');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Title must be 200 characters or less');
    });

    it('rejects empty content', () => {
      const result = validateForumPostInput('Title', '   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content is required');
    });

    it('rejects overly long content', () => {
      const longContent = 'a'.repeat(5001);
      const result = validateForumPostInput('Title', longContent);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Content must be 5000 characters or less');
    });
  });

  describe('isNonEmptyText', () => {
    it('detects non-empty input', () => {
      expect(isNonEmptyText('Hello')).toBe(true);
      expect(isNonEmptyText('  hello  ')).toBe(true);
    });

    it('rejects empty or whitespace input', () => {
      expect(isNonEmptyText('')).toBe(false);
      expect(isNonEmptyText('   ')).toBe(false);
    });
  });

  describe('payload creators', () => {
    it('createForumPostPayload trims inputs', () => {
      const payload = createForumPostPayload('  Title  ', '  Content  ');
      expect(payload).toEqual({ title: 'Title', content: 'Content' });
    });

    it('createForumCommentPayload trims content and keeps post id', () => {
      const payload = createForumCommentPayload(42, '  Nice post!  ');
      expect(payload).toEqual({ forum_post: 42, content: 'Nice post!' });
    });
  });

  describe('filterForumPosts', () => {
    const posts: ForumPost[] = [
      {
        id: 1,
        title: 'Gardening Tips',
        content: 'Water tomatoes in the morning.',
        author: 'Alice',
        created_at: '2024-05-01T12:00:00Z',
      },
      {
        id: 2,
        title: 'Composting 101',
        content: 'Composting is great for soil health.',
        author: 'Bob',
        created_at: '2024-05-02T12:00:00Z',
      },
    ];

    it('returns all posts when search term is empty', () => {
      expect(filterForumPosts(posts, '')).toEqual(posts);
      expect(filterForumPosts(posts, '   ')).toEqual(posts);
    });

    it('filters posts by title, content, and author', () => {
      expect(filterForumPosts(posts, 'tips')).toEqual([posts[0]]);
      expect(filterForumPosts(posts, 'soil')).toEqual([posts[1]]);
      expect(filterForumPosts(posts, 'bob')).toEqual([posts[1]]);
    });

    it('returns empty array when no matches', () => {
      expect(filterForumPosts(posts, 'orchids')).toEqual([]);
    });

    it('returns empty array when posts list is invalid', () => {
      // @ts-expect-error intentional misuse to test guard clause
      expect(filterForumPosts(undefined, 'anything')).toEqual([]);
    });
  });

  describe('formatForumDate', () => {
    it('formats valid dates', () => {
      expect(formatForumDate('2025-01-15T00:00:00Z')).toBe('Jan 15, 2025');
    });

    it('returns empty string for invalid date', () => {
      expect(formatForumDate('invalid-date')).toBe('');
    });
  });
});

describe('Forum service API calls', () => {
  const token = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchForumPosts', () => {
    it('fetches all posts', async () => {
      const mockPosts: ForumPost[] = [
        { id: 1, title: 'Title', content: 'Content', author: 'Alice', created_at: '' },
      ];
      mockedAxios.get.mockResolvedValue({ data: mockPosts });

      const result = await fetchForumPosts(token);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/forum/`, {
        headers: { Authorization: `Token ${token}` },
      });
      expect(result).toEqual(mockPosts);
    });

    it('fetches following-only posts when specified', async () => {
      mockedAxios.get.mockResolvedValue({ data: [] });

      await fetchForumPosts(token, { followingOnly: true });

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/forum/?following=true`, {
        headers: { Authorization: `Token ${token}` },
      });
    });
  });

  describe('fetchForumPostById', () => {
    it('fetches a post by id', async () => {
      const post: ForumPost = {
        id: 1,
        title: 'Title',
        content: 'Content',
        author: 'Alice',
        created_at: '',
      };
      mockedAxios.get.mockResolvedValue({ data: post });

      const result = await fetchForumPostById(1, token);

      expect(mockedAxios.get).toHaveBeenCalledWith(`${API_URL}/forum/1/`, {
        headers: { Authorization: `Token ${token}` },
      });
      expect(result).toEqual(post);
    });
  });

  describe('createForumPost', () => {
    it('creates a new post', async () => {
      const payload = { title: 'New Post', content: 'Content' };
      const post: ForumPost = { id: 1, ...payload, author: 'Alice', created_at: '' };
      mockedAxios.post.mockResolvedValue({ data: post });

      const result = await createForumPost(payload, token);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL}/forum/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      expect(result).toEqual(post);
    });
  });

  describe('fetchForumComments', () => {
    it('fetches comments for a post', async () => {
      const comments: ForumComment[] = [
        { id: 1, forum_post: 1, content: 'Nice', author: 'Bob', created_at: '' },
      ];
      mockedAxios.get.mockResolvedValue({ data: comments });

      const result = await fetchForumComments(1, token);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${API_URL}/forum/comments/?forum_post=1`,
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      expect(result).toEqual(comments);
    });
  });

  describe('createForumComment', () => {
    it('creates a new comment', async () => {
      const payload = { forum_post: 1, content: 'Great post!' };
      const comment: ForumComment = { id: 1, ...payload, author: 'Alice', created_at: '' };
      mockedAxios.post.mockResolvedValue({ data: comment });

      const result = await createForumComment(payload, token);

      expect(mockedAxios.post).toHaveBeenCalledWith(`${API_URL}/forum/comments/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      expect(result).toEqual(comment);
    });
  });
});

