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

const Tasks = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

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
        toast.error('Update failed');
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Task updated!');
      setTaskModalOpen(false);
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Could not update task.');
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
      toast.success('Task deleted');
      setTaskModalOpen(false);
    } catch {
      toast.error('Failed to delete task');
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
        toast.error('Accept failed');
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Task accepted!');
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error('Could not accept task.');
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
        toast.error('Decline failed');
        return;
      }

      const updated = await response.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      toast.success('Task declined!');
    } catch (err) {
      console.error('Error declining task:', err);
      toast.error('Could not decline task.');
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
          toast.error('Failed to fetch tasks');
          setTasks([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
        toast.error('Error fetching tasks');
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
              Task Calendar
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
