import requests
from django.conf import settings
from rest_framework.exceptions import APIException
import logging

logger = logging.getLogger(__name__)

def get_location_coordinates(location):
    """
    Gets coordinates for a location using OpenWeatherMap Geocoding API
    
    Args:
        location (str): Location name (e.g., 'Istanbul,TR')
        
    Returns:
        tuple: (latitude, longitude) or None if not found
    """
    try:
        url = "https://api.openweathermap.org/geo/1.0/direct"
        params = {
            'q': location,
            'limit': 1,
            'appid': settings.OPENWEATHERMAP_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return data[0]['lat'], data[0]['lon']
            else:
                return None
        else:
            logger.error(f"Geocoding API error: {response.status_code}, {response.text}")
            return None
            
    except requests.RequestException as e:
        logger.error(f"Geocoding API request error: {str(e)}")
        return None

def get_weather_data(location):
    """
    Fetches weather data for a specific location using OpenWeatherMap API
    
    Args:
        location (str): Location name (e.g., 'Istanbul')
        
    Returns:
        dict: Weather data for the location
    """
    try:
        # First get coordinates for the location
        coordinates = get_location_coordinates(location)
        
        if not coordinates:
            return {'error': 'Location not found'}
            
        lat, lon = coordinates
        
        # Now use coordinates to get weather data
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': settings.OPENWEATHERMAP_API_KEY,
            'units': 'metric'  # For Celsius
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        # Check if request was successful
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return {'error': 'Weather data not found'}
        else:
            logger.error(f"Weather API error: {response.status_code}, {response.text}")
            return {'error': 'Weather service unavailable'}
            
    except requests.RequestException as e:
        logger.error(f"Weather API request error: {str(e)}")
        return {'error': 'Could not connect to weather service'}
