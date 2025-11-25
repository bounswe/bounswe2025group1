import { useState, useEffect, useRef } from 'react';
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
  TextField,
  ButtonBase,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../../contexts/AuthContextUtils';
import GardenCard from '../../components/GardenCard';
import DirectMessageButton from '../../components/DirectMessageButton';
import React from 'react';
import { createButtonKeyboardHandler, createLinkKeyboardHandler, createRovingTabindex } from '../../utils/keyboardNavigation';
import LocationPicker from '../../components/LocationPicker';
import { useTranslation } from 'react-i18next';
import { translateLocationString } from '../../utils/locationUtils';
import { Switch, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import { ALL_BADGES } from '../../components/GardenBadges';
import ReportDialog from '../../components/ReportDialog';
import FlagIcon from '@mui/icons-material/Flag';

const Profile = () => {
  const { t, i18n } = useTranslation();
  let { userId } = useParams();
  const { user, token, updateUser } = useAuth();
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
    receives_notifications: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [gardens, setGardens] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [reportOpen, setReportOpen] = useState(false);
  const tabRefs = useRef([]);
  const gardenRefs = useRef([]);
  const followerRefs = useRef([]);

  userId = userId ? userId.toString() : (user?.user_id?.toString() || '');
  const isOwnProfile = !userId || (user && user?.user_id?.toString() === userId);

  useEffect(() => {
    if (userId && isNaN(Number(userId))) {
      toast.error('Invalid profile ID');
      navigate('/profile');
      return;
    }
  }, [userId, navigate]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!token) {
        navigate('/auth/login');
        return;
      }

      if (userId && isNaN(Number(userId))) {
        return; 
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/${userId}/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          toast.error('Failed to load profile');
          return;
        }

        const data = await response.json();
        if (data?.id?.toString() === user?.user_id?.toString() && !isOwnProfile) {
          navigate('/profile');
        }

        setProfile(data);
        setEditedProfile({
          username: data.username,
          email: data.email,
          location: data.profile?.location || '',
          receives_notifications: data.profile.receives_notifications,
        });

        // Check if current user is following this profile
        if (!isOwnProfile && user) {
          const isFollowingResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/user/${userId}/is-following/`,
            {
              headers: {
                Authorization: `Token ${token}`,
              },
            }
          );

          if (isFollowingResponse.ok) {
            const followingData = await isFollowingResponse.json();
            setIsFollowing(followingData.is_following);
          }
        }
      } catch (err) {
        setError(err.message);
        toast.error('Error loading profile');
      }
    };

    const fetchUserGardens = async () => {
      if (!token) return;
      // Fetch user's gardens
      try {
        const gardensResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/user/${userId || user?.user_id}/gardens/`,
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
    };

    const fetchUserBadges = async () => {
      if (!token) return;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/user/${userId}/badges/`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.ok) {
          const badgesData = await response.json();
          setEarnedBadges(badgesData);
        }
      } catch (badgeError) {
        console.error('Error fetching badges:', badgeError);
      }
    };

    const fetchRelationships = async () => {
      if (!token) return;

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

    const fetchAllData = async () => {
      setLoading(true);
      await fetchProfileData();
      await fetchUserGardens();
      await fetchUserBadges(); 
      await fetchRelationships();
      setLoading(false);
    };

    fetchAllData();
  }, [token, userId, user, navigate, isOwnProfile]);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile({
      username: profile.username,
      email: profile.email,
      location: profile.profile?.location || '',
      receives_notifications: profile.receives_notifications ?? false,
    });
    setSelectedFile(null);
  };

  // Set up roving tabindex for tabs
  useEffect(() => {
    if (tabRefs.current.length > 0) {
      const rovingTabindex = createRovingTabindex(tabRefs.current, tabValue);
      return () => rovingTabindex.updateTabindex();
    }
  }, [tabValue, tabRefs.current.length]);

  // Set up roving tabindex for gardens
  useEffect(() => {
    if (tabValue === 0 && gardenRefs.current.length > 0) {
      const rovingTabindex = createRovingTabindex(gardenRefs.current, 0);
      return () => rovingTabindex.updateTabindex();
    }
  }, [tabValue, gardenRefs.current.length]);

  // Set up roving tabindex for followers
  useEffect(() => {
    if (tabValue === 1 && followerRefs.current.length > 0) {
      const rovingTabindex = createRovingTabindex(followerRefs.current, 0);
      return () => rovingTabindex.updateTabindex();
    }
  }, [tabValue, followerRefs.current.length]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setEditedProfile((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('username', editedProfile.username);
      formData.append('email', editedProfile.email);
      formData.append('location', editedProfile.location);
      formData.append('receives_notifications', editedProfile.receives_notifications);

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
        toast.error('Failed to update profile');
        return;
      }

      const updatedProfile = await response.json();
      setProfile({
        ...profile,
        username: updatedProfile.username,
        email: updatedProfile.email,
        profile: {
          ...profile.profile,
          profile_picture: updatedProfile.profile.profile_picture,
          location: updatedProfile.profile.location,
          receives_notifications: updatedProfile.profile.receives_notifications,
        },
      });

      // Update AuthContext user state to sync with navbar
      if (isOwnProfile) {
        const updatedUserData = {
          ...user,
          username: updatedProfile.username,
          email: updatedProfile.email,
          profile: {
            ...user.profile,
            profile_picture: updatedProfile.profile.profile_picture,
            location: updatedProfile.profile.location,
            receives_notifications: updatedProfile.profile.receives_notifications,
          },
        };

        updateUser(updatedUserData);
      }

      setIsEditing(false);
      toast.success(t('profile.profileUpdatedSuccessfully'));
    } catch (err) {
      toast.error(t('profile.errorUpdatingProfile') + ': ' + err.message);
    }
  };

  const handleFollowToggle = async () => {
    if (!token) return;
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
        toast.error('Failed to update follow status');
        return;
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? t('profile.successfullyUnfollowed') : t('profile.successfullyFollowed'));

      // Update followers list
      const followersResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/user/${userId}/followers/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        setFollowers(followersData);
      }
    } catch (err) {
      toast.error(err.message);
    }
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
              <Button
                variant="outlined"
                component="label"
                sx={{
                  mb: 2,
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                }}
                onKeyDown={createButtonKeyboardHandler(() => {})}
              >
                {t('profile.uploadPhoto')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </Button>
            )}

            <Typography variant="h5" sx={{ mb: 1 }}>
              {profile.username}
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              {profile.profile?.location ? translateLocationString(profile.profile.location, i18n.language) : t('profile.noLocationSet')}
            </Typography>

            {!isOwnProfile && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                <Button
                  variant={isFollowing ? 'outlined' : 'contained'}
                  color={isFollowing ? 'error' : 'primary'}
                  startIcon={isFollowing ? <PersonRemoveIcon /> : <PersonAddIcon />}
                  onClick={handleFollowToggle}
                  onKeyDown={createButtonKeyboardHandler(handleFollowToggle)}
                  sx={{
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label={isFollowing ? t('profile.unfollowUser') : t('profile.followUser')}
                >
                  {isFollowing ? t('profile.unfollow') : t('profile.follow')}
                </Button>
                <DirectMessageButton
                  targetUserId={parseInt(userId)}
                  variant="contained"
                  size="medium"
                />
                {user && (
                  <Tooltip title={t('report.reportUser', 'Report User')}>
                    <IconButton onClick={() => setReportOpen(true)} color="default">
                      <FlagIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}

            {isOwnProfile && !isEditing && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                onKeyDown={createButtonKeyboardHandler(() => setIsEditing(true))}
                sx={{
                  mb: 2,
                  '&:focus': {
                    outline: '2px solid #558b2f',
                    outlineOffset: '2px',
                  },
                }}
                aria-label={t('profile.editProfileLabel')}
              >
                {t('profile.editProfile')}
              </Button>
            )}

            {isEditing && (
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                  onKeyDown={createButtonKeyboardHandler(handleSaveProfile)}
                  sx={{
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label={t('profile.saveProfileChanges')}
                >
                  {t('profile.save')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelEdit}
                  onKeyDown={createButtonKeyboardHandler(handleCancelEdit)}
                  sx={{
                    '&:focus': {
                      outline: '2px solid #558b2f',
                      outlineOffset: '2px',
                    },
                  }}
                  aria-label={t('profile.cancelProfileEditing')}
                >
                  {t('profile.cancel')}
                </Button>
              </Box>
            )}

            <Box sx={{ width: '100%', mt: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{followers?.length || 0}</Typography>
                    <Typography variant="body2">{t('profile.followers')}</Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6">{following?.length || 0}</Typography>
                    <Typography variant="body2">{t('profile.following')}</Typography>
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
                  label={t('profile.username')}
                  name="username"
                  value={editedProfile.username}
                  onChange={handleInputChange}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  label={t('profile.email')}
                  name="email"
                  type="email"
                  value={editedProfile.email}
                  onChange={handleInputChange}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={editedProfile.receives_notifications}
                      onChange={handleInputChange}
                      name="receives_notifications"
                      type="checkbox"
                    />
                  }
                  label={t('Would you like to receive notifications?')}
                  sx={{ mt: 1, mb: 1, display: 'block' }}
                />
                {}
                <LocationPicker
                  value={editedProfile.location}
                  onChange={(value) => setEditedProfile({ ...editedProfile, location: value })}
                  label={t('profile.location')}
                  height={200}
                  sx={{ mt: 2, mb: 2 }}
                />
              </Box>
            ) : (
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={(e, val) => setTabValue(val)}
                    aria-label="profile tabs"
                    role="tablist"
                  >
                    <Tab
                      ref={(el) => (tabRefs.current[0] = el)}
                      label={t('profile.gardens')}
                      id="tab-0"
                      role="tab"
                      aria-selected={tabValue === 0}
                      aria-controls="tabpanel-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTabValue(0);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          setTabValue(1);
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setTabValue(3);
                        }
                      }}
                      sx={{
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                    />
                    <Tab
                      ref={(el) => (tabRefs.current[1] = el)}
                      label={t('profile.followers')}
                      id="tab-1"
                      role="tab"
                      aria-selected={tabValue === 1}
                      aria-controls="tabpanel-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTabValue(1);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          setTabValue(2);
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setTabValue(0);
                        }
                      }}
                      sx={{
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                    />
                    <Tab
                      ref={(el) => (tabRefs.current[2] = el)}
                      label={t('profile.following')}
                      id="tab-2"
                      role="tab"
                      aria-selected={tabValue === 2}
                      aria-controls="tabpanel-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTabValue(2);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          setTabValue(3);
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setTabValue(1);
                        }
                      }}
                      sx={{
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                    />
                    <Tab
                      ref={(el) => (tabRefs.current[3] = el)}
                      label={t('profile.badges')}
                      id="tab-3"
                      role="tab"
                      aria-selected={tabValue === 3}
                      aria-controls="tabpanel-3"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setTabValue(3);
                        } else if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          setTabValue(0);
                        } else if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          setTabValue(2);
                        }
                      }}
                      sx={{
                        '&:focus': {
                          outline: '2px solid #558b2f',
                          outlineOffset: '2px',
                        },
                      }}
                    />
                  </Tabs>
                </Box>

                {/* Gardens Tab */}
                <Box role="tabpanel" hidden={tabValue !== 0} id="tabpanel-0" sx={{ py: 2 }}>
                  {tabValue === 0 && (
                    <>
                      {gardens.length > 0 ? (
                        <Grid container spacing={2}>
                          {gardens.map((garden, index) => (
                            <Grid size={{ xs: 12, sm: 6 }} key={garden.id}>
                              <Box
                                ref={(el) => (gardenRefs.current[index] = el)}
                                sx={{
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  '&:focus': {
                                    outline: '2px solid #558b2f',
                                    outlineOffset: '2px',
                                  },
                                }}
                                tabIndex={0}
                                role="button"
                                aria-label={`View garden: ${garden.name}`}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navigate(`/gardens/${garden.id}`);
                                  }
                                }}
                              >
                                <GardenCard garden={garden} />
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ py: 3, textAlign: 'center' }}
                        >
                          {t('profile.noGardensYet')}
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
                          {followers.map((follower, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={follower.id}>
                              <Paper
                                ref={(el) => (followerRefs.current[index] = el)}
                                component={ButtonBase}
                                elevation={1}
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  width: '100%',
                                  '&:focus': {
                                    outline: '2px solid #558b2f',
                                    outlineOffset: '2px',
                                  },
                                }}
                                onClick={() => navigate(`/profile/${follower.id}`)}
                                onKeyDown={createLinkKeyboardHandler(() => navigate(`/profile/${follower.id}`))}
                                tabIndex={0}
                                role="button"
                                aria-label={`View profile of ${follower.username}`}
                              >
                                <Avatar
                                  src={follower.profile_picture || '/default-avatar.png'}
                                  sx={{ mr: 2 }}
                                />
                                <Box>
                                  <Typography variant="subtitle1">{follower.username}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {follower.location ? translateLocationString(follower.location, i18n.language) : 'No location'}
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
                          {t('profile.noFollowersYet')}
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
                                onClick={() => navigate(`/profile/${followedUser.id}`)}
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
                                    {followedUser.location ? translateLocationString(followedUser.location, i18n.language) : 'No location'}
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
                          {t('profile.notFollowingAnyoneYet')}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>

                {/* Badges Tab */}
                <Box role="tabpanel" hidden={tabValue !== 3} id="tabpanel-3" sx={{ py: 2 }}>
                  {tabValue === 3 && (() => {
                    const getCurrentSeason = () => {
                      const month = new Date().getMonth() + 1; // 1-12
                      if (month >= 3 && month <= 5) return 'spring';
                      if (month >= 6 && month <= 8) return 'summer';
                      if (month >= 9 && month <= 11) return 'autumn';
                      return 'winter';
                    };

                    const getSeasonalDescription = (descriptionKey) => {
                      const season = getCurrentSeason();
                      // Extract the badge key from descriptionKey (e.g., "badges.frostGuardian" -> "frostGuardian")
                      const badgeKey = descriptionKey.replace('badges.', '');
                      const seasonKey = `${descriptionKey}.${season}`;
                      const fallbackKey = descriptionKey;
                      // Try season-specific first, fallback to general
                      const seasonTranslation = t(seasonKey);
                      // If translation exists (not the same as key), use it
                      if (seasonTranslation && seasonTranslation !== seasonKey) {
                        return seasonTranslation;
                      }
                      // Otherwise use fallback
                      return t(fallbackKey);
                    };

                    return (
                      <Grid container spacing={3}>
                        {ALL_BADGES.map((badge) => {
                          const BadgeComponent = badge.component;

                          const isEarned =
                            badge.name === 'Tiny Sprout' ||
                            earnedBadges.some(b => {
                              if (b.badge && b.badge.name) return b.badge.name === badge.name;
                              if (b.name) return b.name === badge.name;
                              if (typeof b === 'string') return b === badge.name;
                              return false;
                            });

                          // Get description - seasonal badges get time-sensitive descriptions
                          let description = '';
                          if (badge.descriptionKey) {
                            if (badge.category === 'Seasonal Badges') {
                              description = getSeasonalDescription(badge.descriptionKey);
                            } else {
                              description = t(badge.descriptionKey);
                            }
                          }

                          return (
                            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={badge.name}>
                              <Paper
                                elevation={isEarned ? 2 : 1}
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  textAlign: 'center',
                                  backgroundColor: isEarned ? 'background.paper' : 'action.hover',
                                  transition: 'all 0.3s ease',
                                  minHeight: { xs: '220px', sm: '240px', md: '260px' },
                                  height: '100%',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4,
                                  },
                                }}
                              >
                                <BadgeComponent size={80} earned={isEarned} />
                                <Typography
                                  variant="body2"
                                  sx={{
                                    mt: 1,
                                    mb: 0.5,
                                    fontWeight: isEarned ? 600 : 400,
                                    color: isEarned ? 'text.primary' : 'text.secondary',
                                    minHeight: { xs: '2.5em', sm: '2.5em', md: '2.5em' },
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {badge.nameKey ? t(badge.nameKey) : badge.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    mt: 0.5,
                                    color: 'text.secondary',
                                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                    minHeight: '1.2em',
                                  }}
                                >
                                  {badge.categoryKey ? t(badge.categoryKey) : badge.category}
                                </Typography>
                                {description && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      mt: 0.5,
                                      color: 'text.secondary',
                                      fontSize: { xs: '0.6rem', sm: '0.65rem' },
                                      fontStyle: 'italic',
                                      minHeight: '1.5em',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      lineHeight: 1.2,
                                      textAlign: 'center',
                                    }}
                                  >
                                    {description}
                                  </Typography>
                                )}
                              </Paper>
                            </Grid>
                          );
                        })}
                      </Grid>
                    );
                  })()}
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="user"
        objectId={parseInt(userId)}
      />
    </Container>
  );
};

export default Profile;

