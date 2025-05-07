/* global Intl */
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
  Chip,
  Avatar,
  Paper,
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  // Post creation dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
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

  // Handle post creation
  const handleCreatePost = async () => {
    // Validation
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setCreateError('Title and content are required.');
      return;
    }
    
    try {
      setCreateLoading(true);
      setCreateError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const newPost = await response.json();
      
      // Update posts list with the new post
      setPosts([newPost, ...posts]);
      setFilteredPosts([newPost, ...filteredPosts]);
      
      // Reset form and close dialog
      setNewPostTitle('');
      setNewPostContent('');
      setCreateDialogOpen(false);
      setCreateLoading(false);
      
      // Show success toast notification
      toast.success('Post created successfully!');
      
      // Navigate to the new post view
      navigate(`/forum/${newPost.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      setCreateError('Failed to create post. Please try again later.');
      setCreateLoading(false);
      
      // Show error toast notification
      toast.error('Failed to create post. Please try again.');
    }
  };

  // Reset form when dialog is closed
  const handleCloseDialog = () => {
    setNewPostTitle('');
    setNewPostContent('');
    setCreateError(null);
    setCreateDialogOpen(false);
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    
    if (value === '') {
      setFilteredPosts(posts);
      return;
    }
    
    const filtered = posts.filter(post => 
      post.title.toLowerCase().includes(value) || 
      post.content.toLowerCase().includes(value) || 
      (post.author && post.author.toString().toLowerCase().includes(value))
    );
    
    setFilteredPosts(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
          <ForumIcon sx={{ mr: 1 }} /> Community Forum
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="All Topics" color="primary" variant="outlined" onClick={() => {}} />
              {currentUser && (
                <Chip label="Following" variant="outlined" onClick={() => {}} />
              )}
              <Chip label="Most Popular" variant="outlined" onClick={() => {}} />
              <Chip label="Recent" variant="outlined" onClick={() => {}} />
            </Box>
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
                boxShadow: 3
              }
            }}
          >
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: '#558b2f', width: 32, height: 32, mr: 1 }}>
                        {post.author && post.author.toString().charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" color="text.secondary">
                        User {post.author} • {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                    <Chip 
                      label="Gardening Tips" 
                      size="small" 
                      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} 
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {post.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
                    {post.content.length > 200 
                      ? `${post.content.substring(0, 200)}...` 
                      : post.content
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {/* We might not have likes data in the API yet */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ThumbUpIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          0
                        </Typography>
                      </Box>
                      {/* We might not have comments count in the API yet */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CommentIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          0
                        </Typography>
                      </Box>
                    </Box>
                    <Button 
                      variant="text"
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
        <Box sx={{ textAlign: 'center', py: 5 }}>
          <Typography variant="h6" color="text.secondary">
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {searchTerm ? 'Try a different search term' : 'Be the first to create a post!'}
          </Typography>
        </Box>
      )}

      {/* Create Post Button (for logged in users) */}
      {currentUser && (
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
            }
          }}
          onClick={() => setCreateDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}
      
      {/* Create Post Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
          <ForumIcon sx={{ mr: 1 }} /> Create New Post
        </DialogTitle>
        
        <DialogContent>
          {createError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {createError}
            </Alert>
          )}
          
          <DialogContentText sx={{ mb: 2 }}>
            Share your gardening experiences, questions, or tips with the community.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Content"
            multiline
            rows={10}
            fullWidth
            variant="outlined"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            required
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePost}
            variant="contained"
            disabled={createLoading}
            sx={{ 
              bgcolor: '#558b2f', 
              '&:hover': { 
                bgcolor: '#33691e' 
              }
            }}
          >
            {createLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Posting...
              </>
            ) : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ForumList;