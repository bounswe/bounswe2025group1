import {
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress
} from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

const WeatherWidget = ({ weatherData, loading = false }) => {
  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <CircularProgress color="success" size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>Loading weather data...</Typography>
      </Paper>
    );
  }

  if (!weatherData) {
    return (
      <Paper elevation={2} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Weather data unavailable
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <WbSunnyIcon sx={{ mr: 1 }} /> Weather Update
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mr: 2 }}>
          {weatherData.current.temp}°C
        </Typography>
        <Box>
          <Typography variant="body1">{weatherData.current.condition}</Typography>
          <Typography variant="body2">{weatherData.location}</Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Humidity: {weatherData.current.humidity}% | Wind: {weatherData.current.wind} km/h
      </Typography>
      <Divider sx={{ my: 2 }} />
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
    </Paper>
  );
};

export default WeatherWidget;