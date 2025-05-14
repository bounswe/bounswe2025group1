import React from 'react';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import CalendarTab from '../../components/CalendarTab';
import WeatherWidget from '../../components/WeatherWidget';
import TasksList from '../../components/TasksList';

const Tasks = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchTasksFromGardens = async () => {
      try {
        // Step 1: Get the user's profile to get ID
        const profileRes = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const profileData = await profileRes.json();
        const userId = profileData.id;
        const username = profileData.username;
        
        // Step 2: Get all memberships to find accepted gardens
        const membershipsRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const membershipsData = await membershipsRes.json();
        
        // Filter to get only gardens where the user has been accepted
        const acceptedGardenIds = membershipsData
          .filter(m => m.status === 'ACCEPTED' && m.username === username)
          .map(m => m.garden);

        // Step 3: Fetch tasks for each garden and compile all user's tasks
        const userTasks = [];
        
        for (const gardenId of acceptedGardenIds) {
          try {
            const gardenTasksRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/?garden=${gardenId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`
              }
            });
            
            const gardenTasksData = await gardenTasksRes.json();
            
            // Add tasks that are assigned to the current user
            const userAssignedTasks = gardenTasksData.filter(
              task => task.assigned_to === userId
            );
            
            userTasks.push(...userAssignedTasks);
          } catch (error) {
            console.warn(`Failed to fetch tasks for garden ${gardenId}:`, error);
          }
        }
        
        setTasks(userTasks);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTasksFromGardens();
    }
  }, [token]);

  if (!token) {
    return (
      <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Please log in to see your tasks.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/auth/login')}>
          Log In
        </Button>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }
  
  const pendingTasks = tasks.filter(t => t.status === 'PENDING');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
        <Box
          display="grid"
          gridTemplateColumns="1fr 2fr"
          gap={2}
          sx={{ height: 300 }}
        >
          <WeatherWidget />
          <Box>
            {pendingTasks.length > 0 && (
              <TasksList
                tasks={pendingTasks}
                title="Pending Tasks"
                limit={3}
              />
            )}
            {inProgressTasks.length > 0 && (
              <TasksList
                tasks={inProgressTasks}
                title="In Progress Tasks"
                limit={3}
                sx={{ mt: pendingTasks.length > 0 ? 3 : 0 }}
              />
            )}
          </Box>
        </Box>
        <Box mt={20}>
          <Typography variant="h4" sx={{ mt: 1, mb: 2, color: '#558b2f' }}>
            Task Calendar
          </Typography>

          <CalendarTab
            tasks={tasks}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default Tasks;
