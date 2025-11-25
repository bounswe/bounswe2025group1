import React, { useState } from 'react';
import { Card, CardContent, CardMedia, Typography, Box, Button, IconButton } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import FlagIcon from '@mui/icons-material/Flag';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateLocationString } from '../utils/locationUtils';
import { useAuth } from '../contexts/AuthContextUtils';
import ReportDialog from './ReportDialog';

const GardenCard = ({ garden, variant = 'default' }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  // Different style variants for different usages
  const cardStyles = {
    default: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        boxShadow: 6,
        transform: 'scale(1.02)',
      },
    },
    compact: {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    featured: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '2px solid #558b2f',
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-4px)',
      },
    },
  };

  const imageHeight = variant === 'compact' ? 120 : 160;

  // Handle different image field names from different APIs
  const getImageSrc = () => {
    if (garden.cover_image?.image_base64) {
      return garden.cover_image.image_base64;
    }
    if (garden.image) {
      return garden.image;
    }
    // Fallback to a placeholder image
    return `/gardens/garden${garden.id % 5}.png`;
  };

  return (
    <Card sx={cardStyles[variant]}>
      <CardMedia 
        component="img" 
        height={imageHeight} 
        image={getImageSrc()} 
        alt={garden.name}
        sx={{
          width: '100%',
          height: 'auto',
          maxHeight: `${imageHeight}px`,
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {garden.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {variant === 'compact'
            ? garden.description.length > 60
              ? `${garden.description.substring(0, 60)}...`
              : garden.description
            : garden.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOnIcon fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
            {translateLocationString(garden.location, i18n.language)}
          </Typography>
        </Box>
      </CardContent>
      <Box sx={{ p: 2, pt: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Button
          variant={variant === 'featured' ? 'contained' : 'text'}
          fullWidth={variant === 'featured'}
          size="small"
          color="primary"
          onClick={() => navigate(`/gardens/${garden.id}`)}
          sx={{
            flex: 1,
            color: variant === 'featured' ? 'white' : '#2e7d32',
            backgroundColor: variant === 'featured' ? '#558b2f' : 'transparent',
            '&:hover': {
              backgroundColor: variant === 'featured' ? '#33691e' : 'transparent',
            },
          }}
        >
          {t('gardens.viewGarden')}
        </Button>
        
        {user && (
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              setReportOpen(true);
            }}
            title={t('report.reportGarden', 'Report Garden')}
            sx={{ color: 'text.secondary' }}
          >
            <FlagIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        contentType="garden"
        objectId={garden.id}
      />
    </Card>
  );
};

export default GardenCard;
