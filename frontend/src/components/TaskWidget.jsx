import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
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
        }

        const data = await response.json();
        setTasks(data);
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
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TaskList tasks={tasks} title="Your Tasks" />
    </Box>
  );
};

export default TaskWidget;
