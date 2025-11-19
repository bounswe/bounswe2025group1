import React from 'react';
import { Container, Typography, Box, Paper, Button, useTheme } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const InfohubDetail = () => {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  // Map category IDs to translation keys
  const categoryMap = {
    'plant-care': 'plantCare',
    'pest-disease': 'pestDisease',
    'soil-composting': 'soilComposting',
    'gardening-calendar': 'gardeningCalendar',
    'tools-techniques': 'toolsTechniques',
    'sustainable-gardening': 'sustainableGardening'
  };

  const translationKey = categoryMap[categoryId];

  // If category doesn't exist, redirect to infohub home
  if (!translationKey) {
    navigate('/infohub');
    return null;
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="md" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/infohub')}
          sx={{
            mb: 3,
            color: theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          }}
        >
          {t('common.back')}
        </Button>

        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            mb: 4,
            background: theme.palette.custom?.buttonGradient || `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
              ? '2px solid #000000' 
              : 'none',
          }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t(`infohub.categories.${translationKey}.title`)}
          </Typography>
          <Typography variant="h6">
            {t(`infohub.categories.${translationKey}.brief`)}
          </Typography>
        </Paper>

        {/* Content Section - Placeholder for future detail content */}
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4 },
            backgroundColor: theme.palette.background.paper,
            border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
              ? '2px solid #000000' 
              : 'none',
          }}
        >
          <Typography variant="body1" paragraph sx={{ color: theme.palette.text.secondary }}>
            {t('infohub.detailsComingSoon')}
          </Typography>
          
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              onClick={() => navigate('/infohub')}
              sx={{
                background: theme.palette.custom?.buttonGradient || theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
                  ? '2px solid #000000' 
                  : 'none',
                '&:hover': {
                  background: theme.palette.custom?.buttonGradientHover || theme.palette.primary.dark,
                },
                '&:focus': {
                  outline: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff'
                    ? '3px solid #ffff00'
                    : `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: '2px',
                },
              }}
            >
              {t('infohub.backToCategories')}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default InfohubDetail;
