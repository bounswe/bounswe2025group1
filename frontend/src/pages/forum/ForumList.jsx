import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import PostCard from '../../components/PostCard';
import PostComposer from '../../components/PostComposer';
import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const { user, token } = useAuth();
  const navigate = useNavigate();

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

        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum?include_comments=true`, { headers });

        if (!response.ok) {
          toast.error('Failed to fetch posts');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPosts(data);
        setFilteredPosts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forum posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}
          >
            <ForumIcon sx={{ mr: 1 }} /> Community Forum
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ textAlign: 'left' }}>
          Join discussions, share gardening tips, and connect with fellow garden enthusiasts.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          placeholder="Search posts..."
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
              backgroundColor: '#f5f5f5',
              '&:hover': {
                backgroundColor: '#eeeeee',
              },
              '&.Mui-focused': {
                backgroundColor: 'white',
              },
              '& fieldset': {
                border: 'none',
              },
            },
          }}
        />
      </Paper>

      {/* Post Composer */}
      {user && (
        <PostComposer
          currentUser={user}
          onSubmit={handlePostSubmit}
          placeholder="What's on your mind?"
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
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {searchTerm ? 'Try a different search term' : 'Be the first to create a post!'}
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ForumList;
