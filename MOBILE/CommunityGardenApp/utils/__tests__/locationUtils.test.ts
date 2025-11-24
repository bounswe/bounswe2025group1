import {
  translateCountryName,
  translateLocationString,
  geocodeAddress,
  reverseGeocode,
  calculateDistance,
  getUserCurrentLocation,
  checkLocationPermission,
} from '../locationUtils';
import * as Location from 'expo-location';

// Mock expo-location
jest.mock('expo-location');

describe('Location Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global fetch
    global.fetch = jest.fn();
  });

  describe('translateCountryName', () => {
    it('should translate Turkey to Türkiye in Turkish', () => {
      expect(translateCountryName('Turkey', 'tr')).toBe('Türkiye');
    });

    it('should keep Turkey as Turkey in English', () => {
      expect(translateCountryName('Turkey', 'en')).toBe('Turkey');
    });

    it('should return original name if no translation found', () => {
      expect(translateCountryName('Unknown', 'tr')).toBe('Unknown');
    });
  });

  describe('translateLocationString', () => {
    it('should translate country names in location string', () => {
      expect(translateLocationString('Istanbul, Turkey', 'tr')).toBe('Istanbul, Türkiye');
    });
  });

  describe('geocodeAddress', () => {
    it('should return coordinates for valid address', async () => {
      const mockResponse = [{ lat: '41.0082', lon: '28.9784' }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await geocodeAddress('Istanbul');

      expect(result).toEqual({ lat: 41.0082, lng: 28.9784 });
    });

    it('should return null for invalid address', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const result = await geocodeAddress('Invalid Address');

      expect(result).toBeNull();
    });

    it('should return null on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await geocodeAddress('Istanbul');

      expect(result).toBeNull();
    });
  });

  describe('reverseGeocode', () => {
    it('should return address for valid coordinates', async () => {
      const mockResponse = { display_name: 'Istanbul, Turkey' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await reverseGeocode(41.0082, 28.9784);

      expect(result).toBe('Istanbul, Turkey');
    });

    it('should translate country in address if needed', async () => {
      const mockResponse = { display_name: 'Istanbul, Turkey' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await reverseGeocode(41.0082, 28.9784, 'tr');

      expect(result).toBe('Istanbul, Türkiye');
    });

    it('should return null on fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await reverseGeocode(41.0082, 28.9784);

      expect(result).toBeNull();
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance between Istanbul (41.0082, 28.9784) and Ankara (39.9334, 32.8597)
      // Approx 350km
      const dist = calculateDistance(41.0082, 28.9784, 39.9334, 32.8597);
      expect(dist).toBeGreaterThan(300);
      expect(dist).toBeLessThan(400);
    });

    it('should return 0 for same points', () => {
      const dist = calculateDistance(41.0082, 28.9784, 41.0082, 28.9784);
      expect(dist).toBe(0);
    });
  });

  describe('getUserCurrentLocation', () => {
    it('should return location when permission granted', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: { latitude: 41.0082, longitude: 28.9784 },
      });

      const result = await getUserCurrentLocation();

      expect(result).toEqual({ lat: 41.0082, lng: 28.9784 });
    });

    it('should return null when permission denied', async () => {
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await getUserCurrentLocation();

      expect(result).toBeNull();
    });
  });

  describe('checkLocationPermission', () => {
    it('should return true when permission granted', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await checkLocationPermission();

      expect(result).toBe(true);
    });

    it('should return false when permission denied', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await checkLocationPermission();

      expect(result).toBe(false);
    });
  });
});
