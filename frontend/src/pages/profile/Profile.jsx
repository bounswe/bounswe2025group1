import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Avatar,
  Button,
  Tabs,
  Tab,
  Paper,
  Grid,
  CircularProgress,
  Divider,
  TextField,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { toast } from 'react-toastify';
import AuthContext from '../../contexts/AuthContextUtils';
import GardenCard from '../../components/GardenCard';
import React from 'react';

const Profile = () => {
  let { userId } = useParams();
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [editedProfile, setEditedProfile] = useState({
    username: '',
    email: '',
    location: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  userId = userId ? userId.toString() : user.user_id.toString();
  const isOwnProfile = !userId || (user && user?.user_id?.toString() === userId);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) {
        navigate('/auth/login');
        return;
      }

      try {
        setLoading(true);
        let endpoint;

        if (isOwnProfile) {
          endpoint = `${import.meta.env.VITE_API_URL}/profile/`;
        } else {
          endpoint = `${import.meta.env.VITE_API_URL}/profile/${userId}/`;
        }

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }

        const data = await response.json();
        if (data.id.toString() === user.user_id.toString() && !isOwnProfile) {
          navigate('/profile');
        }

        setProfile(data);
        setEditedProfile({
          username: data.username,
          email: data.email,
          location: data.profile?.location || '',
        });

        // Check if current user is following this profile
        if (!isOwnProfile && user) {
          const followersResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/user/${userId}/followers/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (followersResponse.ok) {
            const followingData = await followersResponse.json();
            setIsFollowing(followingData.some((u) => u.id.toString() === user.user_id.toString()));
          }
        }

        // Fetch user's gardens
        try {
          const gardensResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/gardens/user/${userId || user.user_id}/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (gardensResponse.ok) {
            const gardensData = await gardensResponse.json();
            setGardens(gardensData);
          }
        } catch (gardenError) {
          console.error('Error fetching gardens:', gardenError);
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        toast.error('Error loading profile');
      }
    };

    fetchProfileData();
  }, [token, userId, user, navigate, isOwnProfile]);

  // Fetch followers and following lists
  useEffect(() => {
    const fetchRelationships = async () => {
      if (!token || !profile) return;

      try {
        const followersResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/user/${userId}/followers/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        const followingResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/user/${userId}/following/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (followersResponse.ok && followingResponse.ok) {
          const followersData = await followersResponse.json();
          const followingData = await followingResponse.json();
          setFollowers(followersData);
          setFollowing(followingData);
        }
      } catch (err) {
        console.error('Error fetching relationships:', err);
      }
    };

    fetchRelationships();
  }, [token, profile]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      username: profile.username,
      email: profile.email,
      location: profile.profile?.location || '',
    });
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('username', editedProfile.username);
      formData.append('email', editedProfile.email);
      formData.append('location', editedProfile.location);

      if (selectedFile) {
        formData.append('profile_picture', selectedFile);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile({
        ...profile,
        username: updatedProfile.username,
        email: updatedProfile.email,
        profile: updatedProfile.profile,
      });

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Error updating profile: ' + err.message);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const method = isFollowing ? 'DELETE' : 'POST';

      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/follow/`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user`);
      }

      setIsFollowing(!isFollowing);
      toast.success(`Successfully ${isFollowing ? 'unfollowed' : 'followed'} user`);

      // Update followers list
      const followersResponse = await fetch(`${import.meta.env.VITE_API_URL}/user/${userId}/followers/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const navigateToUserProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error">
            Error: {error}
          </Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <Box my={4} textAlign="center">
          <Typography variant="h5">User not found</Typography>
          <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Grid container spacing={3}>
          <Grid
            size={{ xs: 12, md: 4 }}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Avatar
              src={profile.profile?.profile_picture || '/default-avatar.png'}
              alt={profile.username}
              sx={{ width: 150, height: 150, mb: 2 }}
            />

            {isEditing && (
              <Button variant="outlined" component="label" sx={{ mb: 2 }}>
                Change Picture
                <input type="file" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
            )}

            <Typography variant="h5" sx={{ mb: 1 }}>
              {profile.username}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profile.profile?.location || 'No location set'}
            </Typography>

            {!isOwnProfile && (
              <Button
                variant={isFollowing ? 'outlined' : 'contained'}
                color={isFollowing ? 'error' : 'primary'}
                startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                onClick={handleFollowToggle}
                sx={{ mb: 2 }}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}

            {isOwnProfile && !isEditing && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                sx={{ mb: 2 }}
              >
                Edit Profile
              </Button>
            )}

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProfile}>
                  Save
                </Button>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </Box>
            )}

            <Box sx={{ width: '100%', mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{followers?.length || 0}</Typography>
                    <Typography variant="body2">Followers</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{following?.length || 0}</Typography>
                    <Typography variant="body2">Following</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {isEditing ? (
              <Box component="form" sx={{ mt: 1 }}>
                <TextField
                  margin="normal"
                  fullWidth
                  label="Username"
                  name="username"
                  value={editedProfile.username}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={editedProfile.email}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label="Location"
                  name="location"
                  value={editedProfile.location}
                  onChange={handleInputChange}
                />
              </Box>
            ) : (
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Gardens" id="tab-0" />
                    <Tab label="Followers" id="tab-1" />
                    <Tab label="Following" id="tab-2" />
                  </Tabs>
                </Box>

                {/* Gardens Tab */}
                <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ py: 2 }}>
                  {tabValue === 0 && (
                    <>
                      {gardens.length > 0 ? (
                        <Grid container spacing={2}>
                          {gardens.map((garden) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={garden.id}>
                              <GardenCard garden={garden} />
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ py: 3, textAlign: 'center' }}
                        >
                          No gardens yet.
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                {/* Followers Tab */}
                <Box role="tabpanel" hidden={tabValue !== 1} id="tabpanel-1" sx={{ py: 2 }}>
                  {tabValue === 1 && (
                    <>
                      {followers && followers.length > 0 ? (
                        <Grid container spacing={2}>
                          {followers.map((follower) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={follower.id}>
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={() => navigateToUserProfile(follower.id)}
                              >
                                <Avatar
                                  src={follower.profile_picture || '/default-avatar.png'}
                                  sx={{ mr: 2 }}
                                />
                                <Box>
                                  <Typography variant="subtitle1">{follower.username}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {follower.location || 'No location'}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ py: 3, textAlign: 'center' }}
                        >
                          No followers yet.
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                {/* Following Tab */}
                <Box role="tabpanel" hidden={tabValue !== 2} id="tabpanel-2" sx={{ py: 2 }}>
                  {tabValue === 2 && (
                    <>
                      {following && following.length > 0 ? (
                        <Grid container spacing={2}>
                          {following.map((followedUser) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={followedUser.id}>
                              <Paper
                                elevation={1}
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                }}
                                onClick={() => navigateToUserProfile(followedUser.id)}
                              >
                                <Avatar
                                  src={followedUser.profile_picture || '/default-avatar.png'}
                                  sx={{ mr: 2 }}
                                />
                                <Box>
                                  <Typography variant="subtitle1">
                                    {followedUser.username}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {followedUser.location || 'No location'}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ py: 3, textAlign: 'center' }}
                        >
                          Not following anyone yet.
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile;
