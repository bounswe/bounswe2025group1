import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WeatherWidget from './WeatherWidget';

// Mock data for successful API response
const mockWeatherData = {
  timezone: 'Europe/Istanbul',
  current: {
    temperature_2m: 22.5,
    relative_humidity_2m: 65,
    apparent_temperature: 23.1,
    wind_speed_10m: 12.3,
    weather_code: 1,
  },
  daily: {
    time: ['2025-05-08', '2025-05-09', '2025-05-10'],
    temperature_2m_max: [25.3, 26.8, 22.1],
    temperature_2m_min: [15.7, 16.2, 14.9],
    weather_code: [0, 2, 3],
  },
};

// Mock fetch API
window.fetch = vi.fn();

// Mock for geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

// Mock for permissions API
const mockPermissionsQuery = vi.fn();
const mockPermission = {
  state: 'prompt',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

describe('WeatherWidget Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup successful fetch response by default
    window.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWeatherData),
    });

    // Setup geolocation mock
    navigator.geolocation = mockGeolocation;
    mockGeolocation.getCurrentPosition.mockImplementation((successCallback) => {
      successCallback({
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
        },
      });
    });

    // Setup permissions mock
    if (!('permissions' in navigator)) {
      navigator.permissions = {
        query: mockPermissionsQuery,
      };
    } else {
      navigator.permissions.query = mockPermissionsQuery;
    }
    mockPermissionsQuery.mockResolvedValue(mockPermission);

    // Mock console.error to avoid noisy test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });

  it('renders initial prompt state correctly', () => {
    render(<WeatherWidget />);

    // Check for the share location button
    expect(screen.getByRole('button', { name: /share location/i })).toBeInTheDocument();
    expect(screen.getByText(/get local weather updates/i)).toBeInTheDocument();
  });

  it('shows loading state while fetching weather data', async () => {
    // Setup delayed response to ensure loading state is visible
    fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockWeatherData),
            });
          }, 100);
        })
    );

    mockPermission.state = 'granted';

    render(<WeatherWidget />);

    // Should show loading immediately
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading weather data/i)).toBeInTheDocument();
    });
  });

  it('shows error state when location permission is denied', async () => {
    // Simulate denied permission
    mockPermission.state = 'denied';

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/weather data requires location access/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable location access/i })).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    // Setup permission as granted but fetch to fail
    mockPermission.state = 'granted';
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable location access/i })).toBeInTheDocument();
    });
  });

  it('shows error state when API returns non-OK response', async () => {
    // Setup permission as granted but API to return error
    mockPermission.state = 'granted';
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/weather service unavailable/i)).toBeInTheDocument();
    });
  });

  it('handles geolocation error correctly', async () => {
    // Reset the default geolocation mock first to ensure clean state
    mockGeolocation.getCurrentPosition.mockReset();

    // Simulate geolocation error that will properly trigger immediately
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({ code: 1, message: 'User denied geolocation' });
    });

    // Mock permission as prompt to ensure we trigger the location request
    mockPermission.state = 'prompt';

    render(<WeatherWidget />);

    // Click on share location button
    fireEvent.click(screen.getByRole('button', { name: /share location/i }));

    // Look for the error message and button instead of role="alert"
    await waitFor(() => {
      expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enable location access/i })).toBeInTheDocument();
    });
  });

  it('successfully fetches and displays weather data', async () => {
    // Setup successful permission and response
    mockPermission.state = 'granted';

    render(<WeatherWidget />);

    // Wait for data to load and display
    await waitFor(() => {
      // Check for current weather data
      // Use a more specific approach to find the temperature in the h3 element
      const tempElements = screen.getAllByText(/23°C/i);
      expect(tempElements.length).toBeGreaterThan(0);

      // Verify the main temp is displayed in an h3
      const mainTempElement = tempElements.find(
        (element) => element.tagName.toLowerCase() === 'h3' || element.closest('h3')
      );
      expect(mainTempElement).toBeInTheDocument();

      expect(screen.getByText(/istanbul/i)).toBeInTheDocument();
      expect(screen.getByText(/mainly clear/i)).toBeInTheDocument();

      // Check for forecast data
      expect(screen.getByText(/3-day forecast/i)).toBeInTheDocument();
      expect(screen.getAllByText(/clear sky/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/partly cloudy/i)).toBeInTheDocument();
      expect(screen.getByText(/overcast/i)).toBeInTheDocument();
    });
  });

  it('handles share location button click correctly', async () => {
    // Modify geolocation implementation to introduce a delay
    mockGeolocation.getCurrentPosition.mockImplementationOnce((successCallback) => {
      // Don't call the success callback immediately
      // We'll delay it to ensure the loading state is visible
      return new Promise((resolve) => {
        setTimeout(() => {
          successCallback({
            coords: {
              latitude: 41.0082,
              longitude: 28.9784,
            },
          });
          resolve();
        }, 100); // Small delay to ensure loading state is shown
      });
    });

    render(<WeatherWidget />);

    // Get and click the share location button
    const shareLocationBtn = screen.getByRole('button', { name: /share location/i });
    fireEvent.click(shareLocationBtn);

    // Verify getCurrentPosition was called
    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();

    // Verify loading state is shown after clicking button
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/loading weather data/i)).toBeInTheDocument();
    });
  });

  it('tries to request weather data when location permission is granted', async () => {
    mockPermission.state = 'granted';

    render(<WeatherWidget />);

    // Verify fetch was called with correct URL pattern
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/api\.open-meteo\.com.*latitude=41\.0082.*longitude=28\.9784/)
      );
    });
  });

  it('shows proper weather details including temperature, humidity and wind', async () => {
    mockPermission.state = 'granted';

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(
        screen.getByText(/feels like: 23°C \| humidity: 65% \| wind: 12 km\/h/i)
      ).toBeInTheDocument();
    });
  });

  it('processes weather codes correctly into conditions', async () => {
    // Create a custom mock with various weather codes
    const customWeatherData = {
      ...mockWeatherData,
      current: {
        ...mockWeatherData.current,
        weather_code: 95, // Thunderstorm
      },
      daily: {
        ...mockWeatherData.daily,
        weather_code: [61, 71, 80], // Slight rain, Slight snow fall, Slight rain showers
      },
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(customWeatherData),
    });

    mockPermission.state = 'granted';

    render(<WeatherWidget />);

    await waitFor(() => {
      expect(screen.getByText(/thunderstorm/i)).toBeInTheDocument();
      // Use getAllByText for the conditions that might appear multiple times or with similar text
      const rainElements = screen.getAllByText(/slight rain/i);
      expect(rainElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/slight snow fall/i)).toBeInTheDocument();
      // Use exact match for "Slight rain showers" to avoid conflation with "Slight rain"
      expect(screen.getByText('Slight rain showers')).toBeInTheDocument();
    });
  });
});
