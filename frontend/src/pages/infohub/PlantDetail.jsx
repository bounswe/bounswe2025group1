import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  useTheme,
  Divider,
  Tabs,
  Tab,
  ImageList,
  ImageListItem,
  Grid,
  Tooltip,
  Alert,
  LinearProgress,
  Card,
  CardMedia,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import GrassIcon from '@mui/icons-material/Grass';
import InfoIcon from '@mui/icons-material/Info';
import HeightIcon from '@mui/icons-material/Height';
import ScheduleIcon from '@mui/icons-material/Schedule';
import WarningIcon from '@mui/icons-material/Warning';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DangerousIcon from '@mui/icons-material/Dangerous';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ImageIcon from '@mui/icons-material/Image';
import PublicIcon from '@mui/icons-material/Public';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchPlantById, fetchPlants, fetchSoilTypes } from '../../services/plantService';

// Helper function to recommend soil type based on plant soil description
const recommendSoilType = (soilDescription, soilTypes) => {
  if (!soilDescription || !soilTypes) return null;
  
  const desc = soilDescription.toLowerCase();
  
  // Check for specific soil type mentions first
  if (desc.includes('sandy-loam') || desc.includes('sandy loam')) {
    const found = soilTypes.find(s => s.id === 'sandy-loam');
    if (found) return 'sandy-loam';
  }
  if (desc.includes('clay-loam') || desc.includes('clay loam')) {
    const found = soilTypes.find(s => s.id === 'clay-loam');
    if (found) return 'clay-loam';
  }
  if (desc.includes('silty-loam') || desc.includes('silty loam')) {
    const found = soilTypes.find(s => s.id === 'silty-loam');
    if (found) return 'silty-loam';
  }
  if (desc.includes('sandy') || desc.includes('rocky') || (desc.includes('well-drained') && desc.includes('dry'))) {
    return 'sandy';
  }
  if (desc.includes('clay') || desc.includes('heavy') || desc.includes('dense')) {
    return 'clay';
  }
  if (desc.includes('loamy') || desc.includes('loam') || desc.includes('balanced')) {
    return 'loamy';
  }
  if (desc.includes('silty') || desc.includes('silt')) {
    return 'silty';
  }
  if (desc.includes('peaty') || desc.includes('peat') || desc.includes('boggy') || (desc.includes('acidic') && desc.includes('organic'))) {
    return 'peaty';
  }
  if (desc.includes('chalky') || desc.includes('chalk') || desc.includes('alkaline') || desc.includes('limestone')) {
    return 'chalky';
  }
  if (desc.includes('saline') || desc.includes('salt')) {
    return 'saline';
  }
  if (desc.includes('acidic') || desc.includes('acid')) {
    const found = soilTypes.find(s => s.id === 'acidic');
    if (found) return 'acidic';
  }
  if (desc.includes('rich') && desc.includes('well-draining')) {
    const found = soilTypes.find(s => s.id === 'humus-rich');
    if (found) return 'humus-rich';
    return 'loamy';
  }
  if (desc.includes('well-draining') || desc.includes('well-drained') || desc.includes('drainage')) {
    return 'loamy'; // Default to loamy for well-draining
  }
  if (desc.includes('moist') || desc.includes('wet') || desc.includes('water')) {
    return 'silty';
  }
  
  // Default to loamy if no specific match
  return 'loamy';
};

// Helper function to find plant ID by name (async)
const findPlantIdByName = async (plantName, lang = 'en') => {
  if (!plantName) return null;
  
  try {
    const result = await fetchPlants({ search: plantName, lang, perPage: 100 });
    const normalizedName = plantName.toLowerCase().trim();
    
    // Try exact match first
    let found = result.data.find(
      (p) => p.name.toLowerCase() === normalizedName
    );
    
    if (found) return found.id;
    
    // Try partial match
    found = result.data.find((p) => {
      const pName = p.name.toLowerCase();
      return pName.includes(normalizedName) || normalizedName.includes(pName);
    });
    
    if (found) return found.id;
    
    return null;
  } catch (error) {
    console.error('Error finding plant by name:', error);
    return null;
  }
};

const PlantDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { plantId } = useParams();
  const currentLang = i18n.language || 'en';
  const [imageTab, setImageTab] = useState(0);
  const [plant, setPlant] = useState(null);
  const [soilTypes, setSoilTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companionPlantIds, setCompanionPlantIds] = useState({});

  // Fetch plant data
  useEffect(() => {
    const loadPlant = async () => {
      setLoading(true);
      setError(null);
      try {
        const [plantData, soilTypesData] = await Promise.all([
          fetchPlantById(plantId, currentLang),
          fetchSoilTypes(currentLang),
        ]);
        setPlant(plantData);
        setSoilTypes(soilTypesData);

        // Pre-fetch companion plant IDs
        if (plantData?.companionPlants) {
          const ids = {};
          const allCompanions = [
            ...(plantData.companionPlants.growsWellWith || []),
            ...(plantData.companionPlants.avoidNear || []),
          ];
          
          await Promise.all(
            allCompanions.map(async (name) => {
              const id = await findPlantIdByName(name, currentLang);
              if (id) ids[name] = id;
            })
          );
          
          setCompanionPlantIds(ids);
        }
      } catch (err) {
        console.error('Error loading plant:', err);
        setError(err.message || 'Failed to load plant');
      } finally {
        setLoading(false);
      }
    };

    if (plantId) {
      loadPlant();
    }
  }, [plantId, currentLang]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !plant) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/infohub/plants')}>
          {t('infohub.backToPlants', 'Back to Plants')}
        </Button>
        <Paper sx={{ p: 4, mt: 2, textAlign: 'center' }}>
          <Typography variant="h5">
            {error || t('infohub.plantDetail.notFound', 'Plant not found')}
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Get plant data (already translated by service)
  const plantName = plant.name;
  const plantDescription = plant.description;
  const plantHabitat = plant.habitat;
  const plantSoil = plant.soil;
  const plantSunlight = plant.sunlight;
  const plantNotes = plant.notes;
  const plantGrowthDuration = plant.growthDuration;
  const plantWatering = plant.watering || {};
  const plantSpacing = plant.spacing || {};
  const plantClimateZone = plant.climateZone || {};
  const plantCommonProblems = plant.commonProblems || [];
  const plantCompanionPlants = plant.companionPlants || { growsWellWith: [], avoidNear: [] };

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
          onClick={() => navigate('/infohub/plants')}
          sx={{ mb: 2 }}
        >
          {t('infohub.backToPlants', 'Back to Plants')}
        </Button>

        {/* Header with Image */}
        <Paper sx={{ mb: 4, overflow: 'hidden' }}>
          <Box
            sx={{
              height: 400,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {plant.image && plant.image.startsWith('http') ? (
              <img 
                src={plant.image} 
                alt={plantName} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <Typography 
              sx={{ 
                fontSize: '10rem', 
                lineHeight: 1,
                display: plant.image && plant.image.startsWith('http') ? 'none' : 'block',
                position: plant.image && plant.image.startsWith('http') ? 'absolute' : 'static',
              }}
            >
              {plant.image && !plant.image.startsWith('http') ? plant.image : '🌿'}
            </Typography>
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                p: 3, 
                background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' 
              }}
            >
              <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {plantName}
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>
                {plant.scientificName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Chip label={t(`infohub.plantTypes.${plant.type}`, plant.type)} sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
                <Chip label={t(`infohub.difficulty.${plant.difficulty?.toLowerCase().replace(/\s+/g, '')}`, plant.difficulty)} sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
                <Chip label={plant.season} sx={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Description */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.8 }}>
            {plantDescription}
          </Typography>
        </Paper>

        {/* Edibility & Safety */}
        {(plant.edible !== undefined || plant.toxicity || plant.edibleParts || plant.vegetable) && (
          <Paper 
            sx={{ 
              p: 3, 
              mb: 3,
              border: plant.toxicity && plant.toxicity !== 'none' ? 2 : 0,
              borderColor: plant.toxicity === 'high' ? 'error.main' : 
                          plant.toxicity === 'medium' ? 'warning.main' :
                          plant.toxicity === 'low' ? 'warning.light' : 'transparent'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RestaurantIcon sx={{ mr: 1, color: plant.edible ? 'success.main' : 'text.secondary', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.edibilityAndSafety', 'Edibility & Safety')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Edible Badge */}
              {plant.edible !== undefined && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.edible', 'Edible')}:
                  </Typography>
                  <Chip 
                    label={plant.edible ? t('infohub.plantDetail.yes', 'Yes') : t('infohub.plantDetail.no', 'No')}
                    color={plant.edible ? 'success' : 'default'}
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>
              )}

              {/* Edible Parts */}
              {plant.edibleParts && plant.edibleParts.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.edibleParts', 'Edible Parts')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {plant.edibleParts.map((part, i) => (
                      <Chip 
                        key={i} 
                        label={part} 
                        size="small" 
                        color="success" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Toxicity Warning */}
              {plant.toxicity && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.toxicity', 'Toxicity Level')}:
                  </Typography>
                  <Alert 
                    severity={
                      plant.toxicity === 'none' ? 'success' :
                      plant.toxicity === 'low' ? 'info' :
                      plant.toxicity === 'medium' ? 'warning' : 'error'
                    }
                    icon={plant.toxicity !== 'none' ? <DangerousIcon /> : undefined}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                      {plant.toxicity} {plant.toxicity !== 'none' && t('infohub.plantDetail.toxicityWarning', '- Handle with care')}
                    </Typography>
                  </Alert>
                </Box>
              )}

              {/* Vegetable Badge */}
              {plant.vegetable && (
                <Box>
                  <Chip 
                    label={t('infohub.plantDetail.vegetable', 'Vegetable')}
                    color="success"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Paper>
        )}

        {/* Image Gallery */}
        {plant.imagesDetailed && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ImageIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.imageGallery', 'Image Gallery')}
              </Typography>
            </Box>

            <Tabs 
              value={imageTab} 
              onChange={(e, newValue) => setImageTab(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {plant.imagesDetailed.flower?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.flowers', 'Flowers')} (${plant.imagesDetailed.flower.length})`} />
              )}
              {plant.imagesDetailed.leaf?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.leaves', 'Leaves')} (${plant.imagesDetailed.leaf.length})`} />
              )}
              {plant.imagesDetailed.fruit?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.fruits', 'Fruits')} (${plant.imagesDetailed.fruit.length})`} />
              )}
              {plant.imagesDetailed.habit?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.habit', 'Habit')} (${plant.imagesDetailed.habit.length})`} />
              )}
              {plant.imagesDetailed.bark?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.bark', 'Bark')} (${plant.imagesDetailed.bark.length})`} />
              )}
              {plant.imagesDetailed.other?.length > 0 && (
                <Tab label={`${t('infohub.plantDetail.other', 'Other')} (${plant.imagesDetailed.other.length})`} />
              )}
            </Tabs>

            {(() => {
              const categories = ['flower', 'leaf', 'fruit', 'habit', 'bark', 'other'];
              const availableCategories = categories.filter(cat => plant.imagesDetailed[cat]?.length > 0);
              const currentCategory = availableCategories[imageTab];
              const images = plant.imagesDetailed[currentCategory] || [];

              if (images.length === 0) {
                return (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    {t('infohub.plantDetail.noImages', 'No images available')}
                  </Typography>
                );
              }

              return (
                <ImageList cols={3} gap={8} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {images.map((img) => (
                    <ImageListItem key={img.id}>
                      <Tooltip title={img.copyright || ''} arrow>
                        <img
                          src={img.url}
                          alt={`${plantName} - ${currentCategory}`}
                          loading="lazy"
                          style={{ cursor: 'pointer', borderRadius: 4 }}
                        />
                      </Tooltip>
                    </ImageListItem>
                  ))}
                </ImageList>
              );
            })()}
          </Paper>
        )}

        {/* Care Info Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
            },
            gap: 3,
          }}
        >
          {/* Habitat with Climate Zone */}
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GrassIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('infohub.plantDetail.whereItLives', 'Where It Lives')}
                </Typography>
              </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
              <Typography variant="body1" sx={{ mb: plantClimateZone ? 2 : 0 }}>
                {plantHabitat}
              </Typography>
              {plantClimateZone && Object.keys(plantClimateZone).length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('infohub.plantDetail.idealTemperatureRange', 'Ideal Temperature Range')}:
                    </Typography>
                    <Typography variant="body1">
                      {plantClimateZone.idealTemperatureRange}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {t('infohub.plantDetail.frostTolerance', 'Frost Tolerance')}:
                    </Typography>
                    <Typography variant="body1">
                      {plantClimateZone.frostTolerance}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Paper>

          {/* Sunlight & Soil */}
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            {/* Sunlight */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <WbSunnyIcon sx={{ mr: 1, color: 'warning.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.sunlight', 'Sunlight')}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {plantSunlight}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Soil */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                component="span"
                sx={{ 
                  mr: 1, 
                  fontSize: 24,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                🪴
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.soil', 'Soil')}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {plantSoil}
            </Typography>
            
            {/* Soil Recommendation Badge */}
            {(() => {
              const recommendedSoilId = recommendSoilType(plantSoil, soilTypes);
              const recommendedSoil = soilTypes?.find(s => s.id === recommendedSoilId);
              
              if (recommendedSoil) {
                // Determine text color based on background brightness
                const hex = recommendedSoil.color.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16);
                const g = parseInt(hex.substr(2, 2), 16);
                const b = parseInt(hex.substr(4, 2), 16);
                const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                const textColor = brightness > 128 ? '#000000' : '#ffffff';
                
                return (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      {t('infohub.plantDetail.recommendedSoilType', 'Recommended Soil Type')}:
                    </Typography>
                    <Chip
                      label={recommendedSoil.name}
                      onClick={() => navigate(`/infohub/soil-types`)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: recommendedSoil.color,
                        color: textColor,
                        fontWeight: 'bold',
                        border: `2px solid ${recommendedSoil.color}`,
                        '&:hover': {
                          opacity: 0.9,
                          transform: 'scale(1.05)',
                          boxShadow: 3,
                        },
                        transition: 'all 0.2s',
                      }}
                    />
                  </Box>
                );
              }
              return null;
            })()}
          </Paper>

          {/* Watering */}
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <OpacityIcon sx={{ mr: 1, color: 'info.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.watering', 'Watering')}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {t('infohub.plantDetail.firstMonth', 'First Month')}:
              </Typography>
              <Typography variant="body1">
                {plantWatering.initial}
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                {t('infohub.plantDetail.afterEstablished', 'After Established')}:
              </Typography>
              <Typography variant="body1">
                {plantWatering.established}
              </Typography>
            </Box>
          </Paper>

          {/* Spacing & Height */}
          {plantSpacing && Object.keys(plantSpacing).length > 0 && (
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HeightIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('infohub.plantDetail.spacingHeight', 'Spacing & Height')}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('infohub.plantDetail.seedSpacing', 'Seed Spacing')}:
                </Typography>
                <Typography variant="body1">
                  {plantSpacing.seedSpacing}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {t('infohub.plantDetail.matureHeight', 'Mature Plant Height')}:
                </Typography>
                <Typography variant="body1">
                  {plantSpacing.matureHeight}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Growth Duration & Common Problems */}
          {(plantGrowthDuration || (plantCommonProblems && plantCommonProblems.length > 0)) && (
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              {/* Growth Duration */}
              {plantGrowthDuration && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ScheduleIcon sx={{ mr: 1, color: 'warning.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {t('infohub.plantDetail.growthDuration', 'Growth Duration')}
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: plantCommonProblems && plantCommonProblems.length > 0 ? 3 : 0 }}>
                    {plantGrowthDuration}
                  </Typography>
                </>
              )}
              
              {plantGrowthDuration && plantCommonProblems && plantCommonProblems.length > 0 && (
                <Divider sx={{ my: 2 }} />
              )}
              
              {/* Common Problems */}
              {plantCommonProblems && plantCommonProblems.length > 0 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WarningIcon sx={{ mr: 1, color: 'error.main', fontSize: 28 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {t('infohub.plantDetail.commonProblems', 'Common Problems')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {plantCommonProblems.map((problem, i) => (
                      <Chip key={i} label={problem} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </>
              )}
            </Paper>
          )}

          {/* Companion Plants */}
          {plantCompanionPlants && (plantCompanionPlants.growsWellWith?.length > 0 || plantCompanionPlants.avoidNear?.length > 0) && (
            <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalFloristIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('infohub.plantDetail.companionPlants', 'Companion Plants')}
                </Typography>
              </Box>
              {plantCompanionPlants.growsWellWith && plantCompanionPlants.growsWellWith.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.growsWellWith', 'Grows Well With')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {plantCompanionPlants.growsWellWith.map((companion, i) => {
                      const companionPlantId = companionPlantIds[companion];
                      return (
                        <Chip
                          key={i}
                          label={companion}
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={companionPlantId ? () => navigate(`/infohub/plants/${companionPlantId}`) : undefined}
                          sx={{
                            cursor: companionPlantId ? 'pointer' : 'default',
                            '&:hover': companionPlantId ? {
                              backgroundColor: theme.palette.success.light,
                              color: theme.palette.success.contrastText,
                            } : {},
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
              {plantCompanionPlants.avoidNear && plantCompanionPlants.avoidNear.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.avoidNear', 'Avoid Near')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {plantCompanionPlants.avoidNear.map((avoid, i) => {
                      const avoidPlantId = companionPlantIds[avoid];
                      return (
                        <Chip
                          key={i}
                          label={avoid}
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={avoidPlantId ? () => navigate(`/infohub/plants/${avoidPlantId}`) : undefined}
                          sx={{
                            cursor: avoidPlantId ? 'pointer' : 'default',
                            '&:hover': avoidPlantId ? {
                              backgroundColor: theme.palette.error.light,
                              color: theme.palette.error.contrastText,
                            } : {},
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>

        {/* Growth Requirements */}
        {plant.growthRequirements && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ThermostatIcon sx={{ mr: 1, color: 'info.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.growthRequirements', 'Growth Requirements')}
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {/* Light Requirements */}
              {plant.growthRequirements.light !== undefined && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.lightRequirement', 'Light Requirement')}:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WbSunnyIcon sx={{ color: 'warning.main' }} />
                    <Typography variant="h6">{plant.growthRequirements.light}/10</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={plant.growthRequirements.light * 10} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Grid>
              )}

              {/* pH Range */}
              {plant.growthRequirements.ph && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.phRange', 'pH Range')}:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">
                      {plant.growthRequirements.ph.min || 'N/A'} - {plant.growthRequirements.ph.max || 'N/A'}
                    </Typography>
                  </Box>
                  {plant.growthRequirements.ph.min && plant.growthRequirements.ph.max && (
                    <Box sx={{ position: 'relative', height: 8, borderRadius: 4, backgroundColor: 'action.hover', overflow: 'hidden' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${(plant.growthRequirements.ph.min / 14) * 100}%`,
                          width: `${((plant.growthRequirements.ph.max - plant.growthRequirements.ph.min) / 14) * 100}%`,
                          height: '100%',
                          backgroundColor: 'secondary.main',
                          borderRadius: 4,
                        }}
                      />
                    </Box>
                  )}
                </Grid>
              )}

              {/* Temperature */}
              {plant.growthRequirements.temperature && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.temperature', 'Temperature Range')}:
                  </Typography>
                  {plant.growthRequirements.temperature.min && (
                    <Typography variant="body2">
                      Min: {plant.growthRequirements.temperature.min.c}°C / {plant.growthRequirements.temperature.min.f}°F
                    </Typography>
                  )}
                  {plant.growthRequirements.temperature.max && (
                    <Typography variant="body2">
                      Max: {plant.growthRequirements.temperature.max.c}°C / {plant.growthRequirements.temperature.max.f}°F
                    </Typography>
                  )}
                </Grid>
              )}

              {/* Atmospheric Humidity */}
              {plant.growthRequirements.atmosphericHumidity !== undefined && (
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.humidity', 'Humidity')}:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WaterDropIcon sx={{ color: 'info.main' }} />
                    <Typography variant="h6">{plant.growthRequirements.atmosphericHumidity}/10</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={plant.growthRequirements.atmosphericHumidity * 10} 
                    sx={{ height: 8, borderRadius: 4 }}
                    color="info"
                  />
                </Grid>
              )}

              {/* Soil Characteristics */}
              {plant.growthRequirements.soil && (
                <>
                  {plant.growthRequirements.soil.nutriments !== undefined && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('infohub.plantDetail.soilNutriments', 'Soil Nutriments')}:
                      </Typography>
                      <Typography variant="h6">{plant.growthRequirements.soil.nutriments}/10</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={plant.growthRequirements.soil.nutriments * 10} 
                        sx={{ height: 8, borderRadius: 4 }}
                        color="success"
                      />
                    </Grid>
                  )}
                  {plant.growthRequirements.soil.texture !== undefined && (
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        {t('infohub.plantDetail.soilTexture', 'Soil Texture')}:
                      </Typography>
                      <Typography variant="body1">{plant.growthRequirements.soil.texture}/10</Typography>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Paper>
        )}

        {/* Growth Characteristics */}
        {plant.growthCharacteristics && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.growthCharacteristics', 'Growth Characteristics')}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* Duration */}
              {plant.growthCharacteristics.duration && plant.growthCharacteristics.duration.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.duration', 'Duration')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {plant.growthCharacteristics.duration.map((dur, i) => (
                      <Chip key={i} label={dur} color="primary" variant="outlined" sx={{ textTransform: 'capitalize' }} />
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Days to Harvest */}
              {plant.growthCharacteristics.daysToHarvest && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.daysToHarvest', 'Days to Harvest')}:
                  </Typography>
                  <Typography variant="h6">{plant.growthCharacteristics.daysToHarvest} days</Typography>
                </Grid>
              )}

              {/* Growth Rate */}
              {plant.growthCharacteristics.rate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.growthRate', 'Growth Rate')}:
                  </Typography>
                  <Chip label={plant.growthCharacteristics.rate} color="secondary" sx={{ textTransform: 'capitalize' }} />
                </Grid>
              )}

              {/* Height */}
              {plant.growthCharacteristics.height && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.height', 'Height')}:
                  </Typography>
                  {plant.growthCharacteristics.height.average && (
                    <Typography variant="body2">
                      {t('infohub.plantDetail.average', 'Average')}: {plant.growthCharacteristics.height.average} cm
                    </Typography>
                  )}
                  {plant.growthCharacteristics.height.maximum && (
                    <Typography variant="body2">
                      {t('infohub.plantDetail.maximum', 'Maximum')}: {plant.growthCharacteristics.height.maximum} cm
                    </Typography>
                  )}
                </Grid>
              )}

              {/* Monthly Calendar */}
              {(plant.growthCharacteristics.growthMonths || plant.growthCharacteristics.bloomMonths || plant.growthCharacteristics.fruitMonths) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    {t('infohub.plantDetail.seasonalCalendar', 'Seasonal Calendar')}:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {plant.growthCharacteristics.growthMonths && plant.growthCharacteristics.growthMonths.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t('infohub.plantDetail.growthMonths', 'Growth')}:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {plant.growthCharacteristics.growthMonths.map((month, i) => (
                            <Chip key={i} label={month.toUpperCase()} size="small" color="success" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {plant.growthCharacteristics.bloomMonths && plant.growthCharacteristics.bloomMonths.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t('infohub.plantDetail.bloomMonths', 'Bloom')}:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {plant.growthCharacteristics.bloomMonths.map((month, i) => (
                            <Chip key={i} label={month.toUpperCase()} size="small" color="secondary" />
                          ))}
                        </Box>
                      </Box>
                    )}
                    {plant.growthCharacteristics.fruitMonths && plant.growthCharacteristics.fruitMonths.length > 0 && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          {t('infohub.plantDetail.fruitMonths', 'Fruit')}:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {plant.growthCharacteristics.fruitMonths.map((month, i) => (
                            <Chip key={i} label={month.toUpperCase()} size="small" color="warning" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        {/* Visual Characteristics */}
        {plant.visualCharacteristics && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalFloristIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.visualCharacteristics', 'Visual Characteristics')}
              </Typography>
            </Box>

            <Table>
              <TableBody>
                {/* Flower Colors */}
                {plant.visualCharacteristics.flower?.colors && plant.visualCharacteristics.flower.colors.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.flower', 'Flower')} - {t('infohub.plantDetail.colors', 'Colors')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {plant.visualCharacteristics.flower.colors.map((color, i) => (
                          <Chip key={i} label={color} size="small" sx={{ textTransform: 'capitalize' }} />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Flower Conspicuous */}
                {plant.visualCharacteristics.flower?.conspicuous !== undefined && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.flower', 'Flower')} - {t('infohub.plantDetail.conspicuous', 'Conspicuous')}
                    </TableCell>
                    <TableCell>
                      {plant.visualCharacteristics.flower.conspicuous ? t('infohub.plantDetail.yes', 'Yes') : t('infohub.plantDetail.no', 'No')}
                    </TableCell>
                  </TableRow>
                )}

                {/* Foliage Texture */}
                {plant.visualCharacteristics.foliage?.texture && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.foliage', 'Foliage')} - {t('infohub.plantDetail.texture', 'Texture')}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {plant.visualCharacteristics.foliage.texture}
                    </TableCell>
                  </TableRow>
                )}

                {/* Foliage Colors */}
                {plant.visualCharacteristics.foliage?.colors && plant.visualCharacteristics.foliage.colors.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.foliage', 'Foliage')} - {t('infohub.plantDetail.colors', 'Colors')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {plant.visualCharacteristics.foliage.colors.map((color, i) => (
                          <Chip key={i} label={color} size="small" sx={{ textTransform: 'capitalize' }} />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Fruit Colors */}
                {plant.visualCharacteristics.fruit?.colors && plant.visualCharacteristics.fruit.colors.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.fruit', 'Fruit')} - {t('infohub.plantDetail.colors', 'Colors')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {plant.visualCharacteristics.fruit.colors.map((color, i) => (
                          <Chip key={i} label={color} size="small" sx={{ textTransform: 'capitalize' }} />
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}

                {/* Fruit Shape */}
                {plant.visualCharacteristics.fruit?.shape && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>
                      {t('infohub.plantDetail.fruit', 'Fruit')} - {t('infohub.plantDetail.shape', 'Shape')}
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {plant.visualCharacteristics.fruit.shape}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        )}

        {/* Distribution */}
        {plant.distribution && (plant.distribution.native?.length > 0 || plant.distribution.introduced?.length > 0) && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PublicIcon sx={{ mr: 1, color: 'info.main', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {t('infohub.plantDetail.distribution', 'Distribution')}
              </Typography>
            </Box>

            {plant.distribution.native && plant.distribution.native.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('infohub.plantDetail.nativeTo', 'Native to')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {plant.distribution.native.map((zone, i) => (
                    <Chip key={i} label={zone.name} size="small" color="success" />
                  ))}
                </Box>
              </Box>
            )}

            {plant.distribution.introduced && plant.distribution.introduced.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {t('infohub.plantDetail.introducedTo', 'Introduced to')}:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {plant.distribution.introduced.map((zone, i) => (
                    <Chip key={i} label={zone.name} size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        )}

        {/* Notes - Moved to Bottom */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Tips & Notes
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {plantNotes}
          </Typography>
        </Paper>

        {/* Navigation */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate('/infohub/plants')}
          >
            Browse All Plants
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/infohub')}
          >
            Back to Infohub
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default PlantDetail;
