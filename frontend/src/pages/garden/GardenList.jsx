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
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import api from '../../utils/api';

const GardenList = () => {
  const [gardens, setGardens] = useState([]);
  const [filteredGardens, setFilteredGardens] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
              <Chip label="All" color="primary" variant="outlined" onClick={() => {}} />
              <Chip label="Nearby" variant="outlined" onClick={() => {}} />
              <Chip label="Most Popular" variant="outlined" onClick={() => {}} />
              <Chip label="Recently Added" variant="outlined" onClick={() => {}} />
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
          onClick={() => navigate('/gardens/create')}
        >
          <AddIcon />
        </Fab>
      )}
    </Container>
  );
};

export default GardenList;