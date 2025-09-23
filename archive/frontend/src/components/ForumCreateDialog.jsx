import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import React from 'react';

const ForumCreateDialog = ({ open, onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleCreatePost = async () => {
    // Validation
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
      
      const newPost = await response.json();
      
      // Reset form
      setTitle('');
      setContent('');
      setLoading(false);
      
      // Show success toast notification
      toast.success('Post created successfully!');
      
      // Call the callback function with the new post data
      onPostCreated(newPost);
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again later.');
      setLoading(false);
      
      // Show error toast notification
      toast.error('Failed to create post. Please try again.');
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle sx={{ color: '#2e7d32', display: 'flex', alignItems: 'center' }}>
        <ForumIcon sx={{ mr: 1 }} /> Create New Post
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        
        <TextField
          label="Content"
          multiline
          rows={10}
          fullWidth
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleCreatePost}
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
          ) : 'Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ForumCreateDialog;