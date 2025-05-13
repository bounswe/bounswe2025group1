import React from 'react';
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
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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

const GardenDetail = () => {
  const [garden, setGarden] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openInviteModal, setOpenInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const handleOpenTaskModal = () => setOpenTaskModal(true);
  const handleCloseTaskModal = () => setOpenTaskModal(false);
  const { currentUser } = useAuth();
  const { token } = useAuth();
  const [openGardenEditModal, setOpenGardenEditModal] = useState(false);
  const handleOpenGardenEditModal = () => setOpenGardenEditModal(true);
  const handleCloseGardenEditModal = () => setOpenGardenEditModal(false);
  const [customTaskTypes, setCustomTaskTypes] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editTaskModalOpen, setEditTaskModalOpen] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [userMembership, setUserMembership] = useState(null);

  const handleTaskChipClick = (task) => {
    setSelectedTask(task);
    setEditTaskModalOpen(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      const payload = {
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status?.toUpperCase() || 'PENDING',
        due_date: new Date(updatedTask.deadline).toISOString(),
        assigned_to: updatedTask.assignees?.[0] || null,
        custom_type: updatedTask.custom_type ? parseInt(updatedTask.custom_type) : null,
        garden: parseInt(gardenId)
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update failed:', errorText);
        throw new Error('Update failed');
      }

      const updated = await response.json();
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
      toast.success('Task updated!');
      setEditTaskModalOpen(false);
    } catch (err) {
      toast.error('Could not update task.');
    }
  };


  const handleTaskDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/tasks/${selectedTask.id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` }
      });
      setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
      toast.success('Task deleted');
      setEditTaskModalOpen(false);
    } catch {
      toast.error('Failed to delete task');
    }
  };

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

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    location: '',
    type: '',
    size: '',
    isPublic: false,
  });

  const { gardenId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGardenData = async () => {
      try {
        const gardenRes = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const gardenData = await gardenRes.json();
        setGarden(gardenData);

        const tasksRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });        const tasksData = await tasksRes.json();
        setTasks(tasksData);

        // Fetch garden members
        const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/?garden=${gardenId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const membersData = await membersRes.json();
        setMembers(membersData || []);

        // Check if current user is a member and their role
        if (currentUser) {
          const userMember = membersData?.find(m => m.user && m.user.id === currentUser.id);
          setIsMember(!!userMember);
          setIsManager(userMember?.role === 'MANAGER');
          setUserMembership(userMember);
        }

        setEditForm({
          name: gardenData.name || '',
          description: gardenData.description || '',
          location: gardenData.location || '',
          type: gardenData.type || '',
          size: gardenData.size || '',
          isPublic: gardenData.is_public || false,
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching garden data:', error);
        setLoading(false);
      }
    };

    fetchGardenData();
  }, [gardenId, currentUser, token]);


  useEffect(() => {
    const fetchCustomTaskTypes = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/task-types/?garden=${gardenId}`, {
          headers: { Authorization: `Token ${token}` }
        });
        const data = await response.json();
        setCustomTaskTypes(data);
      } catch (err) {
        toast.error('Could not load custom task types');
      }
    };

    if (token && gardenId) {
      fetchCustomTaskTypes();
    }
  }, [token, gardenId]);


  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleEditPublic = () => {
    setEditForm((prev) => ({ ...prev, isPublic: !prev.isPublic }));
  };
  const handleJoinGarden = async () => {
    try {
      // Creates a membership request for the current user to join the garden
      const joinRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          garden: parseInt(gardenId)
        })
      });
      
      if (!joinRes.ok) {
        throw new Error('Failed to join garden');
      }
      
      toast.success('Request to join garden sent!');
      
      // Refresh members list
      const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/?garden=${gardenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        }
      });
      const membersData = await membersRes.json();
      setMembers(membersData || []);
      
      // Update user membership status
      const userMember = membersData?.find(m => m.user && m.user.id === currentUser.id);
      setIsMember(!!userMember);
      setUserMembership(userMember);
    } catch (err) {
      console.error('Join garden error:', err);
      toast.error('Failed to join garden');
    }
  };
  const handleLeaveGarden = async () => {
    if (!window.confirm('Are you sure you want to leave this garden?')) return;
    
    try {
      if (userMembership) {
        const leaveRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/${userMembership.id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        
        if (!leaveRes.ok) {
          throw new Error('Failed to leave garden');
        }
        
        toast.success('You have left the garden');
        
        // Update state
        setIsMember(false);
        setIsManager(false);
        setUserMembership(null);
        
        // Refresh members list
        const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/?garden=${gardenId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`
          }
        });
        const membersData = await membersRes.json();
        setMembers(membersData || []);
      }
    } catch (err) {
      console.error('Leave garden error:', err);
      toast.error('Failed to leave garden');
    }
  };
  const handleRemoveMember = async (membershipId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      const removeRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/${membershipId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        }
      });
      
      if (!removeRes.ok) {
        throw new Error('Failed to remove member');
      }
      
      toast.success('Member removed from garden');
      
      // Refresh members list
      const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/?garden=${gardenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        }
      });
      const membersData = await membersRes.json();
      setMembers(membersData || []);
    } catch (err) {
      console.error('Remove member error:', err);
      toast.error('Failed to remove member');
    }
  };
  const handleChangeMemberRole = async (membershipId, newRole) => {
    try {
      const updateRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/${membershipId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          role: newRole
        })
      });
      
      if (!updateRes.ok) {
        throw new Error('Failed to update member role');
      }
      
      toast.success('Member role updated');
      
      // Refresh members list
      const membersRes = await fetch(`${import.meta.env.VITE_API_URL}/memberships/?garden=${gardenId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        }
      });
      const membersData = await membersRes.json();
      setMembers(membersData || []);
    } catch (err) {
      console.error('Change role error:', err);
      toast.error('Failed to update member role');
    }
  };

  const handleInviteMember = async () => {
    try {
      // Backend expects user by ID, not email, so we'd need to:
      // 1. Find user ID by email
      // 2. Then create membership
      // For now, let's just show a notification that this is not implemented
      toast.info('Email invitation not currently supported. Users must join using the Join Garden button.');
      setOpenInviteModal(false);
      setInviteEmail('');
    } catch (err) {
      console.error('Invite member error:', err);
      toast.error('Failed to send invitation');
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
          sx={{ mt: 2, backgroundColor: '#558b2f' }}
        >
          Back to Gardens
        </Button>
      </Container>
    );
  }

  const handleTaskSubmit = async (formData) => {

    if (!token) {
      toast.error("You must be logged in to create a task.");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      status: formData.status?.toUpperCase() || 'PENDING',
      due_date: new Date(formData.deadline).toISOString(),
      garden: parseInt(gardenId),
      assigned_to: formData.assignees?.[0] || null,
      custom_type: formData.custom_type ? parseInt(formData.custom_type) : null
    };



    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify(payload),
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

      setTasks(prev => [...prev, data]);
      toast.success('Task created!');
      handleCloseTaskModal();
    } catch (err) {
      toast.error('Something went wrong while creating the task.');
    }
  };

  const handleGardenSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          location: editForm.location,
          is_public: editForm.isPublic,
        }),
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedGarden = await response.json();
      setGarden(updatedGarden);
      toast.success('Garden updated!');
      handleCloseGardenEditModal();
    } catch (err) {
      //toast.error('Error updating garden');
    }
  };

  const handleDeleteGarden = async () => {
    if (!window.confirm('Are you sure you want to delete this garden?')) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/gardens/${gardenId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        }
      });

      if (res.status === 204) {
        toast.success('Garden deleted');
        navigate('/gardens');
      } else {
        throw new Error('Failed to delete');
      }
    } catch (err) {
      toast.error('Could not delete garden.');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Garden Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', textAlign: "start" }}>
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
                label={`${members.length} Members`}
                size="small"
                sx={{ bgcolor: '#e8f5e9' }}
              />
              <Chip
                icon={<TaskIcon />}
                label={`${tasks.length} Tasks`}
                size="small"
                sx={{ bgcolor: '#e8f5e9' }}
              />
            </Box>
            <Typography variant="body1" sx={{ textAlign: 'start' }}>
              {garden.description}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {currentUser ? (
              isMember ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleLeaveGarden}
                  sx={{ mr: 1 }}
                >
                  Leave Garden
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleJoinGarden}
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
                onClick={handleOpenGardenEditModal}
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
                  onClick={handleOpenTaskModal}
                  sx={{ backgroundColor: '#558b2f' }}
                >
                  Add Task
                </Button>
              )}
            </Box>

            <TaskBoard
              tasks={tasks}
              setTasks={setTasks}
              onTaskClick={handleTaskChipClick}
              onStatusUpdate={async (id, newStatus) => {
                await fetch(`${import.meta.env.VITE_API_URL}/tasks/${id}/`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`
                  },
                  body: JSON.stringify({ status: newStatus })
                });
              }}
            />
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
                  onClick={() => setOpenInviteModal(true)}
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
                      primary={member.user?.username || `User ${member.user?.id || 'Unknown'}`}
                      secondary={`Role: ${member.role} • Status: ${member.status}`}
                    />
                    {isManager && member.id !== userMembership?.id && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          onClick={() => handleChangeMemberRole(member.id, member.role === 'MANAGER' ? 'WORKER' : 'MANAGER')}
                          sx={{ mr: 1 }}
                        >
                          {member.role === 'MANAGER' ? 'Demote' : 'Promote'}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          Remove
                        </Button>
                      </>
                    )}
                  </ListItem>
                </Paper>
              ))}
              {members.length === 0 && (
                <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 3 }}>
                  No members found
                </Typography>
              )}
            </List>
          </Box>
        )}

        {/* Calendar Tab */}
        {activeTab === 2 && (
          <CalendarTab tasks={tasks} onTaskClick={handleTaskChipClick} onEmptyDayClick={(date) => {
            setTaskForm((prev) => ({
              ...prev,
              deadline: date.toISOString()
            }));
            setOpenTaskModal(true);
          }} />
        )}
      </Box>
      <TaskModal
        open={openTaskModal}
        onClose={handleCloseTaskModal}
        onSubmit={handleTaskSubmit}
        initialData={taskForm}
      />
      <GardenModal
        open={openGardenEditModal}
        onClose={handleCloseGardenEditModal}
        form={editForm}
        handleChange={handleEditChange}
        handleTogglePublic={handleToggleEditPublic}
        handleSubmit={handleGardenSubmit}
        handleDelete={handleDeleteGarden}
        mode="edit"
      />
      <TaskModal
        open={editTaskModalOpen}
        onClose={() => setEditTaskModalOpen(false)}
        onSubmit={handleTaskUpdate}
        onDelete={handleTaskDelete}
        initialData={selectedTask}
        customTaskTypes={customTaskTypes}
        mode="edit"
      />

      {/* Invite Member Modal */}
      <Dialog open={openInviteModal} onClose={() => setOpenInviteModal(false)}>
        <DialogTitle>Invite New Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email Address"
            type="email"
            fullWidth
            variant="outlined"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInviteModal(false)}>Cancel</Button>
          <Button onClick={handleInviteMember} variant="contained" color="primary">
            Send Invitation
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default GardenDetail;