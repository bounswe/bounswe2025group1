import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ForumIcon from '@mui/icons-material/Forum';
import { useAuth } from '../../contexts/AuthContextUtils';

const ForumCreate = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          title,
          content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const data = await response.json();
      // Navigate to the new post page
      navigate(`/forum/${data.id}`);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      {/* Back Button */}
      <IconButton 
        onClick={() => navigate('/forum')}
        sx={{ color: '#558b2f', mb: 2 }}
        aria-label="back to forum"
      >
        <ArrowBackIcon />
      </IconButton>
      
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
        <ForumIcon sx={{ mr: 1 }} /> Create New Post
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" paragraph>
        Share your gardening experiences, questions, or tips with the community.
      </Typography>
      <Divider sx={{ my: 2 }} />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Post Form */}
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            fullWidth
            label="Content"
            multiline
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/forum')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                bgcolor: '#558b2f', 
                '&:hover': { 
                  bgcolor: '#33691e' 
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Posting...
                </>
              ) : 'Create Post'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForumCreate;