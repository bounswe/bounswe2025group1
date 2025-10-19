import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Avatar,
  Paper,
  Fab,
  Tooltip,
  ButtonBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import ForumCreateDialog from '../../components/ForumCreateDialog';
import CommentCreateDialog from '../../components/CommentCreateDialog';
import InlineImageUpload from '../../components/InlineImageUpload';
import PostCard from '../../components/PostCard';
import PostComposer from '../../components/PostComposer';
import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createListNavigation, createButtonKeyboardHandler, createLinkKeyboardHandler } from '../../utils/keyboardNavigation';

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // Modern UI state
  const [useModernStyle, setUseModernStyle] = useState(true);

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const postRefs = useRef([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/?include_comments=true`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

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

  const handleModernPostSubmit = async (postData) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Create keyboard navigation for the forum posts
  const listNavigation = createListNavigation(
    filteredPosts,
    (post, index) => {
      navigate(`/forum/${post.id}`);
    },
    (post, index) => {
      // Focus the post item
      if (postRefs.current[index]) {
        postRefs.current[index].focus();
      }
    }
  );

  // Handle keyboard navigation for the entire forum list
  const handleListKeyDown = (event) => {
    listNavigation.handleKeyDown(event);
  };

  // Set up refs for each post item
  useEffect(() => {
    postRefs.current = postRefs.current.slice(0, filteredPosts.length);
  }, [filteredPosts.length]);

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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}
          >
            <ForumIcon sx={{ mr: 1 }} /> Community Forum
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setUseModernStyle(!useModernStyle)}
            sx={{
              borderColor: '#558b2f',
              color: '#558b2f',
              textTransform: 'none',
            }}
          >
            {useModernStyle ? 'Classic View' : 'Modern Style'}
          </Button>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ textAlign: 'left' }}>
          Join discussions, share gardening tips, and connect with fellow garden enthusiasts.
        </Typography>
      </Box>

      {/* Search Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <TextField
          ref={searchRef}
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

      {/* Modern Post Composer */}
      {useModernStyle && user && (
            <PostComposer
          currentUser={user}
          onSubmit={handleModernPostSubmit}
          placeholder="What's on your mind?"
        />
      )}

      {/* Forum Posts */}
      {filteredPosts.length > 0 ? (
        <Box>
          {useModernStyle ? (
            // Modern-style posts
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                isOwner={post.author === user?.id}
                onComment={handlePostComment}
                onEdit={(post) => navigate(`/forum/${post.id}`)}
                onDelete={(postId) => handleDeletePost(postId)}
              />
            ))
          ) : (
            // Classic-style posts
            <Box onKeyDown={handleListKeyDown} role="list" aria-label="Forum posts">
              {filteredPosts.map((post, index) => (
                <Card
                  key={post.id}
                  ref={(el) => (postRefs.current[index] = el)}
                  component="div"
                  sx={{
                    mb: 3,
                    width: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    },
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/forum/${post.id}`);
                    }
                  }}
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Forum post: ${post.title}`}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: '#558b2f', width: 32, height: 32, mr: 1 }}>
                        {post.author_username && post.author_username.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" color="text.secondary">
                        {post.author_username} • {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" gutterBottom sx={{ textAlign: 'left' }}>
                      {post.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                      sx={{ mb: 2, textAlign: 'left' }}
                    >
                      {post.content.length > 200
                        ? `${post.content.substring(0, 200)}...`
                        : post.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <Button
                        variant="text"
                        startIcon={<ReadMoreIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/forum/${post.id}`);
                        }}
                        sx={{ color: '#558b2f' }}
                      >
                        Read More
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
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

      {/* Create Post Floating Action Button (for classic view) */}
      {user && !useModernStyle && (
        <Tooltip title="Create new post" arrow placement="left">
          <Fab
            color="primary"
            aria-label="create post"
            onClick={() => setCreateDialogOpen(true)}
            onKeyDown={createButtonKeyboardHandler(() => setCreateDialogOpen(true))}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: '#558b2f',
              '&:hover': {
                backgroundColor: '#33691e',
              },
              '&:focus': {
                outline: '2px solid #558b2f',
                outlineOffset: '2px',
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
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
