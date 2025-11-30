import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableRow,
  useTheme,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import plantsData from '../../data/plants.json';
import { getTranslatedField, getTranslatedObject, getTranslatedArray } from '../../utils/plantTranslations';

// Helper function to find plant ID by name
const findPlantIdByName = (plantName) => {
  if (!plantName) return null;
  
  const normalizedName = plantName.toLowerCase().trim();
  
  // Try exact match first
  let found = plantsData.plants.find(
    (p) => p.name.toLowerCase() === normalizedName
  );
  
  if (found) return found.id;
  
  // Try matching singular/plural forms
  const singularName = normalizedName.replace(/s$/, '');
  const pluralName = normalizedName + 's';
  
  found = plantsData.plants.find((p) => {
    const pName = p.name.toLowerCase();
    return pName === singularName || pName === pluralName || 
           singularName === pName.replace(/s$/, '') ||
           pluralName === pName;
  });
  
  if (found) return found.id;
  
  // Try partial match (plant name contains search term or vice versa)
  found = plantsData.plants.find((p) => {
    const pName = p.name.toLowerCase();
    return pName.includes(normalizedName) || normalizedName.includes(pName);
  });
  
  if (found) return found.id;
  
  // Try matching without common suffixes/prefixes
  const nameWithoutSuffixes = normalizedName
    .replace(/\s*\(.*?\)/g, '') // Remove parentheses content
    .replace(/\s+tree$/i, '') // Remove " tree"
    .replace(/\s+plant$/i, '') // Remove " plant"
    .trim();
  
  if (nameWithoutSuffixes !== normalizedName) {
    found = plantsData.plants.find(
      (p) => p.name.toLowerCase() === nameWithoutSuffixes
    );
    if (found) return found.id;
  }
  
  return null;
};

const SoilTypes = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const allSoilTypes = plantsData.soilTypes;
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const soilsPerPage = 4;
  const currentLang = i18n.language || 'en';
  
  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);
  
  // Filter soils based on search query
  const filteredSoils = allSoilTypes.filter((soil) => {
    const query = searchQuery.toLowerCase();
    const name = getTranslatedField(soil, 'name', currentLang).toLowerCase();
    const description = getTranslatedField(soil, 'description', currentLang).toLowerCase(); // Soil descriptions usually not translated in json yet but handling it
    const origin = getTranslatedField(soil, 'origin', currentLang).toLowerCase();
    const bestFor = getTranslatedArray(soil, 'bestFor', currentLang);
    
    return (
      name.includes(query) ||
      description.includes(query) ||
      origin.includes(query) ||
      bestFor.some(plant => plant.toLowerCase().includes(query))
    );
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
                const soilName = getTranslatedField(soil, 'name', currentLang);
                const soilDescription = getTranslatedField(soil, 'description', currentLang); // Handling potentially untranslated descriptions gracefully
                const soilCharacteristics = getTranslatedObject(soil, 'characteristics', currentLang);
                const soilBestFor = getTranslatedArray(soil, 'bestFor', currentLang);
                const soilOrigin = getTranslatedField(soil, 'origin', currentLang);

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

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    🌱 {t('infohub.soilTypes.characteristics', 'Key Characteristics')}
                  </Typography>
                  
                  {soilCharacteristics && typeof soilCharacteristics === 'object' ? (
                    <Table size="small" sx={{ mb: 2 }}>
                      <TableBody>
                        {Object.entries(soilCharacteristics).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell sx={{ py: 0.5, border: 'none', fontWeight: 'medium', width: '40%' }}>
                              {/* Try to translate key if possible, though keys in object are dynamic */}
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </TableCell>
                            <TableCell sx={{ py: 0.5, border: 'none' }}>{value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                      {Array.isArray(soilCharacteristics) && soilCharacteristics.map((char, i) => (
                        <Chip key={i} label={char} size="small" variant="outlined" />
                      ))}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Improvements usually not translated yet in data, keeping as is or using original */}
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                    How to Improve:
                  </Typography>
                  <List dense>
                    {soil.improvements.map((imp, i) => (
                      <ListItem key={i} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <CheckCircleIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={imp} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                    {t('infohub.soilTypes.bestFor', 'Best For')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                    {soilBestFor.map((plantName, i) => {
                      const plantId = findPlantIdByName(plantName);
                      return (
                        <Chip
                          key={i}
                          label={plantName}
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={plantId ? () => navigate(`/infohub/plants/${plantId}`) : undefined}
                          sx={{
                            cursor: plantId ? 'pointer' : 'default',
                            '&:hover': plantId ? {
                              backgroundColor: theme.palette.success.light,
                              color: theme.palette.success.contrastText,
                            } : {},
                          }}
                        />
                      );
                    })}
                  </Box>

                  {soilOrigin && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        🌍 <strong>{t('infohub.soilTypes.origin', 'Origin')}:</strong> {soilOrigin}
                      </Typography>
                    </Box>
                  )}
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
