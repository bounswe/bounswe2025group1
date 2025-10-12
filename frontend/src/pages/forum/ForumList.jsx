import { useState, useEffect } from 'react';
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
import React from 'react';

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          toast.error('Failed to fetch posts');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}
        >
          <ForumIcon sx={{ mr: 1 }} /> Community Forum
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ textAlign: 'left' }}>
          Join discussions, share gardening tips, and connect with fellow garden enthusiasts.
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search posts by title, content or author..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
            }}
          >
            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  ml: 2,
                  bgcolor: '#558b2f',
                  '&:hover': { bgcolor: '#33691e' },
                }}
              >
                New Post
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Forum Posts */}
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => (
          <Card
            key={post.id}
            sx={{
              mb: 3,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {' '}
                      <Avatar sx={{ bgcolor: '#558b2f', width: 32, height: 32, mr: 1 }}>
                        {post.author_username && post.author_username.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Box
                          component="span"
                          sx={{ cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.author}`);
                          }}
                        >
                          {post.author_username}
                        </Box>{' '}
                        • {formatDate(post.created_at)}
                      </Typography>
                    </Box>
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
                    {user && (
                      <Button
                        variant="text"
                        startIcon={<AddCommentIcon />}
                        onClick={() => handleOpenCommentDialog(post.id)}
                        sx={{ mr: 2, color: '#558b2f', borderColor: '#558b2f' }}
                      >
                        Comment
                      </Button>
                    )}
                    <Button
                      variant="text"
                      startIcon={<ReadMoreIcon />}
                      onClick={() => navigate(`/forum/${post.id}`)}
                      sx={{ color: '#558b2f' }}
                    >
                      Read More
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))
      ) : (
        <Box sx={{ py: 5, textAlign: 'left' }}>
          <Typography variant="h6" color="text.secondary">
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {searchTerm ? 'Try a different search term' : 'Be the first to create a post!'}
          </Typography>
        </Box>
      )}

      {/* Create Post Floating Action Button (for logged in users) */}
      {user && (
        <Tooltip title="Create new post" arrow placement="left">
          <Fab
            color="primary"
            aria-label="create post"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: '#558b2f',
              '&:hover': {
                backgroundColor: '#33691e',
              },
            }}
            onClick={() => setCreateDialogOpen(true)}
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
