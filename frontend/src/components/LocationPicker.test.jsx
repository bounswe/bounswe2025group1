import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LocationPicker from './LocationPicker';

// Mock MUI icons to avoid EMFILE errors
vi.mock('@mui/icons-material', () => ({
  Map: () => <div data-testid="map-icon" />,
  LocationOn: () => <div data-testid="location-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  MyLocation: () => <div data-testid="my-location-icon" />,
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en' },
  }),
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMapEvents: ({ click }) => {
    // Expose click handler to global for testing if needed, or just mock it
    // Better: create a button to trigger click
    return null;
  },
}));

// Mock Leaflet
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        mergeOptions: vi.fn(),
        prototype: { _getIconUrl: vi.fn() },
      },
    },
    divIcon: vi.fn(),
  },
}));

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};
global.navigator.geolocation = mockGeolocation;

describe('LocationPicker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in map mode by default', () => {
    render(<LocationPicker />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByText('location.mapMode')).toBeInTheDocument();
  });

  it('switches to text mode', () => {
    render(<LocationPicker />);
    const switchControl = screen.getByTestId('location-mode-switch');
    fireEvent.click(switchControl);

    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
    expect(screen.getByText('location.textMode')).toBeInTheDocument();
    expect(screen.getByLabelText('location.country')).toBeInTheDocument();
  });

  it('handles manual text input in text mode', () => {
    const handleChange = vi.fn();
    render(<LocationPicker onChange={handleChange} />);

    // Switch to text mode
    fireEvent.click(screen.getByTestId('location-mode-switch'));

    const cityInput = screen.getByLabelText('location.city');
    fireEvent.change(cityInput, { target: { value: 'Istanbul' } });

    expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('Istanbul'));
  });

  it('parses initial value correctly', () => {
    render(<LocationPicker value="Istanbul, Turkey" />);

    // Switch to text mode to check fields
    fireEvent.click(screen.getByTestId('location-mode-switch'));

    expect(screen.getByLabelText('location.city')).toHaveValue('Istanbul');
    expect(screen.getByLabelText('location.country')).toHaveValue('Turkey');
  });

  it('handles geolocation success', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 41.0082,
          longitude: 28.9784,
        },
      });
    });

    render(<LocationPicker showCurrentLocation={true} />);

    const locationButton = screen.getByRole('button'); // The tooltip button
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
      error({
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation',
      });
    });

    render(<LocationPicker showCurrentLocation={true} />);

    const locationButton = screen.getByRole('button');
    fireEvent.click(locationButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('updates when value prop changes', () => {
    const { rerender } = render(<LocationPicker value="" />);

    rerender(<LocationPicker value="Ankara, Turkey" />);

    fireEvent.click(screen.getByTestId('location-mode-switch')); // Switch to text mode
    expect(screen.getByLabelText('location.city')).toHaveValue('Ankara');
  });
});
