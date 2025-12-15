import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  useTheme,
  Tooltip,
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { useAuth } from '../contexts/AuthContextUtils';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ImageGallery from './ImageGallery';
import { toast } from 'react-toastify';

const formatTimeAgo = (dateString, t) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  if (diffInSeconds < 60) return t('forum.justNow', 'Just now');
  if (diffInSeconds < 3600) return t('forum.minutesAgo', { count: Math.floor(diffInSeconds / 60) });
  if (diffInSeconds < 86400) return t('forum.hoursAgo', { count: Math.floor(diffInSeconds / 3600) });
  return date.toLocaleDateString();
};

const CommentItem = ({ 
  comment, 
  onAuthorClick, 
  isPostAuthor, 
  isBestAnswer, 
  onMarkBest 
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { token } = useAuth();

  // --- LOCAL STATE FOR THIS COMMENT ---
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  // --- DIALOG STATE ---
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [likedUsers, setLikedUsers] = useState([]);
  const [loadingLikes, setLoadingLikes] = useState(false);

  // --- LIKE TOGGLE LOGIC ---
  const handleToggleLike = async () => {
    if (!token) {
      toast.error(t('auth.loginRequired'));
      return;
    }
    if (isLiking) return;
    setIsLiking(true);

    const prevLiked = isLiked;
    const prevCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${comment.id}/like/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error("Failed to like comment");
    } finally {
      setIsLiking(false);
    }
  };

  // --- FETCH LIKES LIST LOGIC ---
  const handleOpenLikesDialog = async () => {
    if (likesCount === 0) return;
    setLikesDialogOpen(true);
    setLoadingLikes(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/comments/${comment.id}/likes/list/`, {
        headers: { 'Authorization': `Token ${token}` },
      });
      if (response.ok) {
        setLikedUsers(await response.json());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLikes(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'flex-start' }}>
      <Avatar 
        src={comment.author_profile_picture || '/default-avatar.png'}
        onClick={() => onAuthorClick(comment.author)}
        sx={{ width: 28, height: 28, cursor: 'pointer', mt: 0.5 }}
      >
        {comment.author_username?.charAt(0)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Comment Bubble */}
        <Box sx={{ 
          // Green Background if Best Answer
          backgroundColor: isBestAnswer ? 'rgba(46, 125, 50, 0.08)' : theme.palette.action.hover, 
          // Green Border if Best Answer
          border: isBestAnswer ? '2px solid #2e7d32' : '2px solid transparent', 
          borderRadius: 2, 
          p: 1.5,
          position: 'relative',
          transition: 'all 0.2s ease'
        }}>
          
          {/* Header Row: Username + Best Answer Checkmark */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
            <Typography 
              variant="subtitle2" 
              onClick={() => onAuthorClick(comment.author)}
              sx={{ fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
            >
              {comment.author_username}
            </Typography>

            {/* The Selection Button/Icon */}
            {/* Show if: (1) It is the best answer OR (2) User is the post author */}
            {(isBestAnswer || isPostAuthor) && (
              <Tooltip title={isPostAuthor ? (isBestAnswer ? "Unmark Best Answer" : "Mark as Best Answer") : "Best Answer"}>
                 {/* Only clickable if isPostAuthor is true */}
                 <IconButton
                    component="span"
                    onClick={isPostAuthor ? onMarkBest : undefined} 
                    size="small"
                    sx={{ 
                        p: 0,
                        ml: 1,
                        color: isBestAnswer ? '#2e7d32' : 'text.disabled',
                        opacity: isBestAnswer ? 1 : 0.3,
                        cursor: isPostAuthor ? 'pointer' : 'default',
                        '&:hover': {
                            opacity: isPostAuthor ? 1 : (isBestAnswer ? 1 : 0.3),
                            backgroundColor: isPostAuthor ? 'rgba(0,0,0,0.05)' : 'transparent'
                        }
                    }}
                 >
                    {isBestAnswer ? <CheckCircleIcon fontSize="medium" /> : <CheckCircleOutlineIcon fontSize="medium" />}
                 </IconButton>
              </Tooltip>
            )}
          </Box>
          
          <Typography variant="body2" sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {comment.content}
          </Typography>

          {comment.images && comment.images.length > 0 && (
             <Box sx={{ mt: 1 }}>
               <ImageGallery images={comment.images} maxColumns={2} imageHeight={80} showCoverBadge={false} />
             </Box>
          )}
        </Box>

        {/* Footer: Time | Like Icon | Count Text */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 1.5, mt: 0.5, gap: 2 }}>
          
          {/* 1. Time (Left most) */}
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            {formatTimeAgo(comment.created_at, t)}
          </Typography>

          {/* 2. Like Action (The Thumb Icon) */}
          {/* Clicking this toggles the like */}
          <Box 
            onClick={handleToggleLike}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              color: isLiked ? 'primary.main' : 'text.secondary',
              transition: 'transform 0.1s',
              '&:hover': { 
                color: isLiked ? 'primary.dark' : 'text.primary',
                transform: 'scale(1.1)' // Tiny pop effect on hover
              }
            }}
          >
            {isLiked ? (
               <ThumbUpIcon sx={{ fontSize: '0.9rem' }} />
            ) : (
               <ThumbUpOutlinedIcon sx={{ fontSize: '0.9rem' }} />
            )}
            {/* icon-only is cleaner for comments */}
          </Box>

          {/* 3. Like Count Text ("2 Likes") */}
          {/* Clicking this opens the User List Dialog */}
          {likesCount > 0 && (
            <Typography 
              variant="caption" 
              onClick={handleOpenLikesDialog}
              sx={{ 
                cursor: 'pointer', 
                fontWeight: 600,
                color: 'text.secondary',
                fontSize: '0.75rem',
                '&:hover': { 
                  textDecoration: 'underline',
                  color: 'primary.main'
                }
              }}
            >
              {likesCount} {likesCount === 1 ? t('forum.like', 'Like') : t('forum.likes', 'Likes')}
            </Typography>
          )}
        </Box>
      </Box>


      {/* --- LIKES DIALOG --- */}
      <Dialog open={likesDialogOpen} onClose={() => setLikesDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontSize: '0.9rem' }}>{t('Liked By')}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {loadingLikes ? (
            <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={20} /></Box>
          ) : (
            <List disablePadding>
              {Array.isArray(likedUsers) && likedUsers.map((user) => (
                <ListItem key={user.id} disablePadding>
                  <ListItemButton onClick={() => { setLikesDialogOpen(false); navigate(`/profile/${user.id}`); }}>
                    <ListItemAvatar><Avatar src={user.profile_picture} sx={{ width: 30, height: 30 }} /></ListItemAvatar>
                    <ListItemText primary={user.username} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setLikesDialogOpen(false)} size="small">{t('common.close')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommentItem;