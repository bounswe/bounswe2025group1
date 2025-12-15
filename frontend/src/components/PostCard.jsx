import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
  Button,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  TextField,
  DialogActions,
  useTheme,
  CircularProgress,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';

import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ImageGallery from './ImageGallery';
import InlineImageUpload from './InlineImageUpload';

import ReportDialog from './ReportDialog';
import CommentItem from './CommentItem';
import FlagIcon from '@mui/icons-material/Flag';

const PostCard = ({
  post,
  onComment,
  onEdit,
  onDelete,
  currentUser,
  isOwner = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const handleToggleLike = async () => {
    if (!token) {
      toast.error(t('auth.loginRequired', "Please login to like posts"));
      return;
    }
    
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic Update: Update UI immediately
    const previousLiked = isLiked;
    const previousCount = likesCount;
  
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum-posts/${post.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to toggle like');
    } catch (error) {
      console.error("Like error:", error);
      // Revert UI if API fails
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      toast.error(t('errors.generic', "Something went wrong"));
    } finally {
      setIsLiking(false);
    }
  };

  // LIKES DIALOG STATE
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  const handleOpenLikesDialog = async () => {
    if (likesCount === 0) return; // Don't open if 0 likes
    
    setLikesDialogOpen(true);
    setLoadingLikes(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/forum-posts/${post.id}/likes/list/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikedUsers(data);
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    } finally {
      setLoadingLikes(false);
    }
  };

  const handleLikerClick = (userId) => {
    setLikesDialogOpen(false); // Close dialog
    navigate(`/profile/${userId}`); // Go to profile
  };

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImages, setCommentImages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Check if post has comments
  const hasComments = post.comments && post.comments.length > 0;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    if (post.author) {
      navigate(`/profile/${post.author}`);
    }
  };

  const handleCommentAuthorClick = (authorId) => {
    if (authorId) {
      navigate(`/profile/${authorId}`);
    }
  };


  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim() || commentImages.length > 0) {
      if (onComment) {
        onComment(post.id, {
          content: commentText,
          images: commentImages,
        });
      }
      setCommentText('');
      setCommentImages([]);
      setCommentDialogOpen(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return t('forum.justNow');
    if (diffInSeconds < 3600) return t('forum.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('forum.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 2592000) return t('forum.daysAgo', { count: Math.floor(diffInSeconds / 86400) });
    return date.toLocaleDateString();
  };

  const [bestAnswerId, setBestAnswerId] = useState(post.best_answer_id);

  const handleMarkBestAnswer = async (commentId) => {
    if (!token) return;

    // Optimistic Update: Update UI immediately
    const oldBestAnswer = bestAnswerId;
    const newBestAnswer = bestAnswerId === commentId ? null : commentId;
    
    setBestAnswerId(newBestAnswer);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${commentId}/mark-best/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) throw new Error('Failed to update best answer');
    } catch (error) {
      console.error("Best answer error:", error);

      // Revert UI on failure
      setBestAnswerId(oldBestAnswer);
      toast.error(t('errors.generic', "Updating best answer failed"));
    }
  };

  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      {/* Post Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={post.author_profile_picture || '/default-avatar.png'}
              onClick={handleProfileClick}
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2.5,
                ml: 2.5,
                bgcolor: '#558b2f',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              {post.author_username?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography 
                variant="subtitle1" 
                onClick={handleProfileClick}
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '0.95rem', 
                  textAlign: 'left',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.main',
                  },
                }}
              >
                {post.author_username || t('forum.unknownUser')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {formatTimeAgo(post.created_at)}
                {post.updated_at !== post.created_at && ` • ${t('forum.edited')}`}
              </Typography>
            </Box>
          </Box>
          
          {(isOwner || currentUser) && (
            <IconButton 
              size="small" 
              onClick={handleMenuOpen}
              sx={{ color: 'text.secondary' }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Post Content */}
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography 
            variant="body1" 
            sx={{ 
              fontSize: '0.95rem', 
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textAlign: 'left',
            }}
          >
            {post.content}
          </Typography>
        </Box>

        {/* Post Images */}
        {post.images && post.images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <ImageGallery 
              images={post.images}
              maxColumns={1}
              imageHeight={300}
              showCoverBadge={false}
            />
          </Box>
        )}

        {/* Engagement Stats */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 2 }}>
          {/* Likes Count Text - Clickable */}
          {likesCount > 0 && (
            <Typography 
              variant="body1" 
              color="darkred"
              onClick={handleOpenLikesDialog}
              sx={{ 
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
            >
              {/* Used a template string to keep spaces clean */}
              {`${likesCount} ${likesCount === 1 ? t('forum.like', 'Like') : t('forum.likes', 'Likes')}`}
            </Typography>
          )}

          {/* Comments Toggle Text */}
          {hasComments && (
            <Button
              variant="text"
              size="small"
              onClick={() => setShowComments(!showComments)}
              sx={{
                color: 'text.secondary',
                fontSize: '0.85rem',
                textTransform: 'none',
                minWidth: 'auto',
                p: 0,
                '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' },
              }}
            >
              {showComments ? t('forum.hideComments') : t('forum.showComments', { count: post.comments_count })}
            </Button>
          )}
        </Box>


        <Divider sx={{ my: 1 }} />
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}> {}
          
          {/* LIKE BUTTON */}
          <Button
            startIcon={isLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
            onClick={handleToggleLike}
            sx={{
              color: isLiked ? 'primary.main' : 'text.secondary',
              fontWeight: 400,
              fontSize: '0.9rem',
              textTransform: 'none',
              flex: 1, // Make buttons take equal width
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
            }}
          >
            {isLiked ? t('forum.liked', 'Liked') : t('forum.like', 'Like')}
          </Button>

          {/* COMMENT BUTTON */}
          <Button
            startIcon={<CommentIcon />}
            onClick={handleComment}
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: '0.9rem',
              textTransform: 'none',
              flex: 1, // Make buttons take equal width
              '& .MuiButton-startIcon': { marginRight: 1 },
              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.08)' },
            }}
          >
            {t('forum.comment')}
          </Button>
        </Box>

        {/* Comments Section */}
        {showComments && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            
            {/* Comment Input */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
              <Avatar 
                src={currentUser?.profile?.profile_picture || '/default-avatar.png'}
                sx={{ 
                  width: 32, 
                  height: 32,
                  mr: 1.5,
                  ml: 1.5,
                  bgcolor: '#558b2f',
                  fontSize: '0.9rem',
                }}
              >
                {currentUser?.username?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder={t('forum.writeComment')}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  maxRows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.background.paper,
                      },
                    },
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                  <InlineImageUpload
                    onImagesChange={setCommentImages}
                    maxImages={3}
                    maxSizeMB={5}
                    initialImages={commentImages.map((img, index) => ({ 
                      base64: img, 
                      name: `image-${index + 1}.jpg` 
                    }))}
                    disabled={false}
                    compact={true}
                  />
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleCommentSubmit}
                    disabled={!commentText.trim() && commentImages.length === 0}
                    sx={{
                      bgcolor: '#558b2f',
                      '&:hover': { bgcolor: '#33691e' },
                      textTransform: 'none',
                      fontSize: '0.8rem',
                    }}
                  >
                    {t('forum.post')}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Existing Comments */}
            {hasComments && (
              <Box sx={{ ml: 0 }}>
                {post.comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    onAuthorClick={handleCommentAuthorClick}
                    isPostAuthor={currentUser?.id === post.author}
                    isBestAnswer={bestAnswerId === comment.id}
                    onMarkBest={() => handleMarkBestAnswer(comment.id)}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Post Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {isOwner && (
          <div>
            <MenuItem onClick={() => { onEdit && onEdit(post); handleMenuClose(); }}>
              {t('forum.editPost')}
            </MenuItem>
            <MenuItem onClick={() => { onDelete && onDelete(post.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
              {t('forum.deletePost')}
            </MenuItem>
          </div>
        )}
        {!isOwner && currentUser && (
          <MenuItem onClick={() => { setReportDialogOpen(true); handleMenuClose(); }} sx={{ color: 'text.secondary' }}>
            <FlagIcon fontSize="small" sx={{ mr: 1 }} />
            {t('report.reportPost', 'Report Post')}
          </MenuItem>
        )}
      </Menu>

      <ReportDialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        contentType="forumpost"
        objectId={post.id}
      />

      {/* LIKES LIST DIALOG */}
      <Dialog 
        open={likesDialogOpen} 
        onClose={() => setLikesDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
          {t('forum.likedBy', 'Liked by')}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {loadingLikes ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List sx={{ pt: 0, pb: 0 }}>
              {Array.isArray(likedUsers) && likedUsers.length > 0 ? (
                likedUsers.map((user) => (
                  <ListItem key={user.id} disablePadding>
                    <ListItemButton 
                      onClick={() => handleLikerClick(user.id)}
                      sx={{
                        // Add a smooth transition
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'action.hover', 
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.profile_picture} />
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.username} 
                        primaryTypographyProps={{ 
                          fontWeight: 500, 
                          fontSize: '0.9rem',
                          color: 'text.primary'
                        }} 
                      />
                    </ListItemButton>
                  </ListItem>
                ))
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                   <Typography variant="body2" color="text.secondary">
                     {t('forum.noLikesYet', 'No likes yet')}
                   </Typography>
                </Box>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLikesDialogOpen(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default PostCard;
