/**
 * Utility functions for location and address handling in mobile app
 */

import * as Location from 'expo-location';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

/**
 * Translates country names based on current language
 * @param countryName - The country name to translate
 * @param language - Current language ('tr' for Turkish, 'en' for English)
 * @returns Translated country name
 */
export const translateCountryName = (countryName: string, language: string): string => {
  if (!countryName) return '';

  // Handle Turkey/Türkiye translation specifically
  if (countryName.toLowerCase().includes('turkey') || countryName.toLowerCase().includes('türkiye')) {
    return language === 'tr' ? 'Türkiye' : 'Turkey';
  }

  const countryTranslations: Record<string, string> = {
    'Turkey': language === 'tr' ? 'Türkiye' : 'Turkey',
    'Türkiye': language === 'tr' ? 'Türkiye' : 'Turkey',
    'United States': language === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States',
    'Amerika Birleşik Devletleri': language === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States',
    'Germany': language === 'tr' ? 'Almanya' : 'Germany',
    'Almanya': language === 'tr' ? 'Almanya' : 'Germany',
    'France': language === 'tr' ? 'Fransa' : 'France',
    'Fransa': language === 'tr' ? 'Fransa' : 'France',
    'United Kingdom': language === 'tr' ? 'Birleşik Krallık' : 'United Kingdom',
    'Birleşik Krallık': language === 'tr' ? 'Birleşik Krallık' : 'United Kingdom',
    'Italy': language === 'tr' ? 'İtalya' : 'Italy',
    'İtalya': language === 'tr' ? 'İtalya' : 'Italy',
    'Spain': language === 'tr' ? 'İspanya' : 'Spain',
    'İspanya': language === 'tr' ? 'İspanya' : 'Spain',
    'Greece': language === 'tr' ? 'Yunanistan' : 'Greece',
    'Yunanistan': language === 'tr' ? 'Yunanistan' : 'Greece',
  };

  return countryTranslations[countryName] || countryName;
};

/**
 * Translates location string based on current language
 * @param location - The location string that may contain country names
 * @param language - Current language ('tr' for Turkish, 'en' for English)
 * @returns Location string with translated country names
 */
export const translateLocationString = (location: string, language: string): string => {
  if (!location || typeof location !== 'string') return location || '';

  const locationTranslations: Record<string, string> = {
    // Countries
    'Turkey': language === 'tr' ? 'Türkiye' : 'Turkey',
    'Türkiye': language === 'tr' ? 'Türkiye' : 'Turkey',
    'United States': language === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States',
    'Amerika Birleşik Devletleri': language === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States',
    'Germany': language === 'tr' ? 'Almanya' : 'Germany',
    'Almanya': language === 'tr' ? 'Almanya' : 'Germany',
    'France': language === 'tr' ? 'Fransa' : 'France',
    'Fransa': language === 'tr' ? 'Fransa' : 'France',
    'United Kingdom': language === 'tr' ? 'Birleşik Krallık' : 'United Kingdom',
    'Birleşik Krallık': language === 'tr' ? 'Birleşik Krallık' : 'United Kingdom',

    // Turkish Regions
    'Marmara Region': language === 'tr' ? 'Marmara Bölgesi' : 'Marmara Region',
    'Marmara Bölgesi': language === 'tr' ? 'Marmara Bölgesi' : 'Marmara Region',
    'Central Anatolia Region': language === 'tr' ? 'İç Anadolu Bölgesi' : 'Central Anatolia Region',
    'İç Anadolu Bölgesi': language === 'tr' ? 'İç Anadolu Bölgesi' : 'Central Anatolia Region',
    'Aegean Region': language === 'tr' ? 'Ege Bölgesi' : 'Aegean Region',
    'Ege Bölgesi': language === 'tr' ? 'Ege Bölgesi' : 'Aegean Region',
  };

  let translatedLocation = location;

  Object.entries(locationTranslations).forEach(([original, translated]) => {
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    translatedLocation = translatedLocation.replace(regex, translated);
  });

  return translatedLocation;
};

/**
 * Geocodes an address string to coordinates using OpenStreetMap Nominatim API
 * @param address - The address string to geocode
 * @returns Coordinates or null if geocoding fails
 */
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  if (!address || typeof address !== 'string') {
    return null;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      {
        headers: {
          'User-Agent': 'CommunityGardenApp/1.0',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Reverse geocodes coordinates to an address using OpenStreetMap Nominatim API
 * @param lat - Latitude
 * @param lng - Longitude
 * @param language - Language for address ('tr' or 'en')
 * @returns Address string or null if reverse geocoding fails
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
  language: string = 'en'
): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=${language}`,
      {
        headers: {
          'User-Agent': 'CommunityGardenApp/1.0',
          'Accept-Language': language,
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.display_name) {
      let address = data.display_name;

      // Apply country name translation
      if (address.includes('Turkey')) {
        address = address.replace(/Turkey/g, translateCountryName('Turkey', language));
      }

      return address;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

/**
 * Calculates the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Requests location permissions and gets user's current location
 * @returns User coordinates or null if unable to get location
 */
export const getUserCurrentLocation = async (): Promise<Coordinates | null> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.error('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting user location:', error);
    return null;
  }
};

/**
 * Checks if location permissions are granted
 * @returns boolean indicating if permissions are granted
 */
export const checkLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};
