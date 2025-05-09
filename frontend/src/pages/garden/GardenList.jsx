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
import api from '../../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Switch } from '@mui/material';


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
        const response = await api.getGardens();
        setGardens(response.data);
        setFilteredGardens(response.data);
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/gardens/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: form.type,
          name: form.name,
          description: form.description,
          location: form.location,
          size: parseFloat(form.size),
          isPublic: form.isPublic,
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
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {/* These would be functional filters in a complete implementation */}
              <Chip label="All" color="primary" variant="outlined" onClick={() => { }} />
              <Chip label="Nearby" variant="outlined" onClick={() => { }} />
              <Chip label="Most Popular" variant="outlined" onClick={() => { }} />
              <Chip label="Recently Added" variant="outlined" onClick={() => { }} />
            </Box>
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
                  height="180"
                  image={garden.image}
                  alt={garden.name}
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
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Create New Garden
            </Typography>

            <TextField
              label="Garden Name"
              name="name"
              fullWidth
              margin="normal"
              value={form.name}
              onChange={handleChange}
              required
            />

            <TextField
              label="Type"
              name="type"
              fullWidth
              margin="normal"
              value={form.type}
              onChange={handleChange}
            />

            <TextField
              label="Description"
              name="description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              value={form.description}
              onChange={handleChange}
            />

            <TextField
              label="Location"
              name="location"
              fullWidth
              margin="normal"
              value={form.location}
              onChange={handleChange}
              required
            />

            <TextField
              label="Size (m²)"
              name="size"
              type="number"
              fullWidth
              margin="normal"
              value={form.size}
              onChange={handleChange}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Do you wish this garden to be public?
              </Typography>
              <Switch
                checked={form.isPublic}
                onChange={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                color="success"
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: '#558b2f',
                  '&:hover': { backgroundColor: '#33691e' }
                }}
              >
                Create Garden
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>


    </Container>
  );
};

export default GardenList;