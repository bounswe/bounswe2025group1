"""Weather Related Views"""

from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from ..utils import get_weather_data
from rest_framework.permissions import AllowAny


@method_decorator(cache_page(60 * 5), name='get')
class WeatherDataView(APIView):
    """View to get weather data for a location"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        location = request.query_params.get('location')
        
        if not location:
            return Response(
                {'error': 'Location parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        weather_data = get_weather_data(location)
        
        if 'error' in weather_data:
            if weather_data['error'] == 'Location not found':
                return Response(
                    {'error': 'Location not found. Please check the city name or provide a more specific location.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            return Response(
                {'error': weather_data['error']},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        return Response(weather_data)