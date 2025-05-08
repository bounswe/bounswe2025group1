import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Button, 
  Paper,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContextUtils';
import api from '../../utils/api';
import GrassIcon from '@mui/icons-material/Grass';

// Importing modular components
import GardenCard from '../../components/GardenCard';
import WeatherWidget from '../../components/WeatherWidget';
import TasksList from '../../components/TasksList';
import ForumPreview from '../../components/ForumPreview';

const Home = () => {
  const [gardens, setGardens] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [weather, setWeather] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data in parallel for better performance
        const [gardensRes, tasksRes, weatherRes] = await Promise.all([
          api.getGardens(),
          api.getTasks(),
          api.getWeather()
        ]);

        // Fetch forum posts directly from API endpoint
        const postsResponse = await fetch(`${import.meta.env.VITE_API_URL}/forum/`, {
          headers: {
            'Authorization': token ? `Token ${token}` : undefined
          }
        });
        
        let postsData = [];
        if (postsResponse.ok) {
          postsData = await postsResponse.json();
        }

        setGardens(gardensRes.data);
        setTasks(tasksRes.data);
        setWeather(weatherRes.data);
        setPosts(postsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Get pending tasks
  const pendingTasks = tasks.filter(task => task.status === 'Pending');

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh', 
        width: '100%' 
      }}>
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <Container 
        maxWidth="lg" 
        disableGutters={false} 
        sx={{ 
          mt: { xs: 2, md: 4 }, 
          mb: { xs: 2, md: 4 }, 
          px: { xs: 2, sm: 3, md: 4 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Welcome Banner */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 4, 
            background: 'linear-gradient(135deg, #81c784 0%, #388e3c 100%)',
            color: 'white',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <Typography variant="h4" gutterBottom>
            Welcome {currentUser ? currentUser.name : 'to Community Garden Planner'}!
          </Typography>
          <Typography variant="body1" paragraph>
            Connect with local gardeners, manage community gardens, and nurture your green spaces together.
          </Typography>
          {!currentUser && (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => navigate('/auth/register')}
            >
              Join Our Community
            </Button>
          )}
        </Paper>

        {/* Content Sections */}
        <Grid container spacing={{ xs: 2, md: 4 }} sx={{ width: '100%', margin: 0 }}>
          {/* Featured Gardens */}
          <Grid size={12}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                <GrassIcon sx={{ mr: 1 }} /> Featured Gardens
              </Typography>
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 0 }}>
                {gardens.slice(0, 3).map((garden) => (
                  <Grid key={garden.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <GardenCard garden={garden} variant="featured" />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  color="primary"
                  onClick={() => navigate('/gardens')}
                  sx={{ color: '#2e7d32', borderColor: '#2e7d32' }}
                >
                  See All Gardens
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Weather Widget Component */}
          <Grid size={{ xs: 12, md: 6 }}>
            <WeatherWidget weatherData={weather} />
          </Grid>

          {/* Tasks List Component */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TasksList tasks={pendingTasks} title="Pending Tasks" limit={5} />
          </Grid>

          {/* Forum Preview Component */}
          <Grid size={{ xs: 12, md: 6 }}>
            <ForumPreview posts={posts} limit={2} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;