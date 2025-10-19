import { useState, useEffect, useRef } from 'react';
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
  Avatar,
  Paper,
  Fab,
  Tooltip,
  ButtonBase,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ForumIcon from '@mui/icons-material/Forum';
import AddCommentIcon from '@mui/icons-material/AddComment';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import ForumCreateDialog from '../../components/ForumCreateDialog';
import CommentCreateDialog from '../../components/CommentCreateDialog';
import React from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import 'react-toastify/dist/ReactToastify.css';
import { createListNavigation, createButtonKeyboardHandler, createLinkKeyboardHandler } from '../../utils/keyboardNavigation';

const ForumList = () => {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const postRefs = useRef([]);
  const searchRef = useRef(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          toast.error(t('errors.failedToFetchPosts'));
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPosts(data);
        setFilteredPosts(data);
        setLoading(false);
      } catch (error) {
        console.error(t('errors.errorFetchingPosts'), error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    if (value === '') {
      setFilteredPosts(posts);
      return;
    }

    const filtered = posts.filter(
      (post) =>
        post.title.toLowerCase().includes(value) ||
        post.content.toLowerCase().includes(value) ||
        (post.author_username && post.author_username.toString().toLowerCase().includes(value))
    );

    setFilteredPosts(filtered);
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setFilteredPosts([newPost, ...filteredPosts]);
    setCreateDialogOpen(false);

    // Navigate to the new post view
    navigate(`/forum/${newPost.id}`);
  };

  const handleOpenCommentDialog = (postId) => {
    setSelectedPostId(postId);
    setCommentDialogOpen(true);
  };

  const handleCommentCreated = () => {
    setCommentDialogOpen(false);

    // Navigate to the post view to see the comment
    navigate(`/forum/${selectedPostId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Create keyboard navigation for the forum posts
  const listNavigation = createListNavigation(
    filteredPosts,
    (post, index) => {
      navigate(`/forum/${post.id}`);
    },
    (post, index) => {
      // Focus the post item
      if (postRefs.current[index]) {
        postRefs.current[index].focus();
      }
    }
  );

  // Handle keyboard navigation for the entire forum list
  const handleListKeyDown = (event) => {
    listNavigation.handleKeyDown(event);
  };

  // Set up refs for each post item
  useEffect(() => {
    postRefs.current = postRefs.current.slice(0, filteredPosts.length);
  }, [filteredPosts.length]);

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
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center' }}
        >
          <ForumIcon sx={{ mr: 1 }} /> {t('forum.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph sx={{ textAlign: 'left' }}>
          {t('forum.subtitle')}
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              ref={searchRef}
              fullWidth
              placeholder={t('forum.searchPlaceholder')}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:focus-within': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                },
              }}
              inputProps={{
                'aria-label': 'Search forum posts',
                'aria-describedby': 'search-help-text'
              }}
            />
          </Grid>
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{
              display: 'flex',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              alignItems: 'center',
            }}
          >
            {user && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                onKeyDown={createButtonKeyboardHandler(() => setCreateDialogOpen(true))}
                sx={{
                  ml: 2,
                  bgcolor: '#558b2f',
                  '&:hover': { bgcolor: '#33691e' },
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                }}
                aria-label="Create new forum post"
              >
                {t('forum.newPost')}
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Forum Posts */}
      {filteredPosts.length > 0 ? (
        <Box onKeyDown={handleListKeyDown} role="list" aria-label="Forum posts">
          {filteredPosts.map((post, index) => (
            <Card
              key={post.id}
              ref={(el) => (postRefs.current[index] = el)}
              component="div"
              sx={{
                mb: 3,
                width: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
                '&:focus': {
                  outline: '2px solid #558b2f',
                  outlineOffset: '2px',
                },
              }}
              onClick={() => navigate(`/forum/${post.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/forum/${post.id}`);
                }
              }}
              tabIndex={0}
              role="listitem"
              aria-label={`Forum post: ${post.title}`}
            >
            <CardContent>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {' '}
                      <Avatar sx={{ bgcolor: '#558b2f', width: 32, height: 32, mr: 1 }}>
                        {post.author_username && post.author_username.charAt(0)}
                      </Avatar>
                      <Typography variant="subtitle2" color="text.secondary">
                        <Box
                          component="span"
                          sx={{ 
                            cursor: 'pointer',
                            '&:focus': {
                              outline: '2px solid #558b2f',
                              outlineOffset: '2px',
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.author}`);
                          }}
                          onKeyDown={createLinkKeyboardHandler((e) => {
                            e.stopPropagation();
                            navigate(`/profile/${post.author}`);
                          })}
                          tabIndex={0}
                          role="link"
                          aria-label={`View profile of ${post.author_username}`}
                        >
                          {post.author_username}
                        </Box>{' '}
                        • {formatDate(post.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'left' }}>
                    {post.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{ mb: 2, textAlign: 'left' }}
                  >
                    {post.content.length > 200
                      ? `${post.content.substring(0, 200)}...`
                      : post.content}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {user && (
                      <Button
                        variant="text"
                        startIcon={<AddCommentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentDialog(post.id);
                        }}
                        onKeyDown={createButtonKeyboardHandler((e) => {
                          e.stopPropagation();
                          handleOpenCommentDialog(post.id);
                        })}
                        sx={{ 
                          mr: 2, 
                          color: '#558b2f', 
                          borderColor: '#558b2f',
                          '&:focus': {
                            outline: '2px solid #558b2f',
                            outlineOffset: '2px',
                          },
                        }}
                        aria-label={`Add comment to post: ${post.title}`}
                      >
                        Comment
                      </Button>
                    )}
                    <Button
                      variant="text"
                      startIcon={<ReadMoreIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/forum/${post.id}`);
                      }}
                      onKeyDown={createButtonKeyboardHandler((e) => {
                        e.stopPropagation();
                        navigate(`/forum/${post.id}`);
                      })}
                      sx={{ 
                        color: '#558b2f',
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                      aria-label={`Read full post: ${post.title}`}
                    >
                      Read More
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ py: 5, textAlign: 'left' }}>
          <Typography variant="h6" color="text.secondary">
            {t('forum.noPostsFound')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
            {searchTerm ? t('forum.tryDifferentSearchTerm') : t('forum.beFirstToCreatePost')}
          </Typography>
        </Box>
      )}

      {/* Create Post Floating Action Button (for logged in users) */}
      {user && (
        <Tooltip title={t('forum.newPost')} arrow placement="left">
          <Fab
            color="primary"
            aria-label="create post"
            onClick={() => setCreateDialogOpen(true)}
            onKeyDown={createButtonKeyboardHandler(() => setCreateDialogOpen(true))}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              backgroundColor: '#558b2f',
              '&:hover': {
                backgroundColor: '#33691e',
              },
              '&:focus': {
                outline: '2px solid #558b2f',
                outlineOffset: '2px',
              },
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>
      )}

      {/* Dialog Components */}
      <ForumCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onPostCreated={handlePostCreated}
      />

      <CommentCreateDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        postId={selectedPostId}
        onCommentCreated={handleCommentCreated}
      />
    </Container>
  );
};

export default ForumList;
