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
import AddCommentIcon from '@mui/icons-material/AddComment';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import React from 'react';

const CommentCreateDialog = ({ open, onClose, postId, onCommentCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          forum_post: postId,
          content: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      const data = await response.json();
      
      // Reset form
      setContent('');
      setLoading(false);
      
      // Show success toast notification
      toast.success('Comment posted successfully!');
      
      // Call the callback function with the new comment data
      onCommentCreated(data);
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Failed to post your comment. Please try again.');
      setLoading(false);
      
      // Show error toast notification
      toast.error('Failed to post comment. Please try again.');
    }
  };

  const handleClose = () => {
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
        <AddCommentIcon sx={{ mr: 1 }} /> Add a Comment
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <DialogContentText sx={{ mb: 2, textAlign: 'left' }}>
          Share your thoughts about this post.
        </DialogContentText>
        
        <TextField
          autoFocus
          margin="dense"
          label="Comment"
          multiline
          rows={5}
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
          onClick={handleSubmit}
          variant="contained"
          disabled={!content.trim() || loading}
          endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          sx={{ 
            bgcolor: '#558b2f', 
            '&:hover': { 
              bgcolor: '#33691e' 
            }
          }}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentCreateDialog;