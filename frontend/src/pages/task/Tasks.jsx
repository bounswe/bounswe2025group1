import React from 'react';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import api from '../../utils/api';
import CalendarTab from '../../components/CalendarTab';
import WeatherWidget from '../../components/WeatherWidget';
import TasksList from '../../components/TasksList';

const Tasks = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  const [gardens, setGardens] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [gRes, wRes, pRes] = await Promise.all([
          api.getGardens(),
          api.getWeather(),
          api.getPosts(),
        ]);

        const tRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const taskData = await tRes.json();

        setGardens(gRes.data || []);
        setTasks(taskData || []);
        setWeather(wRes.data || null);
        setPosts(pRes.data || []);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAll();
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

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
        <Box
          display="grid"
          gridTemplateColumns="1fr 2fr"
          gap={2}
          sx={{ height: 300 }}
        >
          <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Weather Update
            </Typography>
            <WeatherWidget weatherData={weather} />
          </Paper>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Pending Tasks
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <TasksList
                tasks={pendingTasks}
                title=""
                limit={4}
              />
            </Box>
          </Paper>
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
