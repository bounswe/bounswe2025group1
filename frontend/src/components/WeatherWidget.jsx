import { useState, useEffect } from 'react';
import { Paper, Typography, Box, Divider, CircularProgress, Button, Alert } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import React from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useTranslation } from 'react-i18next';

const WeatherWidget = () => {
  const { t, i18n } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'

  const requestWeatherData = async (latitude, longitude) => {
    setLoading(true);
    setError(null);
    try {
      // Open-Meteo API URL with relevant parameters
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`;

      const response = await fetch(url);
      if (!response.ok) {
        toast.error(t('weather.serviceUnavailable'));
        setError(t('weather.serviceUnavailableMessage'));
        return;
      }

      const data = await response.json();
      const processedData = processWeatherData(data);
      setWeatherData(processedData);
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherCondition = (weatherCode) => {
    // WMO Weather interpretation codes
    const weatherConditions = {
      0: t('weather.clearSky'),
      1: t('weather.mainlyClear'),
      2: t('weather.partlyCloudy'),
      3: t('weather.overcast'),
      45: t('weather.fog'),
      48: t('weather.depositingRimeFog'),
      51: t('weather.lightDrizzle'),
      53: t('weather.moderateDrizzle'),
      55: t('weather.denseDrizzle'),
      56: t('weather.lightFreezingDrizzle'),
      57: t('weather.denseFreezingDrizzle'),
      61: t('weather.slightRain'),
      63: t('weather.moderateRain'),
      65: t('weather.heavyRain'),
      66: t('weather.lightFreezingRain'),
      67: t('weather.heavyFreezingRain'),
      71: t('weather.slightSnowFall'),
      73: t('weather.moderateSnowFall'),
      75: t('weather.heavySnowFall'),
      77: t('weather.snowGrains'),
      80: t('weather.slightRainShowers'),
      81: t('weather.moderateRainShowers'),
      82: t('weather.violentRainShowers'),
      85: t('weather.slightSnowShowers'),
      86: t('weather.heavySnowShowers'),
      95: t('weather.thunderstorm'),
      96: t('weather.thunderstormSlightHail'),
      99: t('weather.thunderstormHeavyHail'),
    };

    return weatherConditions[weatherCode] || t('weather.unknown');
  };

  const processWeatherData = (data) => {
    // Extract location from timezone
    const locationName = data.timezone.split('/').pop().replace('_', ' ');

    // Process current weather
    const current = {
      temp: Math.round(data.current.temperature_2m),
      condition: getWeatherCondition(data.current.weather_code),
      humidity: data.current.relative_humidity_2m,
      wind: Math.round(data.current.wind_speed_10m),
      feelsLike: Math.round(data.current.apparent_temperature),
    };

    // Process forecast for next 3 days
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
    const forecast = data.daily.time.slice(0, 3).map((date, index) => ({
      date: new Date(date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }),
      high: Math.round(data.daily.temperature_2m_max[index]),
      low: Math.round(data.daily.temperature_2m_min[index]),
      condition: getWeatherCondition(data.daily.weather_code[index]),
    }));

    return {
      location: locationName,
      current,
      forecast,
    };
  };

  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setLocationPermission('granted');
      await requestWeatherData(latitude, longitude);
    } catch (err) {
      console.error('Error getting location:', err);
      setLocationPermission('denied');
      setError('Location access denied. Please enable location services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkLocationPermission = async () => {
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setLocationPermission(permission.state);

          if (permission.state === 'granted') {
            requestLocationPermission();
          }

          permission.addEventListener('change', () => {
            setLocationPermission(permission.state);
          });
        } catch (error) {
          console.error('Error checking permissions:', error);
          // Fallback to standard permission request
          requestLocationPermission();
        }
      } else {
        // Fallback for browsers without Permissions API
        requestLocationPermission();
      }
    };

    checkLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          height: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress color="success" size={40} />
        <Typography variant="body2" sx={{ mt: 2 }}>
          {t('weather.loading')}
        </Typography>
      </Paper>
    );
  }

  if (locationPermission === 'denied' || error) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          height: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunnyIcon sx={{ mr: 1 }} /> {t('weather.title')}
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
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
            {t('weather.enableLocationAccess')}
          </Button>
        </Box>
      </Paper>
    );
  }

  if (locationPermission === 'prompt') {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          height: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <WbSunnyIcon sx={{ mr: 1 }} /> {t('weather.title')}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {t('weather.description')}
        </Typography>
        <Box sx={{ mt: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<LocationOnIcon />}
            onClick={requestLocationPermission}
            color="primary"
            fullWidth
          >
            {t('weather.shareLocation')}
          </Button>
        </Box>
      </Paper>
    );
  }

  if (!weatherData) {
    return (
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 4,
          height: 300,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {t('weather.dataUnavailable')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        height: 300,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <WbSunnyIcon sx={{ mr: 1 }} /> {t('weather.title')}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h3" sx={{ mr: 2 }}>
          {weatherData.current.temp}°C
        </Typography>
        <Box>
          <Typography variant="body1">{weatherData.current.condition}</Typography>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} />
            {weatherData.location}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>
        {t('weather.feelsLike')}: {weatherData.current.feelsLike}°C | {t('weather.humidity')}: {weatherData.current.humidity}% |
        {t('weather.wind')}: {weatherData.current.wind} km/h
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" gutterBottom>
        {t('weather.threeDayForecast')}:
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexGrow: 1 }}>
        {weatherData.forecast.map((day, index) => (
          <Box key={index} sx={{ textAlign: 'center' }}>
            <Typography variant="body2">{day.date}</Typography>
            <Typography variant="body2">
              {day.high}° / {day.low}°
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              {day.condition}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default WeatherWidget;
