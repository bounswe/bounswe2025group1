import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Paper
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import api from '../../utils/api';
import {
  Modal, TextField, MenuItem, Fade, Backdrop, Switch
} from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import TaskIcon from '@mui/icons-material/Task';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TaskModal from './TaskModal';

const GardenDetail = () => {
  const [garden, setGarden] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const [taskForm, setTaskForm] = useState({
    type: 'Custom',
    title: '',
    description: '',
    deadline: '',
    status: 'Pending',
    assignment_status: 'Unassigned',
    assignees: [],
    harvest_amounts: {},
    maintenance_type: '',
    custom_type: '',
  });

  const { gardenId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGardenData = async () => {
      try {
        // Fetch garden details and tasks in parallel
        const [gardenRes, tasksRes] = await Promise.all([
          api.getGarden(gardenId),
          api.getGardenTasks(gardenId)
        ]);

        setGarden(gardenRes.data);
        setTasks(tasksRes.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching garden data:', error);
        setLoading(false);
      }
    };

    fetchGardenData();
  }, [gardenId]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };


  // Simulate user membership (in a complete implementation, this would come from the API)
  const isMember = currentUser ? true : false;
  const isManager = currentUser ? true : false;

  // Mock members data (in a real implementation, this would come from the API)
  const members = [
    { id: '1', name: 'John Doe', role: 'Manager' },
    { id: '2', name: 'Jane Smith', role: 'Worker' },
    { id: '3', name: 'Robert Johnson', role: 'Worker' },
    { id: '4', name: 'Sarah Williams', role: 'Worker' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  if (!garden) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Garden not found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/gardens')}
          sx={{ mt: 2, backgroundColor: '#558b2f' }}
        >
          Back to Gardens
        </Button>
      </Container>
    );
  }

  // Group tasks by status for display
  const pendingTasks = tasks.filter(task => task.status === 'Pending');
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
  const completedTasks = tasks.filter(task => task.status === 'Completed');

  const handleTaskSubmit = async (formData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          ...formData,
          garden: gardenId,
          deadline: new Date(formData.deadline).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Task creation failed');

      const newTask = await response.json();
      setTasks(prev => [...prev, newTask]);
      toast.success('Task created!');
      handleCloseModal();
    } catch (err) {
      console.error(err);
      toast.error('Could not create task.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Garden Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
              {garden.name}
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Chip
                icon={<LocationOnIcon />}
                label={garden.location}
                size="small"
                sx={{ bgcolor: '#e8f5e9' }}
              />
              <Chip
                icon={<GroupIcon />}
                label={`${garden.members} Members`}
                size="small"
                sx={{ bgcolor: '#e8f5e9' }}
              />
              <Chip
                icon={<TaskIcon />}
                label={`${garden.tasks} Tasks`}
                size="small"
                sx={{ bgcolor: '#e8f5e9' }}
              />
            </Box>
            <Typography variant="body1" paragraph>
              {garden.description}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {currentUser ? (
              isMember ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => alert('Leave garden functionality would be implemented here')}
                  sx={{ mr: 1 }}
                >
                  Leave Garden
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => alert('Join garden functionality would be implemented here')}
                  sx={{ mr: 1, backgroundColor: '#558b2f' }}
                >
                  Join Garden
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
                sx={{ mr: 1, backgroundColor: '#558b2f' }}
              >
                Login to Join
              </Button>
            )}
            {isManager && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => alert('Garden settings would be implemented here')}
                sx={{ color: '#558b2f', borderColor: '#558b2f' }}
              >
                Manage Garden
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '.MuiTabs-indicator': { backgroundColor: '#558b2f' },
            '.Mui-selected': { color: '#558b2f' }
          }}
        >
          <Tab label="Tasks" />
          <Tab label="Members" />
          <Tab label="Calendar" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Tasks Tab */}
        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#558b2f' }}>Garden Tasks</Typography>
              {isMember && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleOpenModal}
                  sx={{ backgroundColor: '#558b2f' }}
                >
                  Add Task
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              {/* Pending Tasks */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={1} sx={{ p: 2, height: '100%', borderTop: '4px solid #ff9800' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Pending ({pendingTasks.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => (
                      <Card key={task.id} sx={{ mb: 1.5, bgcolor: '#fff9c4' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle2">{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Due: {task.deadline}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">
                              {task.assignee || 'Unassigned'}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => alert(`View task ${task.id}`)}
                              sx={{ color: '#558b2f', p: 0 }}
                            >
                              Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No pending tasks
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* In Progress Tasks */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={1} sx={{ p: 2, height: '100%', borderTop: '4px solid #2196f3' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    In Progress ({inProgressTasks.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map((task) => (
                      <Card key={task.id} sx={{ mb: 1.5, bgcolor: '#e3f2fd' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle2">{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Due: {task.deadline}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">
                              {task.assignee || 'Unassigned'}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => alert(`View task ${task.id}`)}
                              sx={{ color: '#558b2f', p: 0 }}
                            >
                              Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No tasks in progress
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Completed Tasks */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper elevation={1} sx={{ p: 2, height: '100%', borderTop: '4px solid #4caf50' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Completed ({completedTasks.length})
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task) => (
                      <Card key={task.id} sx={{ mb: 1.5, bgcolor: '#e8f5e9' }}>
                        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="subtitle2">{task.title}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Completed: {task.deadline}
                          </Typography>
                          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption">
                              {task.assignee || 'Unassigned'}
                            </Typography>
                            <Button
                              size="small"
                              onClick={() => alert(`View task ${task.id}`)}
                              sx={{ color: '#558b2f', p: 0 }}
                            >
                              Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No completed tasks
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Members Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#558b2f' }}>Garden Members</Typography>
              {isManager && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => alert('Invite members functionality would be implemented here')}
                  sx={{ backgroundColor: '#558b2f' }}
                >
                  Invite Members
                </Button>
              )}
            </Box>

            <List>
              {members.map((member) => (
                <Paper key={member.id} elevation={1} sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <AccountCircleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={member.name}
                      secondary={`Role: ${member.role}`}
                    />
                    {isManager && member.role !== 'Manager' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => alert(`Remove member ${member.id}`)}
                      >
                        Remove
                      </Button>
                    )}
                  </ListItem>
                </Paper>
              ))}
            </List>
          </Box>
        )}

        {/* Calendar Tab */}
        {activeTab === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CalendarMonthIcon sx={{ fontSize: 60, color: '#558b2f', opacity: 0.6 }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
              Garden Calendar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              The calendar feature will be implemented in a future update.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This section will display scheduled tasks, harvests, and maintenance activities.
            </Typography>
          </Box>
        )}
      </Box>
      <TaskModal
        open={openModal}
        onClose={handleCloseModal}
        onSubmit={handleTaskSubmit}
      />

    </Container>
  );
};

export default GardenDetail;