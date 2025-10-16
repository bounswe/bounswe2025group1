import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddCommentIcon from '@mui/icons-material/AddComment';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import React from 'react';
import { createFormKeyboardHandler, trapFocus } from '../utils/keyboardNavigation';

const CommentCreateDialog = ({ open, onClose, postId, onCommentCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();
  const dialogRef = useRef(null);
  const focusableElementsRef = useRef([]);

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
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          forum_post: postId,
          content: content,
        }),
      });

      if (!response.ok) {
        toast.error('Failed to post comment');
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

  // Create keyboard handler for the form
  const formKeyboardHandler = createFormKeyboardHandler(handleSubmit, handleClose);

  // Set up focus trap when dialog opens
  useEffect(() => {
    if (open && dialogRef.current) {
      // Get all focusable elements within the dialog
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusableElementsRef.current = Array.from(focusableElements);
      
      // Focus the first element
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }
      
      // Set up focus trap
      const cleanup = trapFocus(dialogRef.current, focusableElementsRef.current);
      return cleanup;
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="md"
      ref={dialogRef}
      onKeyDown={formKeyboardHandler}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comment-create-title"
    >
      <DialogTitle 
        id="comment-create-title"
        sx={{ color: '#2e7d32', display: 'flex', alignItems: 'center' }}
      >
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
          sx={{
            '& .MuiOutlinedInput-root': {
              '&:focus-within': {
                outline: '2px solid #558b2f',
                outlineOffset: '2px',
              },
            },
          }}
          aria-label="Comment content"
        />
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose} 
          variant="outlined"
          onKeyDown={createFormKeyboardHandler(handleClose)}
          sx={{
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!content.trim() || loading}
          endIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          onKeyDown={createFormKeyboardHandler(handleSubmit)}
          sx={{
            bgcolor: '#558b2f',
            '&:hover': {
              bgcolor: '#33691e',
            },
            '&:focus': {
              outline: '2px solid #558b2f',
              outlineOffset: '2px',
            },
          }}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentCreateDialog;
