import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

const WeatherWidget = ({ city }: { city: string }) => {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,apparent_temperature,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
      );
      setWeather(res.data);
      
     
    } catch (err) {
      Alert.alert('Failed to fetch weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getWeatherFromCity = async () => {
      try {
        setLocationName(city);
        const geoRes = await axios.get(
          `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`
        );
        
        if (!geoRes.data.results || geoRes.data.results.length === 0) {
          Alert.alert('City not found');
          setLoading(false);
          return;
        }
  
        const { latitude, longitude, name } = geoRes.data.results[0];
        
        
        fetchWeather(latitude, longitude);
      } catch (err) {
        Alert.alert('Failed to fetch city coordinates');
        setLoading(false);
      }
    };
    if(city){
        getWeatherFromCity();
    }
    
  }, [city]);

  if (loading) {
    return <ActivityIndicator size="large" color="green" />;
  }

  if (!weather?.current) return <Text>Weather data not available</Text>;

  if (loading || !weather || !weather.current) {
    return <ActivityIndicator size="large" color="green" />;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌤 Weather Update</Text>
      <Text style={styles.temp}>{Math.round(weather.current.temperature_2m)}°C</Text>
      <Text>Feels like: {Math.round(weather.current.apparent_temperature)}°C</Text>
      <Text>Humidity: {weather.current.relative_humidity_2m}%</Text>
      <Text>Wind: {Math.round(weather.current.wind_speed_10m)} km/h</Text>
      <Text style={styles.location}>📍 {locationName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#dbeccf',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  temp: { fontSize: 32, fontWeight: 'bold' },
  location: { marginTop: 8, fontStyle: 'italic' },
});

export default WeatherWidget;