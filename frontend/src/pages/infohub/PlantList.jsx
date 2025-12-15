import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Button,
  Pagination,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DangerousIcon from '@mui/icons-material/Dangerous';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPlants } from '../../services/plantService';

const PlantList = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(1);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const plantsPerPage = 20;
  const currentLang = i18n.language || 'en';

  const types = ['all', 'vegetable', 'herb', 'flower', 'tree', 'fruit', 'succulent', 'shrub'];

  // Fetch plants from Supabase
  useEffect(() => {
    const loadPlants = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPlants({
          search: searchQuery || undefined,
          type: selectedType !== 'all' ? selectedType : undefined,
          page,
          perPage: plantsPerPage,
          lang: currentLang,
        });
        setPlants(result.data);
        setTotalPages(Math.ceil(result.total / plantsPerPage));
      } catch (err) {
        console.error('Error loading plants:', err);
        setError(err.message || 'Failed to load plants');
      } finally {
        setLoading(false);
      }
    };

    loadPlants();
  }, [searchQuery, selectedType, page, currentLang]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedType]);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default 
    }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/infohub')}
          sx={{ mb: 2 }}
        >
          {t('infohub.backToCategories', 'Back to Infohub')}
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🌱 {t('infohub.plantEncyclopedia.title', 'Plant Encyclopedia')}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {t('infohub.plantEncyclopedia.subtitle', 'Browse our collection of plants with care guides')}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {plants.length} {t('infohub.plantEncyclopedia.plants', 'plants')} {searchQuery && t('infohub.plantEncyclopedia.found', 'found')} • {t('infohub.plantEncyclopedia.page', 'Page')} {totalPages > 0 ? page : 0} {t('infohub.plantEncyclopedia.of', 'of')} {totalPages}
          </Typography>
        </Paper>

        {/* Search and Filter */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder={t('infohub.plantEncyclopedia.searchPlaceholder', 'Search plants...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {types.map((type) => (
                <Chip
                  key={type}
                  label={type === 'all' ? t('infohub.plantEncyclopedia.all', 'All') : t(`infohub.plantTypes.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
                  onClick={() => setSelectedType(type)}
                  color={selectedType === type ? 'primary' : 'default'}
                  variant={selectedType === type ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        ) : plants.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {t('infohub.plantEncyclopedia.noResults', 'No plants found matching your search.')}
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Plant Grid */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr', 
                  sm: 'repeat(2, 1fr)', 
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                },
                gap: 3,
                mb: 4,
              }}
            >
              {plants.map((plant) => (
                <Card
                  key={plant.id}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                  onClick={() => navigate(`/infohub/plants/${plant.id}`)}
                >
                  <Box
                    sx={{
                      height: 200,
                      width: '100%',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {plant.image && plant.image.startsWith('http') ? (
                      <CardMedia
                        component="img"
                        image={plant.image}
                        alt={plant.name}
                        sx={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <Box
                      sx={{
                        height: '100%',
                        width: '100%',
                        display: plant.image && plant.image.startsWith('http') ? 'none' : 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: theme.palette.action.hover,
                        fontSize: '5rem',
                      }}
                    >
                      {plant.image && !plant.image.startsWith('http') ? plant.image : '🌿'}
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {plant.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                      {plant.scientificName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      <Chip size="small" label={plant.type} color="success" variant="outlined" />
                      <Chip size="small" label={plant.difficulty} variant="outlined" />
                      <Chip size="small" label={plant.season} variant="outlined" />
                    </Box>
                    
                    {/* Additional info badges */}
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {plant.edible && (
                        <Chip 
                          icon={<RestaurantIcon />} 
                          label={t('infohub.plantList.edible', 'Edible')} 
                          size="small" 
                          color="success" 
                          variant="filled"
                        />
                      )}
                      {plant.toxicity && plant.toxicity !== 'none' && (
                        <Chip 
                          icon={<DangerousIcon />} 
                          label={`${plant.toxicity}`}
                          size="small" 
                          color="warning" 
                          variant="filled"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      )}
                      {plant.growthRequirements?.light !== undefined && (
                        <Chip 
                          icon={<WbSunnyIcon />} 
                          label={`${plant.growthRequirements.light}/10`}
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default PlantList;
