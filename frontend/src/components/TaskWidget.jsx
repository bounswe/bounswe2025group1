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
import { useTranslation } from 'react-i18next';
import TaskList from './TaskList';

const TaskWidget = () => {
  const { t } = useTranslation();
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
            toast.error(t('tasks.failedToFetchTasks'));
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
          p: { xs: 2, sm: 3 },
          mb: { xs: 3, md: 4 },
          height: { xs: 'auto', sm: 300 },
          minHeight: { xs: 250, sm: 300 },
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="success" size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('tasks.loading')}
        </Typography>
      </Paper>
    );
  }

  // Show message for unauthenticated users
  if (!token) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 3 },
          height: { xs: 'auto', sm: 300 },
          minHeight: { xs: 250, sm: 300 },
        }}
      >
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
    <TaskList tasks={tasks} title={t('tasks.title')} />
  );
};

export default TaskWidget;
