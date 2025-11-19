import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Button, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const InfohubHome = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  // Categories configuration
  const categories = [
    {
      id: 'plant-care',
      image: '/gardens/garden0.png',
      translationKey: 'plantCare'
    },
    {
      id: 'pest-disease',
      image: '/gardens/garden1.png',
      translationKey: 'pestDisease'
    },
    {
      id: 'soil-composting',
      image: '/gardens/garden2.png',
      translationKey: 'soilComposting'
    },
    {
      id: 'gardening-calendar',
      image: '/gardens/garden3.png',
      translationKey: 'gardeningCalendar'
    },
    {
      id: 'tools-techniques',
      image: '/gardens/garden4.png',
      translationKey: 'toolsTechniques'
    },
    {
      id: 'sustainable-gardening',
      image: '/gardens/garden0.png',
      translationKey: 'sustainableGardening'
    }
  ];

  const handleExplore = (categoryId) => {
    navigate(`/infohub/${categoryId}`);
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: theme.palette.background.default }}>
      <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 2, sm: 3 } }}>
        {/* Header Banner */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            mb: { xs: 3, md: 5 },
            background: theme.palette.custom?.buttonGradient || `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            textAlign: 'center',
            border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
              ? '2px solid #000000' 
              : 'none',
          }}
        >
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('infohub.title')}
          </Typography>
          <Typography variant="h6">
            {t('infohub.subtitle')}
          </Typography>
        </Paper>

        {/* Categories Grid */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {categories.map((category) => (
            <Grid item size={{xs: 12, md: 6}} key={category.id}>
              <Card
                sx={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
                    ? '2px solid #000000' 
                    : 'none',
                }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 180, justifyContent: 'space-between' }}>
                  <Typography 
                    gutterBottom 
                    variant="h5" 
                    component="h2"
                    wordWrap="break-word"
                    sx={{ 
                      fontWeight: 'bold',
                      color: theme.palette.text.primary,
                      mb: 2
                    }}
                  >
                    {t(`infohub.categories.${category.translationKey}.title`)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    wordWrap="break-word"
                    sx={{ mb: 2 }}
                  >
                    {t(`infohub.categories.${category.translationKey}.brief`)}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleExplore(category.id)}
                    sx={{
                      mt: 'auto',
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
                    {t('infohub.exploreMore')}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default InfohubHome;
