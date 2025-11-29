import requests
import logging
from django.core.management.base import BaseCommand
from gardenplanner.apps.garden.models import Profile, NotificationCategory
from gardenplanner.apps.garden.signals import _send_notification

logger = logging.getLogger(__name__)

# WMO Weather Codes Interpretation
# Codes 0-3 are "Good" (Clear/Cloudy). Anything else usually implies precipitation/bad weather.
BAD_WEATHER_CODES = {
    # Drizzle
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    # Rain
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    # Snow
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    # Showers
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    # Thunderstorm
    95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Thunderstorm with Heavy Hail"
}

def get_lat_long(location):
    """
    Helper to convert a city name (String) to Lat/Long using Open-Meteo Geocoding.
    """
    try:
        city_name = location.split(',')[0].strip()
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if 'results' in data and len(data['results']) > 0:
            return data['results'][0]['latitude'], data['results'][0]['longitude']
    except Exception as e:
        logger.error(f"Geocoding failed for {city_name}: {e}")
    return None, None

def check_weather_and_notify():
    """
    Checks tomorrow's weather for all unique user locations and sends alerts.
    """
    unique_locations = Profile.objects.exclude(location__isnull=True).exclude(location__exact='').values_list('location', flat=True).distinct()
    
    alerts_sent = 0
    
    logger.info(f"Checking weather for {len(unique_locations)} locations...")

    for location in unique_locations:
        # Get Coordinates
        latitude, longitude = get_lat_long(location)
        
        if not latitude or not longitude:
            logger.warning(f"  - Could not find coordinates for '{location}'")
            continue

        # Request Weather Data (Open-Meteo)
        # Ask for 2 days so index 0 is Today, index 1 is Tomorrow
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast?"
                f"latitude={latitude}&longitude={longitude}"
                f"&daily=weather_code,temperature_2m_max,temperature_2m_min"
                f"&timezone=auto&forecast_days=2"
            )
            response = requests.get(url, timeout=5)
            weather_data = response.json()

            # Open-Meteo returns lists. Index 1 represents "Tomorrow"
            daily_data = weather_data.get('daily', {})
            
            # Safety check if data exists
            if not daily_data or 'weather_code' not in daily_data:
                continue

            tomorrow_code = daily_data['weather_code'][1]
            high_temp = daily_data['temperature_2m_max'][1]
            low_temp = daily_data['temperature_2m_min'][1]

            # Check if weather is "Not Good"
            # Logic: If code is in our BAD list OR temp is freezing OR temp is scorching
            is_bad_weather = False
            condition_text = "Good"

            if tomorrow_code in BAD_WEATHER_CODES:
                is_bad_weather = True
                condition_text = BAD_WEATHER_CODES[tomorrow_code]
            elif low_temp < 0:
                is_bad_weather = True
                condition_text = "Freezing Temperatures"
            elif high_temp > 35:
                is_bad_weather = True
                condition_text = "Extreme Heat"

            # 5. Send Notifications
            if is_bad_weather:
                # Find all users in this location who want notifications
                users_in_location = Profile.objects.filter(
                    location=location, 
                    receives_notifications=True
                )

                message = (
                    f"Weather Alert for {location}: Tomorrow expects {condition_text} "
                    f"with a high of {high_temp}°C and low of {low_temp}°C. "
                    f"Take precautions for your garden!"
                )

                logger.info(f"Sending weather alert to {users_in_location.count()} users in {location}: {message}")

                for profile in users_in_location:
                    _send_notification(
                        notification_receiver=profile.user, # Assuming Profile has OneToOne with User
                        notification_title="Weather Alert",
                        notification_message=message,
                        notification_category=NotificationCategory.WEATHER,
                    )
                    alerts_sent += 1
            else:
                logger.info(f"  - Weather in {location} looks okay ({high_temp}°C).")

        except Exception as e:
            logger.error(f"Failed to process weather for {location}: {e}")
            continue

    return f"Weather check complete. Sent {alerts_sent} alerts."

class Command(BaseCommand):
    help = 'Checks weather forecast and sends alerts for bad weather.'

    def handle(self, *args, **options):
        result = check_weather_and_notify()
        self.stdout.write(self.style.SUCCESS(result))