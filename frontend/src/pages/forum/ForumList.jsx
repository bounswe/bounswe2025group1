import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import ForumCreateDialog from '../../components/ForumCreateDialog';
import CommentCreateDialog from '../../components/CommentCreateDialog';
import InlineImageUpload from '../../components/InlineImageUpload';
import PostCard from '../../components/PostCard';
import PostComposer from '../../components/PostComposer';
import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import { createButtonKeyboardHandler } from '../../utils/keyboardNavigation';

const ForumList = () => {
  const { t, i18n } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [followedOnly, setFollowedOnly] = useState(false);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const isValidToken = (t) =>
          t !== null

        const headers = {
          'Content-Type': 'application/json',
        };
        if (isValidToken(token)) {
          headers['Authorization'] = `Token ${token.trim()}`;
        }

        const url = followedOnly 
          ? `${import.meta.env.VITE_API_URL}/forum?include_comments=true&following=true`
          : `${import.meta.env.VITE_API_URL}/forum?include_comments=true`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
          // Only show error for authenticated users
          if (token) {
            toast.error(t('errors.failedToFetchPosts'));
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPosts(data);
        setFilteredPosts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching posts:', error);
        // Only show error for authenticated users
        if (token) {
          toast.error(t('errors.failedToFetchPosts'));
        }
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token, followedOnly, t]);

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    if (value === '') {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(value) ||
        post.content.toLowerCase().includes(value) ||
        (post.author_username && post.author_username.toString().toLowerCase().includes(value))
    );

    setFilteredPosts(filtered);
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setFilteredPosts([newPost, ...filteredPosts]);
    setCreateDialogOpen(false);

    // Navigate to the new post view
    navigate(`/forum/${newPost.id}`);
  };

  const handleOpenCommentDialog = (postId) => {
    setSelectedPostId(postId);
    setCommentDialogOpen(true);
  };

  const handleCommentCreated = () => {
    setCommentDialogOpen(false);

    // Navigate to the post view to see the comment
    navigate(`/forum/${selectedPostId}`);
  };

  const handlePostSubmit = async (postData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          title: postData.content.substring(0, 100) + (postData.content.length > 100 ? '...' : ''),
          content: postData.content,
          images_base64: postData.images,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to create post');
        return;
      }

      const newPost = await response.json();
      setPosts([newPost, ...posts]);
      setFilteredPosts([newPost, ...filteredPosts]);
      
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    }
  };


  const handlePostComment = async (postId, commentData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          forum_post: postId,
          content: commentData.content,
          images_base64: commentData.images,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to post comment');
        return;
      }

      const newComment = await response.json();
      
      // Update the posts list to include the new comment
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), newComment],
                comments_count: (post.comments_count || 0) + 1
              }
            : post
        )
      );
      
      setFilteredPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                comments: [...(post.comments || []), newComment],
                comments_count: (post.comments_count || 0) + 1
              }
            : post
        )
      );
      
      toast.success('Comment posted successfully!');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        toast.error('Failed to delete post');
        return;
      }

      // Remove the post from the local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      setFilteredPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center', mb: 2 }}
        >
          <ForumIcon />
          <Box sx={{ ml: 2 }} />
          {t('forum.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ textAlign: 'left' }}>
          {t('forum.subtitle')}
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              ref={searchRef}
              fullWidth
              placeholder={t('forum.searchPlaceholder')}
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'background.default',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                  },
                  '& fieldset': {
                    borderColor: 'divider',
                    borderWidth: '1px',
                  },
                  '&:hover fieldset': {
                    borderColor: 'text.secondary',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#558b2f',
                    borderWidth: '2px',
                  },
                  '&:focus-within': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                },
              }}
              inputProps={{
                'aria-label': 'Search forum posts',
                'aria-describedby': 'search-help-text'
              }}
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            {user && (
              <>
                <Button
                  variant={followedOnly ? 'contained' : 'outlined'}
                  startIcon={<PeopleIcon />}
                  onClick={() => setFollowedOnly(!followedOnly)}
                  onKeyDown={createButtonKeyboardHandler(() => setFollowedOnly(!followedOnly))}
                  sx={{
                    bgcolor: followedOnly ? '#558b2f' : 'transparent',
                    color: followedOnly ? 'white' : '#558b2f',
                    borderColor: '#558b2f',
                    '&:hover': { 
                      bgcolor: followedOnly ? '#33691e' : 'rgba(85, 139, 47, 0.08)',
                      borderColor: '#33691e',
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                      marginLeft: 1,
                    },
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label={followedOnly ? "Show all posts" : "Show posts from followed users only"}
                  aria-pressed={followedOnly}
                >
                  {followedOnly ? t('forum.showAll') : t('forum.following')}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  onKeyDown={createButtonKeyboardHandler(() => setCreateDialogOpen(true))}
                  sx={{
                    bgcolor: '#558b2f',
                    '&:hover': { bgcolor: '#33691e' },
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                      marginLeft: 1,
                    },
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label="Create new forum post"
                >
                  {t('forum.newPost')}
                </Button>
              </>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Post Composer */}
      {user && (
        <PostComposer
          currentUser={user}
          onSubmit={handlePostSubmit}
          placeholder={t('forum.whatsOnYourMind')}
        />
      )}

      {/* Forum Posts */}
      {filteredPosts.length > 0 ? (
        <Box>
          {filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              isOwner={post.author === user?.id}
              onComment={handlePostComment}
              onEdit={(post) => navigate(`/forum/${post.id}`)}
              onDelete={(postId) => handleDeletePost(postId)}
            />
          ))}
        </Box>
      ) : (
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            {t('forum.noPostsFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {searchTerm ? t('forum.tryDifferentSearchTerm') : t('forum.beFirstToCreatePost')}
          </Typography>
        </Box>
      )}


      {/* Dialog Components */}
      <ForumCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <CommentCreateDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        postId={selectedPostId}
        onCommentCreated={handleCommentCreated}
      />
    </Container>
  );
};

export default ForumList;
