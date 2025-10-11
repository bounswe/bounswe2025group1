import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Avatar,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  Fab,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCommentIcon from '@mui/icons-material/AddComment';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import CommentCreateDialog from '../../components/CommentCreateDialog';
import React from 'react';

const ForumPost = () => {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  // Comment dialog state
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch post details
        const postResponse = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!postResponse.ok) {
          throw new Error('Failed to fetch post');
        }

        const postData = await postResponse.json();
        setPost(postData);
        setEditedTitle(postData.title);
        setEditedContent(postData.content);

        // Fetch comments for the post
        const commentsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/forum/comments/?forum_post=${postId}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        // If response is 404, we treat it as no comments rather than an error
        if (commentsResponse.status === 404) {
          setComments([]);
        } else if (!commentsResponse.ok) {
          console.error('Error fetching comments:', commentsResponse.statusText);
          // Don't treat this as a fatal error, just use empty comments array
          setComments([]);
        } else {
          const commentsData = await commentsResponse.json();
          setComments(commentsData);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching post data:', error);
        setError('Failed to load the post. Please try again later.');
        setLoading(false);
      }
    };

    if (token && postId) {
      fetchPostAndComments();
    }
  }, [postId, token]);

  const handleCommentCreated = (newComment) => {
    setComments([...comments, newComment]);
    setCommentDialogOpen(false);
  };

  const handlePostUpdate = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update post');
      }

      const data = await response.json();
      setPost(data);
      setEditMode(false);

      // Show success toast notification
      toast.success('Post updated successfully!');
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update your post. Please try again.');

      // Show error toast notification
      toast.error('Failed to update post. Please try again.');
    }
  };

  const handlePostDelete = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/${postId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      // Show success toast notification
      toast.success('Post deleted successfully!');

      // Redirect to forum list after deletion
      navigate('/forum');
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete the post. Please try again.');
      setDeleteDialogOpen(false);

      // Show error toast notification
      toast.error('Failed to delete post. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/forum')}
          sx={{ color: '#558b2f' }}
        >
          Back to Forums
        </Button>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
        <Typography variant="h5" color="text.secondary" sx={{ textAlign: 'left', py: 5 }}>
          Post not found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/forum')}
          sx={{ color: '#558b2f' }}
        >
          Back to Forums
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Back Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/forum')}
          sx={{ color: '#558b2f', mb: 2 }}
        >
          Back to Forums
        </Button>
      </Box>

      {/* Post Content */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        {editMode ? (
          // Edit Mode
          <Box component="form" sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Title"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Content"
              multiline
              rows={6}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handlePostUpdate}
                sx={{ bgcolor: '#558b2f', '&:hover': { bgcolor: '#33691e' } }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        ) : (
          // View Mode
          <>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <Typography
                variant="h4"
                gutterBottom
                sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: 'left' }}
              >
                {post.title}
              </Typography>
              {post.author === currentUser?.id && (
                <Box>
                  <IconButton
                    onClick={() => setEditMode(true)}
                    color="primary"
                    size="small"
                    sx={{ color: '#558b2f' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => setDeleteDialogOpen(true)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              {' '}
              <Avatar sx={{ bgcolor: '#558b2f', width: 40, height: 40, mr: 1 }}>
                {post.author_username && post.author_username.charAt(0)}
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/profile/${post.author}`)}
                >
                  {post.author_username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Posted on {formatDate(post.created_at)}
                  {post.updated_at !== post.created_at &&
                    ` • Edited on ${formatDate(post.updated_at)}`}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {post.content}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              {currentUser && (
                <Button
                  variant="outlined"
                  startIcon={<AddCommentIcon />}
                  onClick={() => setCommentDialogOpen(true)}
                  sx={{ color: '#558b2f', borderColor: '#558b2f' }}
                >
                  Add Comment
                </Button>
              )}
            </Box>
          </>
        )}
      </Paper>

      {/* Comments Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ color: '#2e7d32', fontWeight: 'medium', mt: 4, mb: 2 }}
        >
          Comments ({comments.length})
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Comment List */}
      {comments.length > 0 ? (
        comments.map((comment) => (
          <Card key={comment.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Avatar sx={{ bgcolor: '#8bc34a', width: 32, height: 32, mr: 2 }}>
                  {comment.author_username && comment.author_username.charAt(0)}
                </Avatar>
                <Box sx={{ width: '100%' }}>
                  {' '}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/profile/${comment.author}`)}
                    >
                      {comment.author_username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(comment.created_at)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ textAlign: 'left' }}>
                    {comment.content}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Box sx={{ py: 3, textAlign: 'left' }}>
          <Typography variant="subtitle1" color="text.secondary">
            No comments yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Be the first to share your thoughts!
          </Typography>
        </Box>
      )}

      {/* Add Comment Floating Action Button (for logged in users) */}
      {currentUser && (
        <Tooltip title="Add comment" arrow placement="left">
          <Fab
            color="primary"
            aria-label="add comment"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: '#558b2f',
              '&:hover': {
                backgroundColor: '#33691e',
              },
            }}
            onClick={() => setCommentDialogOpen(true)}
          >
            <AddCommentIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Comment Dialog Component */}
      <CommentCreateDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        postId={postId}
        onCommentCreated={handleCommentCreated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Post</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this post? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handlePostDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ForumPost;
