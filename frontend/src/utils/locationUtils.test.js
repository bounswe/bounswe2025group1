import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geocodeAddress, calculateDistance, getUserCurrentLocation } from './locationUtils';

describe('locationUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('geocodeAddress', () => {
    it('geocodes a valid address successfully', async () => {
      const mockResponse = [
        {
          lat: '41.0082',
          lon: '28.9784',
          display_name: 'Istanbul, Turkey',
        },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await geocodeAddress('Istanbul, Turkey');

      expect(result).toEqual({
        lat: 41.0082,
        lng: 28.9784,
      });
      expect(fetch).toHaveBeenCalledWith(
        'https://nominatim.openstreetmap.org/search?format=json&q=Istanbul%2C%20Turkey&limit=1',
        {
          headers: {
            'User-Agent': 'CommunityGardenApp/1.0',
          },
        }
      );
    });

    it('returns null for invalid address', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      });

      const result = await geocodeAddress('Invalid Address XYZ123');

      expect(result).toBeNull();
    });

    it('returns null for empty address', async () => {
      const result = await geocodeAddress('');
      expect(result).toBeNull();
    });

    it('returns null for null address', async () => {
      const result = await geocodeAddress(null);
      expect(result).toBeNull();
    });

    it('returns null for non-string address', async () => {
      const result = await geocodeAddress(123);
      expect(result).toBeNull();
    });

    it('handles API errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      const result = await geocodeAddress('Istanbul');

      expect(result).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await geocodeAddress('Istanbul');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('calculateDistance', () => {
    it('calculates distance between two points correctly', () => {
      // Istanbul to Ankara (approximately 350 km)
      const istanbul = { lat: 41.0082, lng: 28.9784 };
      const ankara = { lat: 39.9334, lng: 32.8597 };

      const distance = calculateDistance(istanbul.lat, istanbul.lng, ankara.lat, ankara.lng);

      // Should be approximately 350 km (allowing 10% tolerance)
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it('calculates zero distance for same coordinates', () => {
      const distance = calculateDistance(41.0082, 28.9784, 41.0082, 28.9784);
      expect(distance).toBe(0);
    });

    it('calculates distance for nearby points', () => {
      // Two points about 1 km apart
      const distance = calculateDistance(41.0082, 28.9784, 41.0172, 28.9784);
      expect(distance).toBeGreaterThan(0.5);
      expect(distance).toBeLessThan(2);
    });

    it('calculates distance for far apart points', () => {
      // Istanbul to London (approximately 2500 km)
      const istanbul = { lat: 41.0082, lng: 28.9784 };
      const london = { lat: 51.5074, lng: -0.1278 };

      const distance = calculateDistance(istanbul.lat, istanbul.lng, london.lat, london.lng);

      expect(distance).toBeGreaterThan(2000);
      expect(distance).toBeLessThan(3000);
    });

    it('handles negative coordinates', () => {
      // New York to Los Angeles
      const ny = { lat: 40.7128, lng: -74.006 };
      const la = { lat: 34.0522, lng: -118.2437 };

      const distance = calculateDistance(ny.lat, ny.lng, la.lat, la.lng);

      expect(distance).toBeGreaterThan(3000);
      expect(distance).toBeLessThan(4000);
    });

    it('returns consistent results for same input', () => {
      const distance1 = calculateDistance(41.0082, 28.9784, 39.9334, 32.8597);
      const distance2 = calculateDistance(41.0082, 28.9784, 39.9334, 32.8597);

      expect(distance1).toBe(distance2);
    });
  });

  describe('getUserCurrentLocation', () => {
    it('gets user location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
        },
      };

      const mockGetCurrentPosition = vi.fn((success) => {
        success(mockPosition);
      });

      global.navigator.geolocation = {
        getCurrentPosition: mockGetCurrentPosition,
      };

      const result = await getUserCurrentLocation();

      expect(result).toEqual({
        lat: 41.0082,
        lng: 28.9784,
      });
      expect(mockGetCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        })
      );
    });

    it('returns null when geolocation is not available', async () => {
      global.navigator.geolocation = undefined;

      const result = await getUserCurrentLocation();

      expect(result).toBeNull();
    });

    it('handles permission denied error', async () => {
      const mockError = {
        code: 1,
        message: 'User denied geolocation',
      };

      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(mockError);
      });

      global.navigator.geolocation = {
        getCurrentPosition: mockGetCurrentPosition,
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getUserCurrentLocation();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles position unavailable error', async () => {
      const mockError = {
        code: 2,
        message: 'Position unavailable',
      };

      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(mockError);
      });

      global.navigator.geolocation = {
        getCurrentPosition: mockGetCurrentPosition,
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getUserCurrentLocation();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('handles timeout error', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout',
      };

      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(mockError);
      });

      global.navigator.geolocation = {
        getCurrentPosition: mockGetCurrentPosition,
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = await getUserCurrentLocation();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

