import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContextUtils';
import CircularProgress from '@mui/material/CircularProgress';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

const ForumPreview = ({ limit = 3, showViewAll = true }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const displayPosts = posts.slice(0, limit);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`);

        if (!response.ok) {
          // Only show error for authenticated users
          if (token) {
            toast.error(t('errors.failedToFetchPosts'));
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        setPosts(data || []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        // Only show error for authenticated users
        if (token) {
          toast.error(t('errors.failedToFetchPosts'));
        }
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          height: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="success" size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading forum data...
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, height: 300, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <ForumIcon sx={{ mr: 1 }} /> {t('forum.title')}
      </Typography>

      {displayPosts.length > 0 ? (
        <>
          <List sx={{ py: 0, flex: 1, overflow: 'auto', minHeight: 0 }}>
            {displayPosts.map((post) => (
              <React.Fragment key={post.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={post.author_profile_picture || '/default-avatar.png'}
                      sx={{ bgcolor: '#558b2f' }}
                    >
                      {post.author_username?.charAt(0) || 'U'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography noWrap variant="subtitle2">
                        {post.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" noWrap>
                          {post.content.substring(0, 60)}...
                        </Typography>
                        <Box
                          component="span"
                          sx={{ display: 'inline-flex', alignItems: 'center', mt: 0.5 }}
                        >
                          <Typography variant="caption" color="text.secondary" component="span">
                            {post.author_username} • {formatDate(post.created_at)}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
          {showViewAll && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/forum')}
                sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
              >
                {t('forum.exploreForum')}
              </Button>
            </Box>
          )}
        </>
      ) : (
        <>
          <Typography variant="body2" paragraph>
            {t('forum.subtitle')}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/forum')}
            sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
          >
            {t('forum.exploreForum')}
          </Button>
        </>
      )}
    </Paper>
  );
};

export default ForumPreview;
