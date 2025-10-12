import { Container, Typography, Box, Grid, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import WeatherWidget from '../../components/WeatherWidget';
import TasksList from '../../components/TasksList';
import ForumPreview from '../../components/ForumPreview';
import GardensPreview from '../../components/GardensPreview';

const WIDGET_HEIGHT = 350;

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, px: 3 }}>
        {/* Welcome Banner */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 5,
            background: 'linear-gradient(135deg, #81c784 0%, #388e3c 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" gutterBottom>
            {user ? `Welcome, ${user.username}!` : 'Welcome to Community Garden Planner!'}
          </Typography>
          <Typography variant="body1" paragraph>
            Connect with local gardeners, manage tasks, track your garden, and grow together 🌱
          </Typography>
          {!user && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => navigate('/auth/register')}
            >
              Join Our Community
            </Button>
          )}
        </Paper>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12 }}>
            <GardensPreview limit={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} height={WIDGET_HEIGHT}>
            <TasksList limit={3} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} height={WIDGET_HEIGHT}>
            <ForumPreview limit={2} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} height={WIDGET_HEIGHT}>
            <WeatherWidget />
          </Grid>
        </Grid>

        {!user && (
          <Paper elevation={1} sx={{ mt: 6, p: 4 }}>
            <Typography variant="h5" gutterBottom>
              What is Community Garden Planner?
            </Typography>
            <Typography variant="body1" paragraph>
              Community Garden Planner is a platform designed to help you manage your garden and
              connect with local gardeners. In the platform, you can create and manage your own
              garden, track tasks, ask gardening questions to experts, and even connect with other
              gardeners in your area. Our goal is to foster recreational gardening, community
              engagement, and environmental avareness. Join the community today and lets make a
              difference together!
            </Typography>
            <Button variant="contained" onClick={() => navigate('/auth/register')}>
              Create Your First Garden
            </Button>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Home;
