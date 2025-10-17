import React from 'react';
import { useState, useEffect } from 'react';
import { Container, Typography, Box, Button, CircularProgress, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CalendarTab from '../../components/CalendarTab';
import WeatherWidget from '../../components/WeatherWidget';
import TaskList from '../../components/TaskList';
import TaskModal from '../../components/TaskModal';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Tasks = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useTranslation();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setTaskModalOpen(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${updatedTask.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        toast.error(t('tasks.updateFailed'));
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(t('tasks.taskUpdated'));
      setTaskModalOpen(false);
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(t('tasks.couldNotUpdateTask'));
    }
  };

  const handleTaskDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      toast.success(t('tasks.taskDeleted'));
      setTaskModalOpen(false);
    } catch {
      toast.error(t('tasks.failedToDeleteTask'));
    }
  };

  const handleAcceptTask = async (task) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${task.id}/accept/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Accept failed:', errorText);
        toast.error(t('tasks.acceptFailed'));
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(t('tasks.taskAccepted'));
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error(t('tasks.couldNotAcceptTask'));
    }
  };

  const handleDeclineTask = async (task) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${task.id}/decline/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Decline failed:', errorText);
        toast.error(t('tasks.declineFailed'));
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success(t('tasks.taskDeclined'));
    } catch (err) {
      console.error('Error declining task:', err);
      toast.error(t('tasks.couldNotDeclineTask'));
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const tasksResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/user/${user.user_id}/tasks/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData);
        } else {
          console.error('Failed to fetch tasks');
          toast.error(t('tasks.failedToFetchTasks'));
          setTasks([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error(t('tasks.errorFetchingTasks'));
      }
      setLoading(false);
    };

    if (token) {
      fetchTasks();
    }
  }, [token, user]);

  if (!token) {
    return (
      <Box
        sx={{
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          {t('tasks.pleaseLogIn')}
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/auth/login')}>
          {t('tasks.logIn')}
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

  return (
    <>
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
          <Box display="grid" gridTemplateColumns="1fr 2fr" gap={2}>
            <WeatherWidget />
            <TaskList
              tasks={tasks}
              handleTaskClick={handleTaskClick}
              handleAcceptTask={handleAcceptTask}
              handleDeclineTask={handleDeclineTask}
            />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ mt: 1, mb: 2, color: theme.palette.primary.main }}>
              {t('tasks.taskCalendar')}
            </Typography>
            <CalendarTab tasks={tasks} handleTaskClick={handleTaskClick} />
          </Box>
        </Container>
      </Box>
      <TaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={handleTaskUpdate}
        onDelete={handleTaskDelete}
        handleAcceptTask={handleAcceptTask}
        handleDeclineTask={handleDeclineTask}
        task={selectedTask}
        gardenId={selectedTask ? selectedTask.garden : null}
        mode="edit"
      />
      ;
    </>
  );
};

export default Tasks;
