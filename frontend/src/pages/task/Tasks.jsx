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
import TaskModal from '../../components/TaskModal';

const Tasks = () => {
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  const [gardens, setGardens] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------- New Task Modal ----------
  const [openNewModal, setOpenNewModal] = useState(false);
  const handleOpenNew = () => setOpenNewModal(true);
  const handleCloseNew = () => setOpenNewModal(false);

  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const handleTaskChipClick = (task) => {
    setSelectedTask(task);
    setOpenEditModal(true);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'Pending',
    assignees: [],
    custom_type: ''
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [gRes, tRes, wRes, pRes] = await Promise.all([
          api.getGardens(),
          api.getTasks(),
          api.getWeather(),
          api.getPosts(),
        ]);
        setGardens(gRes.data || []);
        setTasks(tRes.data || []);
        setWeather(wRes.data || null);
        setPosts(pRes.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'Pending');

  const handleCreate = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status.toUpperCase(),
        due_date: new Date(data.deadline).toISOString(),
        assignees: data.assignees,
        custom_type: data.custom_type
      };
      const res = await api.createTask(payload);
      setTasks(tasks.concat(res.data));
      handleCloseNew();
    } catch {
      console.error('Create failed');
    }
  };

  const handleUpdate = async (data) => {
    try {
      const payload = {
        title: data.title,
        description: data.description,
        status: data.status.toUpperCase(),
        due_date: new Date(data.deadline).toISOString(),
        assignees: data.assignees,
        custom_type: data.custom_type
      };
      const res = await api.updateTask(selectedTask.id, payload);
      setTasks(tasks.map(t => t.id === res.data.id ? res.data : t));
      setOpenEditModal(false);
    } catch {
      console.error('Update failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(selectedTask.id);
      setTasks(tasks.filter(t => t.id !== selectedTask.id));
      setOpenEditModal(false);
    } catch {
      console.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <Box sx={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

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
                onTaskClick={handleTaskChipClick}
              />
            </Box>
          </Paper>
        </Box>
        <Box mt={30}>
          <CalendarTab
            tasks={tasks.map(t => ({
              ...t,
              due_date: t.deadline
            }))}
            onTaskClick={handleTaskChipClick}
            onEmptyDayClick={(date) => {
              setFormData((prev) => ({
                ...prev,
                deadline: date.toISOString()
              }));
              handleOpenNew();
            }}
          />
        </Box>
      </Container>



      {/* New Task Modal */}
      <TaskModal
        open={openNewModal}
        onClose={handleCloseNew}
        onSubmit={handleCreate}
        initialData={formData}
      />

      {/* Edit Task Modal */}
      <TaskModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        onSubmit={handleUpdate}
        onDelete={handleDelete}
        initialData={selectedTask}
      />
    </Box>
  );
};

export default Tasks;
