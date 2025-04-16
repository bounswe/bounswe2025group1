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
  Fab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import api from '../../utils/api';

const ForumList = () => {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.getPosts();
        setPosts(response.data);
        setFilteredPosts(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forum posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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
      post.author.toLowerCase().includes(value)
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
                        {post.author.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" color="text.secondary">
                        {post.author} • {formatDate(post.date)}
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
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ThumbUpIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {post.likes}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CommentIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {post.comments}
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
          onClick={() => navigate('/forum/create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default ForumList;