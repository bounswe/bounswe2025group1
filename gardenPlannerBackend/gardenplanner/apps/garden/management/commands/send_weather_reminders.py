import requests
import logging
from collections import defaultdict
from django.core.management.base import BaseCommand
from gardenplanner.apps.garden.models import Garden, GardenMembership, NotificationCategory
from gardenplanner.apps.garden.signals import _send_notification

logger = logging.getLogger(__name__)

# WMO Weather Codes (Same as before)
BAD_WEATHER_CODES = {
    51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
    61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
    71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
    80: "Slight Rain Showers", 81: "Moderate Rain Showers", 82: "Violent Rain Showers",
    95: "Thunderstorm", 96: "Thunderstorm with Hail", 99: "Thunderstorm with Heavy Hail"
}

def analyze_weather_data(latitude, longitude):
    """
    Reusable helper that calls Open-Meteo.
    Returns: (is_bad_weather, condition_text, high_temp, low_temp)
    """
    try:
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={latitude}&longitude={longitude}"
            f"&daily=weather_code,temperature_2m_max,temperature_2m_min"
            f"&timezone=auto&forecast_days=2"
        )
        response = requests.get(url, timeout=5)
        weather_data = response.json()

        daily_data = weather_data.get('daily', {})
        
        if not daily_data or 'weather_code' not in daily_data or len(daily_data['weather_code']) < 2:
            return False, "No Data", 0, 0

        tomorrow_code = daily_data['weather_code'][1]
        high_temp = daily_data['temperature_2m_max'][1]
        low_temp = daily_data['temperature_2m_min'][1]

        condition_text = "Good"
        is_bad = False

        if tomorrow_code in BAD_WEATHER_CODES:
            is_bad = True
            condition_text = BAD_WEATHER_CODES[tomorrow_code]
        elif low_temp < 0:
            is_bad = True
            condition_text = "Freezing Temperatures"
        elif high_temp > 35:
            is_bad = True
            condition_text = "Extreme Heat"
            
        return is_bad, condition_text, high_temp, low_temp

    except Exception as e:
        logger.error(f"Weather API failed for {latitude}, {longitude}: {e}")
        return False, "Error", 0, 0


def notify_garden_members(garden, condition, high, low):
    """
    Helper: Finds valid members of a specific garden and sends alerts.
    """
    memberships = GardenMembership.objects.filter(
        garden=garden,
        status='ACCEPTED'  # Only notify active members
    ).select_related('user')

    if not memberships.exists():
        return 0

    message = (
        f"Weather Alert for garden '{garden.name}': "
        f"Tomorrow expects {condition} "
        f"(High: {high}°C, Low: {low}°C). Take precautions!"
    )

    sent_count = 0
    for membership in memberships:
        _send_notification(
            notification_receiver=membership.user,
            notification_title=f"Garden Alert: {garden.name}",
            notification_message=message,
            notification_category=NotificationCategory.WEATHER,
        )
        sent_count += 1

    return sent_count

def check_weather_and_notify():
    total_alerts = 0
    
    # Coordinate-based Clustering
    gardens_with_coords = Garden.objects.filter(
        latitude__isnull=False,
        longitude__isnull=False
    )
    logger.info(f"Processing {gardens_with_coords.count()} gardens...")

    # Cluster by rounding coordinates (approx 11km)
    coordinate_clusters = defaultdict(list)
    for garden in gardens_with_coords:
        key = (round(garden.latitude, 1), round(garden.longitude, 1))
        coordinate_clusters[key].append(garden)

    logger.info(f"Processing {len(coordinate_clusters)} coordinate clusters...")

    for (lat_key, long_key), gardens_in_cluster in coordinate_clusters.items():
        # Use the first garden's exact coords for the API call

        is_bad, condition, high, low = analyze_weather_data(lat_key, long_key)

        if is_bad:
            for garden in gardens_in_cluster:
                count = notify_garden_members(garden, condition, high, low)
                total_alerts += count

    logger.info(f"Weather check complete. Sent {total_alerts} alerts.")


class Command(BaseCommand):
    help = 'Checks weather forecast and sends alerts for bad weather.'

    def handle(self, *args, **options):
        check_weather_and_notify()
