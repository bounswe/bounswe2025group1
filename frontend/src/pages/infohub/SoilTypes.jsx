import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Pagination,
  TextField,
  InputAdornment,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchSoilTypes } from '../../services/plantService';

const SoilTypes = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [allSoilTypes, setAllSoilTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const soilsPerPage = 4;
  const currentLang = i18n.language || 'en';
  
  // Fetch soil types from Supabase
  useEffect(() => {
    const loadSoilTypes = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSoilTypes(currentLang);
        setAllSoilTypes(data);
      } catch (err) {
        console.error('Error loading soil types:', err);
        setError(err.message || 'Failed to load soil types');
      } finally {
        setLoading(false);
      }
    };

    loadSoilTypes();
  }, [currentLang]);
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  
  // Filter soils based on search query
  const filteredSoils = allSoilTypes.filter((soil) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const name = soil.name.toLowerCase();
    const description = (soil.description || '').toLowerCase();
    
    return name.includes(query) || description.includes(query);
  });
  
  const totalPages = Math.ceil(filteredSoils.length / soilsPerPage);
  const startIndex = (page - 1) * soilsPerPage;
  const endIndex = startIndex + soilsPerPage;
  const currentSoils = filteredSoils.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when searching
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
          Back to Infohub
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: `linear-gradient(135deg, #795548 0%, #a1887f 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
            🪴 Soil Types
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Understanding your soil is the key to gardening success
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
            {filteredSoils.length} soil types {searchQuery && `found`} • Page {totalPages > 0 ? page : 0} of {totalPages}
          </Typography>
        </Paper>

        {/* Search Bar */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search soil types by name, description, origin, or best for plants..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Intro */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            Soil is the foundation of your garden. Different soil types have unique properties 
            that affect water drainage, nutrient retention, and plant health. Learn to identify 
            your soil type and how to improve it for better growing conditions.
          </Typography>
        </Paper>

        {filteredSoils.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No soil types found matching "{searchQuery}"
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Soil Types Grid */}
            <Box 
              sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr', 
                  md: 'repeat(2, 1fr)', 
                },
                gap: 3,
                mb: 4,
              }}
            >
              {currentSoils.map((soil) => {
                const soilName = soil.name;
                const soilDescription = soil.description || '';

                return (
                <Paper key={soil.id} sx={{ p: 3, height: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: soil.color,
                        mr: 2,
                        border: '2px solid #e0e0e0',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {soilName}
                    </Typography>
                  </Box>

                  <Typography variant="body2" paragraph sx={{ mb: 2 }}>
                    {soilDescription}
                  </Typography>
                </Paper>
              );
              })}
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

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" onClick={() => navigate('/infohub/plants')}>
            Browse Plants
          </Button>
          <Button variant="outlined" onClick={() => navigate('/infohub')}>
            Back to Infohub
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default SoilTypes;
