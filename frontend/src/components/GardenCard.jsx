import React from 'react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Box, 
  Button 
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import { useNavigate } from 'react-router-dom';

const GardenCard = ({ garden, variant = 'default' }) => {
  const navigate = useNavigate();

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
        transform: 'scale(1.02)'
      }
    },
    compact: {
      height: '100%',
      width: '100%',
      display: 'flex', 
      flexDirection: 'column'
    },
    featured: {
      height: '100%',
      display: 'flex', 
      flexDirection: 'column',
      border: '2px solid #558b2f',
      '&:hover': {
        boxShadow: 6,
        transform: 'translateY(-4px)'
      }
    }
  };

  const imageHeight = variant === 'compact' ? 120 : 160;

  return (
    <Card sx={cardStyles[variant]}>
      <CardMedia
        component="img"
        height={imageHeight}
        image={garden.image}
        alt={garden.name}
      />
      <CardContent sx={{ flexGrow: 1, pt: 2 }}>
        <Typography gutterBottom variant="h6" component="h2">
          {garden.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {variant === 'compact' 
            ? (garden.description.length > 60 
                ? `${garden.description.substring(0, 60)}...` 
                : garden.description)
            : garden.description
          }
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {garden.location}
          </Typography>
        </Box>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          variant={variant === 'featured' ? 'contained' : 'text'}
          fullWidth={variant === 'featured'}
          size="small" 
          color="primary" 
          onClick={() => navigate(`/gardens/${garden.id}`)}
          sx={{ 
            color: variant === 'featured' ? 'white' : '#2e7d32',
            backgroundColor: variant === 'featured' ? '#558b2f' : 'transparent',
            '&:hover': {
              backgroundColor: variant === 'featured' ? '#33691e' : 'transparent',
            }
          }}
        >
          View Garden
        </Button>
      </Box>
    </Card>
  );
};

export default GardenCard;