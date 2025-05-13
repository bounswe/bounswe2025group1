import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { useAuth } from '../contexts/AuthContextUtils';
import GardenCard from './GardenCard';

const GardensPreview = ({ limit = 2 }) => {
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchGardens = async () => {
      try {
        const url = token 
          ? `${import.meta.env.VITE_API_URL}/memberships/my-gardens/`
          : `${import.meta.env.VITE_API_URL}/gardens/`;
        
        const headers = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Token ${token}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch gardens');
        }

        const data = await response.json();
        setGardens(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching gardens:', error);
        setLoading(false);
      }
    };

    fetchGardens();
  }, [token]);

  if (loading) {
    return (
      <Paper elevation={1} sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        <CircularProgress color="success" />
      </Paper>
    );
  }

  if (gardens.length === 0) {
    return (
      <Paper elevation={1} sx={{ 
        p: 2, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center'
      }}>
        <Typography variant="h6" gutterBottom>
          Gardens
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {token ? 'You have no gardens yet.' : 'No gardens available.'}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>
        {token ? 'My Gardens' : 'Featured Gardens'}
      </Typography>
      <Box display="flex" justifyContent="center" gap={2}>
        {gardens.slice(0, limit).map((garden) => (
          <Box key={garden.id} width="300px">
            <GardenCard
              garden={{ ...garden, image: `/gardens/garden${garden.id % 5}.png` }}
              variant="compact"
            />
          </Box>
        ))}
      </Box>
    </>
  );
};

export default GardensPreview;
