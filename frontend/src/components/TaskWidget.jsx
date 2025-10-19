import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TaskList from './TaskList';

const TaskWidget = () => {
  const { user, token } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (token) {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/user/${user.user_id}/tasks/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (!response.ok) {
            toast.error('Failed to fetch tasks');
            setLoading(false);
            return;
          }

          const data = await response.json();
          setTasks(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, token]);

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
          Loading tasks...
        </Typography>
      </Paper>
    );
  }

  // Show message for unauthenticated users
  if (!token) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: 300 }}>
        <Typography variant="h6" gutterBottom>
          {t('tasks.title')}
        </Typography>
        <Box sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <Typography variant="body2" color="text.secondary">
            {t('tasks.pleaseLogIn')}
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TaskList tasks={tasks} title="Your Tasks" />
    </Box>
  );
};

export default TaskWidget;
