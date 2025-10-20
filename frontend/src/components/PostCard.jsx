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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CommentIcon from '@mui/icons-material/Comment';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'react-i18next';
import ImageGallery from './ImageGallery';
import InlineImageUpload from './InlineImageUpload';

const PostCard = ({
  post,
  onComment,
  onEdit,
  onDelete,
  currentUser,
  isOwner = false,
}) => {
  const { t } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImages, setCommentImages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);

  // Check if post has comments
  const hasComments = post.comments && post.comments.length > 0;

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                bgcolor: '#558b2f',
                fontSize: '1.2rem',
                fontWeight: 'bold',
              }}
            >
              {post.author_username?.charAt(0) || 'U'}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.95rem', textAlign: 'left' }}>
                {post.author_username || t('forum.unknownUser')}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                {formatTimeAgo(post.created_at)}
                {post.updated_at !== post.created_at && ` • ${t('forum.edited')}`}
              </Typography>
            </Box>
          </Box>
          
          {isOwner && (
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
        {hasComments && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 1 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowComments(!showComments)}
              sx={{
                color: 'text.secondary',
                fontSize: '0.8rem',
                textTransform: 'none',
                minWidth: 'auto',
                px: 1,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {showComments ? t('forum.hideComments') : t('forum.showComments', { count: post.comments_count })}
            </Button>
          </Box>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            startIcon={<CommentIcon />}
            onClick={handleComment}
            sx={{
              color: 'text.secondary',
              fontWeight: 400,
              fontSize: '0.9rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
              },
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
                      backgroundColor: '#f5f5f5',
                      '&:hover': {
                        backgroundColor: '#eeeeee',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'white',
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
                  <Box key={comment.id} sx={{ display: 'flex', gap: 0.5, mb: 1, alignItems: 'flex-start' }}>
                    <Avatar 
                      src={comment.author_profile_picture || '/default-avatar.png'}
                      sx={{ 
                        width: 24, 
                        height: 24,
                        bgcolor: '#8bc34a',
                        fontSize: '0.7rem',
                        flexShrink: 0,
                      }}
                    >
                      {comment.author_username?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ 
                        backgroundColor: '#f0f2f5', 
                        borderRadius: 1.5, 
                        p: 0.8,
                        mb: 0.3,
                      }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          fontSize: '0.75rem',
                          color: '#1976d2',
                          mb: 0.2,
                          textAlign: 'left',
                        }}>
                          {comment.author_username || t('forum.unknownUser')}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                          textAlign: 'left',
                        }}>
                          {comment.content}
                        </Typography>
                        {comment.images && comment.images.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            <ImageGallery 
                              images={comment.images}
                              maxColumns={2}
                              imageHeight={60}
                              showCoverBadge={false}
                            />
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ 
                        fontSize: '0.65rem', 
                        ml: 0.5,
                        display: 'block',
                        textAlign: 'right',
                      }}>
                        {formatTimeAgo(comment.created_at)}
                      </Typography>
                    </Box>
                  </Box>
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
        <MenuItem onClick={() => { onEdit && onEdit(post); handleMenuClose(); }}>
          {t('forum.editPost')}
        </MenuItem>
        <MenuItem onClick={() => { onDelete && onDelete(post.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>
          {t('forum.deletePost')}
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default PostCard;
