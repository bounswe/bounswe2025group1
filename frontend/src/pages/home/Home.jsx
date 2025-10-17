import { Container, Typography, Box, Grid, Button, Paper, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import { useTranslation } from 'react-i18next';
import WeatherWidget from '../../components/WeatherWidget';
import ForumPreview from '../../components/ForumPreview';
import GardensPreview from '../../components/GardensPreview';
import TaskWidget from '../../components/TaskWidget';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
        {/* Welcome Banner */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 5,
            background: theme.palette.custom?.buttonGradient || `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
            color: theme.palette.primary.contrastText,
            border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
              ? '2px solid #000000' 
              : 'none',
          }}
        >
          <Typography variant="h4" gutterBottom>
            {user ? t('home.welcome', { username: `, ${user.username}` }) : t('home.welcomeGuest')}
          </Typography>
          <Typography variant="body1" paragraph>
            {t('home.subtitle')}
          </Typography>
          {!user && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/auth/register')}
            >
              {t('home.joinCommunity')}
            </Button>
          )}
        </Paper>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12 }}>
            <GardensPreview limit={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TaskWidget />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <ForumPreview limit={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <WeatherWidget />
          </Grid>
        </Grid>

        {!user && (
          <Paper 
            elevation={1} 
            sx={{ 
              mt: 6, 
              p: 4,
              backgroundColor: theme.palette.background.paper,
              border: theme.palette.mode === 'light' && theme.palette.custom?.loginPaper === '#ffffff' 
                ? '2px solid #000000' 
                : 'none',
            }}
          >
            <Typography variant="h5" gutterBottom>
              {t('home.aboutTitle')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('home.aboutDescription')}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/auth/register')}
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
              {t('home.createFirstGarden')}
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Home;
