import React from 'react';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Tabs,
  Tab,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Paper,
  useTheme,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import TaskIcon from '@mui/icons-material/Task';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import TaskModal from '../../components/TaskModal';
import CalendarTab from '../../components/CalendarTab';
import GardenModal from '../../components/GardenModal';
import TaskBoard from '../../components/TaskBoard';
import { useTranslation } from 'react-i18next';
import ImageGallery from '../../components/ImageGallery';
import { translateLocationString } from '../../utils/locationUtils';

const GardenDetail = () => {
  const { t, i18n } = useTranslation();
  const [garden, setGarden] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const { user, token } = useAuth();
  const theme = useTheme();
  const [openGardenEditModal, setOpenGardenEditModal] = useState(false);
  const handleOpenGardenEditModal = () => setOpenGardenEditModal(true);
  const handleCloseGardenEditModal = () => setOpenGardenEditModal(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userMembership, setUserMembership] = useState(null);
  const [taskForm, setTaskForm] = useState({
    type: 'CUSTOM',
    title: '',
    description: '',
    deadline: '',
    status: 'PENDING',
    assignment_status: 'Unassigned',
    assignees: [],
    harvest_amounts: {},
    maintenance_type: '',
    custom_type: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    isPublic: false,
  });

  const { gardenId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGardenData = async () => {
      setLoading(true);
      try {
        const gardenHeaders = {
          'Content-Type': 'application/json',
        };
        if (token) {
          gardenHeaders.Authorization = `Token ${token}`;
        }
        
        const gardenRes = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
          method: 'GET',
          headers: gardenHeaders,
        });
        const gardenData = await gardenRes.json();
        setGarden(gardenData);

        // Only fetch tasks and members for authenticated users
        if (token) {
          const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/?garden=${gardenId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${token}`,
            },
          });
          const tasksData = await tasksRes.json();
          setTasks(tasksData);

          const membersResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/gardens/${gardenId}/members/`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
              },
            }
          );
          const membersData = await membersResponse.json();
          setMembers(membersData || []);
          if (user) {
            const userMember = membersData?.find((m) => m.username === user.username);
            setIsMember(!!userMember);
            setIsManager(userMember?.role === 'MANAGER');
            setUserMembership(userMember);
          }
        }
        setEditForm({
          name: gardenData.name || '',
          description: gardenData.description || '',
          location: gardenData.location || '',
          isPublic: gardenData.is_public || false,
        });
      } catch (error) {
        console.error('Error fetching garden data:', error);
      }
      setLoading(false);
    };

    if (gardenId) {
      fetchGardenData();
    }
  }, [gardenId, user, token]);

  const refreshMembers = async () => {
    try {
      const membersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/gardens/${gardenId}/members/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        }
      );
      const membersData = await membersResponse.json();
      setMembers(membersData || []);
      // Update user membership status
      const userMember = membersData?.find((m) => m.username === user.username);
      setIsMember(!!userMember);
      setUserMembership(userMember);
    } catch (error) {
      console.error('Error refreshing members:', error);
    }
  };

  const handleTaskChipClick = (task) => {
    // Format the task data to ensure consistent structure for the modal
    setSelectedTask({
      status: task.status || 'PENDING',
      custom_type: task.custom_type || task.task_type,
      ...task,
    });
    setEditTaskModalOpen(true);
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
      toast.success(t('tasks.taskUpdatedSuccessfully'));
      setEditTaskModalOpen(false);
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error(t('tasks.failedToUpdateTask'));
    }
  };

  const handleTaskDelete = async () => {
    if (!window.confirm(t('gardens.confirmDeleteTask'))) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      });
      setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id));
      toast.success(t('gardens.taskDeleted'));
      setEditTaskModalOpen(false);
    } catch {
      toast.error(t('gardens.failedToDeleteTask'));
    }
  };

  const handleJoinGarden = async () => {
    try {
      // Creates a membership request for the current user to join the garden
      const joinRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          garden: parseInt(gardenId),
        }),
      });

      if (!joinRes.ok) {
        toast.error(t('gardens.failedToJoinGarden'));
        return;
      }
      toast.success(t('gardens.requestToJoinSent'));

      await refreshMembers();
    } catch (err) {
      console.error('Join garden error:', err);
      toast.error(t('gardens.failedToJoinGarden'));
    }
  };

  const handleLeaveGarden = async () => {
    if (!window.confirm(t('gardens.confirmLeaveGarden'))) return;

    try {
      if (userMembership) {
        const leaveRes = await fetch(
          `${import.meta.env.VITE_API_URL}/memberships/${userMembership.id}/`,
          {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!leaveRes.ok) {
          toast.error(t('gardens.failedToLeaveGarden'));
          return;
        }

        toast.success(t('gardens.youHaveLeftGarden'));
        // Update state
        setIsMember(false);
        setIsManager(false);
        setUserMembership(null);

        await refreshMembers();
      }
    } catch (err) {
      console.error('Leave garden error:', err);
      toast.error(t('gardens.failedToLeaveGarden'));
    }
  };

  const handleRemoveMember = async (membershipId) => {
    if (!window.confirm(t('gardens.confirmRemoveMember'))) return;

    try {
      const removeRes = await fetch(
        `${import.meta.env.VITE_API_URL}/memberships/${membershipId}/`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        }
      );

      if (!removeRes.ok) {
        toast.error(t('gardens.failedToRemoveMember'));
        return;
      }
      toast.success(t('gardens.memberRemovedFromGarden'));

      await refreshMembers();
    } catch (err) {
      console.error('Remove member error:', err);
      toast.error(t('gardens.failedToRemoveMember'));
    }
  };

  const handleChangeMemberRole = async (membershipId, newRole) => {
    try {
      const updateRes = await fetch(
        `${import.meta.env.VITE_API_URL}/memberships/${membershipId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      if (!updateRes.ok) {
        toast.error(t('gardens.failedToUpdateMemberRole'));
        return;
      }
      toast.success(t('gardens.memberRoleUpdated'));

      await refreshMembers();
    } catch (err) {
      console.error('Change role error:', err);
      toast.error(t('gardens.failedToUpdateMemberRole'));
    }
  };

  const handleAcceptMember = async (membershipId) => {
    try {
      const acceptRes = await fetch(
        `${import.meta.env.VITE_API_URL}/memberships/${membershipId}/accept/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!acceptRes.ok) {
        toast.error(t('gardens.failedToAcceptMember'));
        return;
      }

      toast.success(t('gardens.memberAccepted'));

      await refreshMembers();
    } catch (err) {
      console.error('Accept member error:', err);
      toast.error(t('gardens.failedToAcceptMember'));
    }
  };

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
          sx={{ mt: 2 }}
        >
          Back to Gardens
        </Button>
      </Container>
    );
  }
  const handleTaskSubmit = async (formData) => {
    if (!token) {
      toast.error('You must be logged in to create a task.');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/?garden=${gardenId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        toast.error('Could not create task. Check your input and permissions.');
        return;
      }

      setTasks((prev) => [...prev, data]);
      toast.success('Task created!');
      setOpenTaskModal(false);
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Something went wrong while creating the task.');
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

  const handleGardenSubmit = async (e, formData) => {
    e.preventDefault();

    try {
      // Extract image data if provided
      const { cover_image_base64, gallery_base64, ...basicFormData } = formData || editForm;
      
      const requestBody = {
        name: basicFormData.name || editForm.name,
        description: basicFormData.description || editForm.description,
        location: basicFormData.location || editForm.location,
        is_public: basicFormData.isPublic !== undefined ? basicFormData.isPublic : editForm.isPublic,
      };

      // Add image data if provided
      if (cover_image_base64 !== undefined) {
        requestBody.cover_image_base64 = cover_image_base64;
      }
      if (gallery_base64 !== undefined) {
        requestBody.gallery_base64 = gallery_base64;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        toast.error('Update failed');
        return;
      }

      const updatedGarden = await response.json();
      setGarden(updatedGarden);
      toast.success('Garden updated!');
      handleCloseGardenEditModal();
    } catch (err) {
      console.error('Error updating garden:', err);
      toast.error('Error updating garden');
    }
  };

  const handleDeleteGarden = async () => {
    if (!window.confirm('Are you sure you want to delete this garden?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (res.status === 204) {
        toast.success(t('gardens.gardenDeleted'));
        navigate('/gardens');
      } else {
        toast.error(t('gardens.failedToDelete'));
        return;
      }
    } catch (err) {
      console.error('Error deleting garden:', err);
      toast.error(t('gardens.couldNotDeleteGarden'));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Garden Cover Image */}
      {garden?.cover_image?.image_base64 && (
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              position: 'relative',
              height: { xs: 250, sm: 350, md: 450 },
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              backgroundImage: `url(${garden.cover_image.image_base64})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                zIndex: 1,
              }
            }}
          >
            {/* Content overlay */}
            <Box sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0, 
              p: { xs: 3, sm: 4, md: 5 },
              zIndex: 2,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
            }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 700,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  mb: 1,
                  lineHeight: 1.2
                }}
              >
                {garden.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocationOnIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.2rem' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                    fontWeight: 400
                  }}
                >
                  {translateLocationString(garden.location, i18n.language)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 2,
                  py: 1,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}>
                  <GroupIcon sx={{ color: 'white', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {t('gardens.members', { count: members.length })}
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 2,
                  py: 1,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)'
                }}>
                  <TaskIcon sx={{ color: 'white', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                    {t('gardens.tasks', { count: tasks.length })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Garden Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            {!garden?.cover_image?.image_base64 && (
              <Typography
                variant="h4"
                gutterBottom
                sx={{ color: theme.palette.primary.main, fontWeight: 'bold', textAlign: 'start' }}
              >
                {garden.name}
              </Typography>
            )}
            {!garden?.cover_image?.image_base64 && (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Chip
                  icon={<LocationOnIcon />}
                  label={translateLocationString(garden.location, i18n.language)}
                  size="small"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9',
                    color: theme.palette.mode === 'dark' ? '#4caf50' : theme.palette.text.primary
                  }}
                />
                <Chip
                  icon={<GroupIcon />}
                  label={t('gardens.members', { count: members.length })}
                  size="small"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9',
                    color: theme.palette.mode === 'dark' ? '#4caf50' : theme.palette.text.primary
                  }}
                />
                <Chip
                  icon={<TaskIcon />}
                  label={t('gardens.tasks', { count: tasks.length })}
                  size="small"
                  sx={{ 
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.2)' : '#e8f5e9',
                    color: theme.palette.mode === 'dark' ? '#4caf50' : theme.palette.text.primary
                  }}
                />
              </Box>
            )}
            <Typography variant="body1" sx={{ textAlign: 'start', fontSize: '1.1rem', lineHeight: 1.6 }}>
              {garden.description}
            </Typography>
          </Grid>{' '}
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}
          >
            {user ? (
              isMember ? (
                userMembership?.status === 'PENDING' ? (
                  <Button variant="outlined" disabled sx={{ mr: 1 }}>
                    {t('gardens.requestPending')}
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleLeaveGarden}
                    sx={{ mr: 1 }}
                  >
                    {t('gardens.leaveGarden')}
                  </Button>
                )
              ) : (
                <Button
                  variant="contained"
                  onClick={handleJoinGarden}
                  sx={{ mr: 1 }}
                >
                  {t('gardens.joinGarden')}
                </Button>
              )
            ) : (
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
                sx={{ mr: 1 }}
              >
                {t('gardens.loginToJoin')}
              </Button>
            )}
            {isManager && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleOpenGardenEditModal}
              >
                {t('gardens.manageGarden')}
              </Button>
            )}
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label={t('gardens.tasksTab')} />
          <Tab label={t('gardens.membersTab')} />
          <Tab label={t('gardens.calendarTab')} />
          <Tab label={t('gardens.galleryTab')} />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {/* Tasks Tab */}
        {activeTab === 0 && (
          <Box>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Typography variant="h6" sx={{ color: theme.palette.primary.main }}>
                {t('gardens.gardenTasks')}
              </Typography>
              {isMember && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setOpenTaskModal(true);
                  }}
                >
                  {t('gardens.addTask')}
                </Button>
              )}
            </Box>

            {!token ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                textAlign: 'center'
              }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {t('tasks.pleaseLogIn')}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/login')}
                  sx={{ mt: 2 }}
                >
                  {t('tasks.logIn')}
                </Button>
              </Box>
            ) : (
              <TaskBoard
                tasks={tasks}
                setTasks={setTasks}
                onTaskClick={handleTaskChipClick}
                handleTaskUpdate={handleTaskUpdate}
              />
            )}
          </Box>
        )}

        {/* Members Tab */}
        {activeTab === 1 && (
          <Box>
            {!token ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                p: 4,
                textAlign: 'center'
              }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Please log in to view garden members.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/auth/login')}
                  sx={{ mt: 2 }}
                >
                  {t('tasks.logIn')}
                </Button>
              </Box>
            ) : (
              <List>
                {members.map((member) => (
                <Paper key={member.id} elevation={1} sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <AccountCircleIcon />
                      </Avatar>
                    </ListItemAvatar>{' '}
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/profile/${member.user_id}`)}
                        >
                          {member.username || `User ${member.id || 'Unknown'}`}
                        </Typography>
                      }
                      secondary={`${t('gardens.role')}: ${t(`gardens.${member.role.toLowerCase()}`)} • ${t('gardens.status')}: ${t(`gardens.${member.status.toLowerCase()}`)}`}
                    />{' '}
                    {isManager && member.id !== userMembership?.id && (
                      <>
                        {member.status === 'PENDING' ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleAcceptMember(member.id)}
                            sx={{ mr: 1 }}
                          >
                            {t('gardens.accept')}
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() =>
                              handleChangeMemberRole(
                                member.id,
                                member.role === 'MANAGER' ? 'WORKER' : 'MANAGER'
                              )
                            }
                            sx={{ mr: 1 }}
                          >
                            {member.role === 'MANAGER' ? t('gardens.demote') : t('gardens.promote')}
                          </Button>
                        )}
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          {t('gardens.remove')}
                        </Button>
                      </>
                    )}
                  </ListItem>
                </Paper>
              ))}
              {members.length === 0 && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ textAlign: 'center', mt: 3 }}
                >
                  {t('gardens.noMembersFound')}
                </Typography>
              )}
              </List>
            )}
          </Box>
        )}

        {/* Calendar Tab */}
        {activeTab === 2 && (
          !token ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 4,
              textAlign: 'center'
            }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {t('tasks.pleaseLogIn')}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/auth/login')}
                sx={{ mt: 2 }}
              >
                {t('tasks.logIn')}
              </Button>
            </Box>
          ) : (
            <CalendarTab
              tasks={tasks}
              onTaskClick={handleTaskChipClick}
              onEmptyDayClick={(date) => {
                setTaskForm((prev) => ({
                  ...prev,
                  deadline: date.toISOString(),
                }));
                setOpenTaskModal(true);
              }}
            />
          )
        )}

        {/* Gallery Tab */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, mb: 3 }}>
              {t('gardens.gardenGallery')}
            </Typography>
            {garden?.images && garden.images.length > 0 ? (
              <ImageGallery 
                images={garden.images}
                coverImage={garden.cover_image}
                maxColumns={3}
                imageHeight={200}
                showCoverBadge={true}
              />
            ) : (
              <Box sx={{ 
                p: 4, 
                textAlign: 'center', 
                backgroundColor: 'background.paper', 
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider'
              }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('gardens.noImagesYet')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('gardens.managersCanAddImages')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
      <TaskModal
        open={openTaskModal}
        onClose={() => setOpenTaskModal(false)}
        onSubmit={handleTaskSubmit}
        initialData={taskForm}
        gardenId={gardenId}
        members={members}
      />
      <GardenModal
        open={openGardenEditModal}
        onClose={handleCloseGardenEditModal}
        form={editForm}
        handleChange={(e) => setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
        handleTogglePublic={() => setEditForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
        handleSubmit={handleGardenSubmit}
        handleDelete={handleDeleteGarden}
        mode="edit"
        existingImages={garden}
      />
      <TaskModal
        open={editTaskModalOpen}
        onClose={() => setEditTaskModalOpen(false)}
        onSubmit={handleTaskUpdate}
        onDelete={handleTaskDelete}
        handleAcceptTask={handleAcceptTask}
        handleDeclineTask={handleDeclineTask}
        task={selectedTask}
        gardenId={gardenId}
        members={members}
        mode="edit"
      />
    </Container>
  );
};

export default GardenDetail;
