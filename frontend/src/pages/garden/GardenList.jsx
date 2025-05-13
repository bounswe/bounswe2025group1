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
  Fab
} from '@mui/material';
import {
  Modal,
  Fade,
  Backdrop,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Switch } from '@mui/material';
import GardenModal from '../../components/GardenModal';

const GardenList = () => {
  const [gardens, setGardens] = useState([]);
  const [filteredGardens, setFilteredGardens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const { token } = useAuth();


  const [form, setForm] = useState({
    type: '',
    name: '',
    description: '',
    location: '',
    size: '',
    isPublic: true,
  });

  useEffect(() => {
    const fetchGardens = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
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

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = gardens.filter(garden =>
      garden.name.toLowerCase().includes(value) ||
      garden.description.toLowerCase().includes(value) ||
      garden.location.toLowerCase().includes(value)
    );

    setFilteredGardens(filtered);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          description: form.description,
          is_public: form.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error('Garden creation failed');
      }

      const data = await response.json();

      toast.success('Garden created successfully!', {
        position: 'top-right',
        theme: 'colored',
      });

      setGardens(prev => [...prev, data]);
      setFilteredGardens(prev => [...prev, data]);

      setForm({
        type: '',
        name: '',
        description: '',
        location: '',
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          Community Gardens
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Explore and join community gardens in your area or create your own.
        </Typography>
        <Divider sx={{ my: 2 }} />
      </Box>

      {/* Search and Filter */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search gardens by name, description or location..."
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
              sx={{
                backgroundColor: '#558b2f',
                '&:hover': { backgroundColor: '#33691e' },
                ml: 2,
                whiteSpace: 'nowrap'
              }}
            >
              Add Garden
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Garden List */}
      <Grid container spacing={3}>
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
                    boxShadow: 6
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image={`/gardens/garden${garden.id % 5}.png`}
                  alt={garden.name}
                  sx={{
                    width: '100%',
                    height: 180,
                  }}
                />

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="h2">
                    {garden.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {garden.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {garden.location}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {garden.members} members • {garden.tasks} tasks
                    </Typography>
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
                    View Garden
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))
        ) : (
          <Box sx={{ width: '100%', textAlign: 'center', py: 5 }}>
            <Typography variant="h6" color="text.secondary">
              No gardens found matching your search.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try a different search term or create a new garden.
            </Typography>
          </Box>
        )}
      </Grid>

      {/* Create Garden Button (for logged in users) */}
      {currentUser && (
        <Fab
          color="primary"
          aria-label="create garden"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#558b2f',
            '&:hover': {
              backgroundColor: '#33691e',
            }
          }}
          onClick={handleOpenModal}  // <-- update here
        >
          <AddIcon />
        </Fab>
      )}
      <GardenModal
        open={openModal}
        onClose={handleCloseModal}
        form={form}
        handleChange={handleChange}
        handleTogglePublic={() =>
          setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))
        }
        handleSubmit={handleSubmit}
      />



    </Container>
  );
};

export default GardenList;