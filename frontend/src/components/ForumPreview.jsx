/* global Intl */
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
  Avatar
} from '@mui/material';
import ForumIcon from '@mui/icons-material/Forum';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContextUtils';
import CircularProgress from '@mui/material/CircularProgress';

const ForumPreview = ({ limit = 3, showViewAll = true }) => {
  const navigate = useNavigate();
  const { _, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const displayPosts = posts.slice(0, limit);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        
        const data = await response.json();
        setPosts(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forum posts:', error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, [token]);

  if (loading) {
    return (
          <Paper elevation={2} sx={{ p: 3, mb: 4, height: "100%", textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress color="success" size={40} />
            <Typography variant="body2" sx={{ mt: 2 }}>Loading forum data...</Typography>
          </Paper>
        );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <ForumIcon sx={{ mr: 1 }} /> Community Forum
      </Typography>
      
      {displayPosts.length > 0 ? (
        <>
          <List sx={{ py: 0 }}>
            {displayPosts.map((post) => (
              <Box key={post.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ px: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/forum/${post.id}`)}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#558b2f' }}>
                      {post.author}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography noWrap variant="subtitle2">{post.title}</Typography>}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" noWrap>
                          {post.content.substring(0, 60)}...
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {post.author} • {formatDate(post.created_at)}
                          </Typography>
                        </Box>
                      </>
                    }
                  />
                </ListItem>
                <Divider variant="inset" component="li" />
              </Box>
            ))}
          </List>
          {showViewAll && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate('/forum')}
                sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
              >
                Explore Forum
              </Button>
            </Box>
          )}
        </>
      ) : (
        <>
          <Typography variant="body2" paragraph>
            Join discussions, share gardening tips, and connect with fellow garden enthusiasts.
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => navigate('/forum')}
            sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
          >
            Explore Forum
          </Button>
        </>
      )}
    </Paper>
  );
};

export default ForumPreview;