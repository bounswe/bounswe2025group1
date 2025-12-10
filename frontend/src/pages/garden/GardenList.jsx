import React from 'react';
import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Chip,
  Paper,
  Divider,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Modal, Fade, Backdrop } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';
import { Switch } from '@mui/material';
import { translateLocationString, geocodeAddress, calculateDistance, getUserCurrentLocation } from '../../utils/locationUtils';
import GardenModal from '../../components/GardenModal';

const GardenList = () => {
  const { t, i18n } = useTranslation();
  const [gardens, setGardens] = useState([]);
  const [filteredGardens, setFilteredGardens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const { token } = useAuth();
  const [showNearby, setShowNearby] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [gardensWithDistance, setGardensWithDistance] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [radiusFilter, setRadiusFilter] = useState('all'); // 'all', '5', '10', '25', '50', '100'

  const [form, setForm] = useState({
    type: '',
    name: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    size: '',
    isPublic: true,
  });

  // Fetch user location from profile or geolocation
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!user) return;

      setLoadingLocation(true);
      let locationCoords = null;

      // Try to get location from user profile first
      if (token) {
        try {
          const profileResponse = await fetch(`${import.meta.env.VITE_API_URL}/profile/`, {
            headers: {
              'Authorization': `Token ${token.trim()}`,
            },
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const profileLocation = profileData?.profile?.location || profileData?.location;

            if (profileLocation) {
              // Geocode the profile location
              locationCoords = await geocodeAddress(profileLocation);
            }
          }
        } catch (error) {
          console.error('Error fetching profile location:', error);
        }
      }

      // If profile location not available, try browser geolocation
      if (!locationCoords) {
        locationCoords = await getUserCurrentLocation();
      }

      setUserLocation(locationCoords);
      setLoadingLocation(false);
    };

    fetchUserLocation();
  }, [user, token]);

  useEffect(() => {
    const fetchGardens = async () => {
      try {
        const isValidToken = (t) =>
          t !== null

        const headers = {
          'Content-Type': 'application/json',
        };
        if (isValidToken(token)) {
          headers['Authorization'] = `Token ${token.trim()}`;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/`, { headers });
        const data = await response.json();
        setGardens(data);
        setFilteredGardens(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching gardens:', error);
        setLoading(false);
      }
    };

    fetchGardens();
  }, []);

  // Helper function to apply filters and sorting
  const applyFilters = (gardensToFilter, searchValue, radiusValue, nearbyMode) => {
    let filtered = gardensToFilter;

    // Apply search filter
    if (searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(
        (garden) =>
          garden.name.toLowerCase().includes(searchLower) ||
          garden.description?.toLowerCase().includes(searchLower) ||
          garden.location?.toLowerCase().includes(searchLower)
      );
    }

    // Apply radius filter (only in nearby mode)
    if (nearbyMode && radiusValue !== 'all') {
      const radiusKm = parseFloat(radiusValue);
      filtered = filtered.filter((garden) => {
        if (garden.distance === null) return false;
        return garden.distance <= radiusKm;
      });
    }

    // Sort by distance if in nearby mode (always sort nearest first)
    if (nearbyMode) {
      filtered = [...filtered].sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return filtered;
  };

  // Calculate distances automatically when gardens and user location are available
  useEffect(() => {
    const calculateDistances = async () => {
      if (!userLocation || gardens.length === 0) {
        setGardensWithDistance([]);
        return;
      }

      setLoadingLocation(true);

      // Geocode addresses with delay to respect rate limits (1 request per second)
      const gardensWithDist = [];
      for (let i = 0; i < gardens.length; i++) {
        const garden = gardens[i];

        if (!garden.location) {
          gardensWithDist.push({ ...garden, distance: null });
          continue;
        }

        // Add delay between requests (except for the first one)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds delay
        }

        const gardenCoords = await geocodeAddress(garden.location);
        if (gardenCoords) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            gardenCoords.lat,
            gardenCoords.lng
          );
          gardensWithDist.push({ ...garden, distance: Math.round(distance * 10) / 10 }); // Round to 1 decimal
        } else {
          gardensWithDist.push({ ...garden, distance: null });
        }
      }

      // Sort by distance (null distances last)
      gardensWithDist.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      setGardensWithDistance(gardensWithDist);
      setLoadingLocation(false);
    };

    calculateDistances();
  }, [gardens, userLocation]);

  // Apply filters when filters or nearby mode changes
  useEffect(() => {
    if (showNearby && gardensWithDistance.length > 0) {
      const nearbyGardens = gardensWithDistance.filter(g => g.distance !== null);
      const filtered = applyFilters(nearbyGardens, searchTerm, radiusFilter, true);
      setFilteredGardens(filtered);
    } else if (!showNearby) {
      const filtered = applyFilters(gardens, searchTerm, 'all', false);
      setFilteredGardens(filtered);
    }
  }, [showNearby, searchTerm, radiusFilter, gardensWithDistance, gardens]);

  const handleSearch = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    const sourceGardens = showNearby && gardensWithDistance.length > 0
      ? gardensWithDistance
      : gardens;

    const filtered = applyFilters(sourceGardens, value, radiusFilter, showNearby);
    setFilteredGardens(filtered);
  };

  const handleRadiusChange = (event) => {
    const newRadius = event.target.value;
    setRadiusFilter(newRadius);

    const sourceGardens = showNearby && gardensWithDistance.length > 0
      ? gardensWithDistance
      : gardens;

    const filtered = applyFilters(sourceGardens, searchTerm, newRadius, showNearby);
    setFilteredGardens(filtered);
  };

  const handleToggleNearby = () => {
    const newShowNearby = !showNearby;
    setShowNearby(newShowNearby);

    if (newShowNearby) {
      // Filter out gardens without distance and apply radius filter
      const nearbyGardens = gardensWithDistance.filter(g => g.distance !== null);
      const filtered = applyFilters(nearbyGardens, searchTerm, radiusFilter, true);
      setFilteredGardens(filtered);
    } else {
      // Reset to all gardens
      const filtered = applyFilters(gardens, searchTerm, 'all', false);
      setFilteredGardens(filtered);
      setRadiusFilter('all');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e, formData) => {
    e.preventDefault();

    try {
      // Extract image data if provided
      const { cover_image_base64, gallery_base64, ...basicFormData } = formData || form;

      const requestBody = {
        name: basicFormData.name || form.name,
        location: basicFormData.location || form.location,
        latitude: basicFormData.latitude !== undefined ? basicFormData.latitude : form.latitude,
        longitude: basicFormData.longitude !== undefined ? basicFormData.longitude : form.longitude,
        description: basicFormData.description || form.description,
        is_public: basicFormData.isPublic !== undefined ? basicFormData.isPublic : form.isPublic,
      };

      // Add image data if provided
      if (cover_image_base64) {
        requestBody.cover_image_base64 = cover_image_base64;
      }
      if (gallery_base64 && gallery_base64.length > 0) {
        requestBody.gallery_base64 = gallery_base64;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        toast.error('Garden creation failed');
        return;
      }

      const data = await response.json();

      toast.success(t('gardens.gardenCreatedSuccessfully'), {
        position: 'top-right',
        theme: 'colored',
      });

      setGardens((prev) => [...prev, data]);
      setFilteredGardens((prev) => [...prev, data]);

      setForm({
        type: '',
        name: '',
        description: '',
        location: '',
        latitude: null,
        longitude: null,
        size: '',
        isPublic: true,
      });
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to create garden. Please try again.', {
        position: 'top-right',
        theme: 'colored',
      });
      console.error(error);
      return;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          {t('gardens.title')}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          {t('gardens.subtitle')}
        </Typography>
        <Divider sx={{ my: { xs: 1, md: 2 } }} />
      </Box>

      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 3, md: 4 } }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: showNearby ? 4 : 6 }}>
            <TextField
              fullWidth
              placeholder={t('gardens.searchByName')}
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
          </Grid>
          {showNearby && userLocation && gardensWithDistance.length > 0 && (
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('gardens.radiusFilter')}</InputLabel>
                <Select
                  value={radiusFilter}
                  onChange={handleRadiusChange}
                  label={t('gardens.radiusFilter')}
                  sx={{ minWidth: 120 }}
                >
                  <MenuItem value="all">{t('gardens.allDistances')}</MenuItem>
                  <MenuItem value="5">5 {t('gardens.km')}</MenuItem>
                  <MenuItem value="10">10 {t('gardens.km')}</MenuItem>
                  <MenuItem value="25">25 {t('gardens.km')}</MenuItem>
                  <MenuItem value="50">50 {t('gardens.km')}</MenuItem>
                  <MenuItem value="100">100 {t('gardens.km')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid
            size={{ xs: 12, md: showNearby ? 5 : 6 }}
            sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1, flexWrap: 'wrap' }}
          >
            {user && (
              <Button
                data-testid="toggle-nearby-button"
                variant={showNearby ? "contained" : "outlined"}
                color="primary"
                startIcon={<LocationOnIcon />}
                onClick={handleToggleNearby}
                disabled={loadingLocation || !userLocation}
                sx={{
                  backgroundColor: showNearby ? '#558b2f' : 'transparent',
                  color: showNearby ? 'white' : '#558b2f',
                  borderColor: '#558b2f',
                  '&:hover': {
                    backgroundColor: showNearby ? '#33691e' : 'rgba(85, 139, 47, 0.1)',
                    borderColor: '#33691e',
                  },
                  whiteSpace: 'nowrap',
                }}
              >
                {showNearby ? t('gardens.showAll') : t('gardens.nearbyGardens')}
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              sx={{
                backgroundColor: '#558b2f',
                '&:hover': { backgroundColor: '#33691e' },
                whiteSpace: 'nowrap',
                '& .MuiButton-startIcon': {
                  marginRight: 1,
                  marginLeft: 1,
                },
              }}
            >
              {t('gardens.addGarden')}
            </Button>
          </Grid>
        </Grid>
        {user && userLocation && loadingLocation && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              {t('gardens.calculatingDistances') || 'Calculating distances...'}
            </Typography>
          </Box>
        )}
        {showNearby && userLocation && !loadingLocation && gardensWithDistance.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <LocationOnIcon fontSize="small" color="success" />
            <Typography variant="body2" color="text.secondary">
              {t('gardens.showingNearbyGardens')}
              {radiusFilter !== 'all' && (
                <span> {t('gardens.withinRadius')} {radiusFilter} {t('gardens.km')}</span>
              )}
              {radiusFilter === 'all' && (
                <span> {t('gardens.sortedByDistance')}</span>
              )}
            </Typography>
            {filteredGardens.length > 0 && (
              <Chip
                label={`${filteredGardens.length} ${filteredGardens.length === 1 ? t('gardens.garden') : t('gardens.gardens')}`}
                size="small"
                color="success"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
        )}
        {showNearby && !userLocation && !loadingLocation && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="error">
              {t('gardens.locationNotAvailable')}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Garden List */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {filteredGardens.length > 0 ? (
          filteredGardens.map((garden) => (
            <Grid key={garden.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardMedia
                  component="img"
                  image={garden.cover_image?.image_base64 || `/gardens/garden${garden.id % 5}.png`}
                  alt={garden.name}
                  sx={{
                    width: '100%',
                    height: { xs: 160, sm: 180 },
                    maxHeight: 180,
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {garden.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {garden.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {translateLocationString(garden.location, i18n.language)}
                      </Typography>
                    </Box>
                    {showNearby && garden.distance !== null && (
                      <Chip
                        label={`${garden.distance} km ${t('gardens.away')}`}
                        size="small"
                        color="success"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => navigate(`/gardens/${garden.id}`)}
                    sx={{ backgroundColor: '#558b2f', '&:hover': { backgroundColor: '#33691e' } }}
                  >
                    {t('gardens.viewGarden')}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="text.secondary">
              {t('gardens.noGardensFound')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('gardens.tryDifferentSearchTerm')}
            </Typography>
          </Box>
        )}
      </Grid>
      <GardenModal
        open={openModal}
        onClose={handleCloseModal}
        form={form}
        handleChange={handleChange}
        handleTogglePublic={() => setForm((prev) => ({ ...prev, isPublic: !prev.isPublic }))}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
};

export default GardenList;
