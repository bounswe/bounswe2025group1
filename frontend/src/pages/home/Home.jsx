import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import GardenCard from '../../components/GardenCard';
import WeatherWidget from '../../components/WeatherWidget';
import TasksList from '../../components/TasksList';
import ForumPreview from '../../components/ForumPreview';

const Home = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>

        {/* Welcome Banner */}
        <Paper elevation={3} sx={{ p: 4, mb: 5, background: 'linear-gradient(135deg, #81c784 0%, #388e3c 100%)', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            {currentUser ? `Welcome, ${currentUser.username}!` : 'Welcome to Community Garden Planner!'}
          </Typography>
          <Typography variant="body1" paragraph>
            Connect with local gardeners, manage tasks, track your garden, and grow together 🌱
          </Typography>
          {!currentUser && (
            <Button variant="contained" color="secondary" onClick={() => navigate('/auth/register')}>
              Join Our Community
            </Button>
          )}
        </Paper>

        <Box
          display="grid"
          gridTemplateColumns="1fr 2fr"
          gap={2}
          sx={{ height: 300, mb: 15 }}
        >
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Weather Update
            </Typography>
            <WeatherWidget />
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflowX: 'auto'
            }}
          >
            <Box display="flex" justifyContent="center" gap={2}>
              {gardens.slice(0, 2).map((garden) => (
                <Box key={garden.id} width="300px">
                  <GardenCard
                    garden={{ ...garden, image: `/gardens/garden${garden.id % 5}.png` }}
                    variant="compact"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <ForumPreview posts={posts} limit={2} sx={{ mt: 20 }} />

        {!currentUser && (
          <Paper elevation={1} sx={{ mt: 6, p: 4 }}>
            <Typography variant="h5" gutterBottom>What is Community Garden Planner?</Typography>
            <Typography variant="body1" paragraph>
              Community Garden Planner is a platform designed to help you manage your garden and connect with local gardeners.
              In the platform, you can create and manage your own garden, track tasks, ask gardening questions to experts, and even connect with other gardeners in your area.
              Our goal is to foster recreational gardening, community engagement, and environmental avareness.
              Join the community today and lets make a difference together!
            </Typography>
            <Button variant="contained" onClick={() => navigate('/auth/register')}>
              Create Your First Garden
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Home;