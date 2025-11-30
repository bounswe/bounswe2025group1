import React from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  useTheme,
  Divider,
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
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import plantsData from '../../data/plants.json';
import { 
  getTranslatedField, 
  getTranslatedObject, 
  getTranslatedArray,
  getTranslatedCompanionPlants 
} from '../../utils/plantTranslations';

// Helper function to recommend soil type based on plant soil description
const recommendSoilType = (soilDescription) => {
  if (!soilDescription) return null;
  
  const desc = soilDescription.toLowerCase();
  const soils = plantsData.soilTypes || [];
  
  // Check for specific soil type mentions first
  if (desc.includes('sandy-loam') || desc.includes('sandy loam')) {
    const found = soils.find(s => s.id === 'sandy-loam');
    if (found) return 'sandy-loam';
  }
  if (desc.includes('clay-loam') || desc.includes('clay loam')) {
    const found = soils.find(s => s.id === 'clay-loam');
    if (found) return 'clay-loam';
  }
  if (desc.includes('silty-loam') || desc.includes('silty loam')) {
    const found = soils.find(s => s.id === 'silty-loam');
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
    const found = soils.find(s => s.id === 'acidic');
    if (found) return 'acidic';
  }
  if (desc.includes('rich') && desc.includes('well-draining')) {
    const found = soils.find(s => s.id === 'humus-rich');
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

const PlantDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { plantId } = useParams();
  const currentLang = i18n.language || 'en';

  const plant = plantsData.plants.find((p) => p.id === plantId);
  
  // Get translated plant data
  const plantName = getTranslatedField(plant, 'name', currentLang);
  const plantDescription = getTranslatedField(plant, 'description', currentLang);
  const plantHabitat = getTranslatedField(plant, 'habitat', currentLang);
  const plantSoil = getTranslatedField(plant, 'soil', currentLang);
  const plantSunlight = getTranslatedField(plant, 'sunlight', currentLang);
  const plantNotes = getTranslatedField(plant, 'notes', currentLang);
  const plantGrowthDuration = getTranslatedField(plant, 'growthDuration', currentLang);
  const plantWatering = getTranslatedObject(plant, 'watering', currentLang);
  const plantSpacing = getTranslatedObject(plant, 'spacing', currentLang);
  const plantClimateZone = getTranslatedObject(plant, 'climateZone', currentLang);
  const plantCommonProblems = getTranslatedArray(plant, 'commonProblems', currentLang);
  const plantCompanionPlants = getTranslatedCompanionPlants(plant, currentLang);

  if (!plant) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/infohub/plants')}>
          {t('infohub.backToPlants', 'Back to Plants')}
        </Button>
        <Paper sx={{ p: 4, mt: 2, textAlign: 'center' }}>
          <Typography variant="h5">{t('infohub.plantDetail.notFound', 'Plant not found')}</Typography>
        </Paper>
      </Container>
    );
  }

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
              height: 300,
              backgroundColor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              position: 'relative',
            }}
          >
            <Typography sx={{ fontSize: '10rem', lineHeight: 1 }}>
              {plant.image}
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
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <GrassIcon sx={{ mr: 1, color: 'success.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {t('infohub.plantDetail.whereItLives', 'Where It Lives')}
                </Typography>
              </Box>
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
              const recommendedSoilId = recommendSoilType(plantSoil);
              const recommendedSoil = plantsData.soilTypes?.find(s => s.id === recommendedSoilId);
              
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
                      const companionPlantId = findPlantIdByName(companion);
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
                      const avoidPlantId = findPlantIdByName(avoid);
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

        {/* Notes - Moved to Bottom */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Tips & Notes
            </Typography>
          </Box>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {plant.notes}
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
