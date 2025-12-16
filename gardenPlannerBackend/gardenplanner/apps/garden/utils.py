import requests
import random
import hashlib
from django.conf import settings
from rest_framework.exceptions import APIException
import logging

logger = logging.getLogger(__name__)


def generate_otp():
    """Generate a 6-digit OTP code"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def get_device_identifier(request):
    """Generate device identifier from request headers."""
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    return hashlib.sha256(user_agent.encode()).hexdigest()[:32]


def get_device_name(request):
    """Extract device/browser name from User-Agent."""
    ua = request.META.get('HTTP_USER_AGENT', 'Unknown')
    # Simple parsing; use user-agent library for production
    if 'Chrome' in ua:
        return 'Chrome'
    elif 'Firefox' in ua:
        return 'Firefox'
    elif 'Safari' in ua:
        return 'Safari'
    elif 'Mobile' in ua or 'Android' in ua or 'iPhone' in ua:
        return 'Mobile App'
    return 'Unknown Browser'


def get_client_ip(request):
    """Get client IP address."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '127.0.0.1')

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
