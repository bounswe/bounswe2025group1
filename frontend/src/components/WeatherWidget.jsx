import React from 'react';
import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
   Button,
  Alert
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../utils/api';

const WeatherWidget = ({ position = 'normal' }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('Istanbul'); // Default location

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getWeather(location);
      setWeatherData(response.data);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError('Unable to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [location]);

  const isTopRight = position === 'topRight';

  if (loading) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          position: isTopRight ? 'fixed' : 'static',
          top: isTopRight ? 80 : 'auto',
          right: isTopRight ? 16 : 'auto',
          zIndex: isTopRight ? 1000 : 'auto',
          width: isTopRight ? '220px' : 'auto',
        }}
      >
        <CircularProgress color="success" size={30} />
        <Typography variant="body2" sx={{ mt: 1 }}>Loading weather data...</Typography>
      </Paper>
    );
  }
  
  if (locationPermission === 'denied' || error) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, height: widgetHeight, textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunnyIcon sx={{ mr: 1 }} /> Weather Update
        </Typography>
        <Alert severity="info" sx={{ mb: 2,  }}>
          {error || 'Weather data requires location access'}
        </Alert>
        <Box sx={{ mt: 'auto' }}>
          <Button 
            variant="outlined" 
            startIcon={<LocationOnIcon />}
            onClick={requestLocationPermission}
            color="primary"
            fullWidth
          >
            Enable Location Access
          </Button>
        </Box>
      </Paper>
    );
  }

  if (locationPermission === 'prompt') {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, height: widgetHeight, textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WbSunnyIcon sx={{ mr: 1 }} /> Weather Update
        </Typography>
        <Typography variant="body1" sx={{ mb: 2,  }}>
          Get local weather updates for your garden
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Button 
            variant="outlined" 
            startIcon={<LocationOnIcon />}
            onClick={requestLocationPermission}
            color="primary"
            fullWidth
          >
            Share Location
          </Button>
        </Box>
      </Paper>
    );
  }

  if (error || !weatherData) {
    return (
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          textAlign: 'center',
          position: isTopRight ? 'fixed' : 'static',
          top: isTopRight ? 80 : 'auto',
          right: isTopRight ? 16 : 'auto',
          zIndex: isTopRight ? 1000 : 'auto',
          width: isTopRight ? '220px' : 'auto',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {error || 'Weather data unavailable'}
        </Typography>
        <IconButton onClick={fetchWeatherData} size="small" sx={{ mt: 1 }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Paper>
    );
  }

  // Format the weather data based on the API response
  const formatWeatherData = () => {
    if (!weatherData) return null;

    // Check for OpenWeatherMap API format
    if (weatherData.main && weatherData.weather) {
      return {
        location: weatherData.name,
        temperature: Math.round(weatherData.main.temp),
        condition: weatherData.weather[0].main,
        humidity: weatherData.main.humidity,
        wind: Math.round(weatherData.wind.speed)
      };
    }

    // Fallback to generic format (for mock data)
    return {
      location: weatherData.location || 'Unknown',
      temperature: weatherData.current?.temp || weatherData.main?.temp || 'N/A',
      condition: weatherData.current?.condition || (weatherData.weather && weatherData.weather[0]?.main) || 'Unknown',
      humidity: weatherData.current?.humidity || weatherData.main?.humidity || 'N/A',
      wind: weatherData.current?.wind || (weatherData.wind && weatherData.wind.speed) || 'N/A'
    };
  };

  const weather = formatWeatherData();

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: isTopRight ? 2 : 3,
        mb: isTopRight ? 0 : 4,
        position: isTopRight ? 'fixed' : 'static',
        top: isTopRight ? 80 : 'auto',
        right: isTopRight ? 16 : 'auto',
        zIndex: isTopRight ? 1000 : 'auto',
        width: isTopRight ? '220px' : 'auto',
        background: isTopRight ? 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' : 'white',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant={isTopRight ? 'subtitle1' : 'h6'} sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunnyIcon sx={{ mr: 0.5, fontSize: isTopRight ? 20 : 24 }} /> 
          Weather
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchWeatherData} size="small">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Typography variant={isTopRight ? 'h5' : 'h3'} sx={{ mr: 1 }}>
          {weather.temperature}°C
        </Typography>
        <Box>
          <Typography variant="body2">{weather.condition}</Typography>
          <Typography variant="caption">{weather.location}</Typography>
        </Box>
      </Box>
 
      <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
        Humidity: {weather.humidity}% | Wind: {weather.wind} m/s
      </Typography>    
      {!isTopRight && weatherData.forecast && (
        <>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2" gutterBottom>
            3-Day Forecast:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {weatherData.forecast.map((day, index) => (
              <Box key={index} sx={{ textAlign: 'center' }}>
                <Typography variant="body2">{day.date.slice(-5)}</Typography>
                <Typography variant="body2">{day.high}° / {day.low}°</Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{day.condition}</Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default WeatherWidget;