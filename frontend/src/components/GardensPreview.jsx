import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import GardenCard from './GardenCard';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

const GardensPreview = ({ limit = 2 }) => {
  const { t } = useTranslation();
  const [gardens, setGardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchGardens = async () => {
      try {
        if (token) {
          const membershipsResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/user/${user.user_id}/gardens`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
              },
            }
          );

          if (!membershipsResponse.ok) {
            toast.error('Failed to fetch memberships');
            setLoading(false);
            return;
          }

          const membershipsData = await membershipsResponse.json();

          // Filter memberships where status is ACCEPTED and username matches
          const acceptedGardenIds = membershipsData
            .filter((m) => m.status === 'ACCEPTED')
            .map((m) => m.garden);

          // Fetch each garden by ID
          const gardensData = [];
          for (const gardenId of acceptedGardenIds) {
            const gardenResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Token ${token}`,
                },
              }
            );

            if (gardenResponse.ok) {
              const gardenData = await gardenResponse.json();
              gardensData.push(gardenData);
            }
          }

          setGardens(gardensData);
        } else {
          // For non-authenticated users, fetch public gardens
          const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            toast.error('Failed to fetch gardens');
            setLoading(false);
            return;
          }

          const data = await response.json();
          setGardens(data);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching gardens:', error);
        setLoading(false);
      }
    };

    fetchGardens();
  }, [token, user]);

  if (loading) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="success" />
      </Paper>
    );
  }

  if (gardens.length === 0) {
    return (
      <Paper
        elevation={1}
        sx={{
          p: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          {t('navigation.gardens')}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {token ? t('gardens.noGardensYet') : t('gardens.noGardensAvailable')}
        </Typography>
      </Paper>
    );
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>
        {token ? t('gardens.myGardens') : t('gardens.featuredGardens')}
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
