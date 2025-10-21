import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Map as MapIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.svg',
  iconUrl: '/marker-icon.svg',
  shadowUrl: '/marker-shadow.svg',
});


// Custom marker icon
const createCustomIcon = (color = '#558b2f') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50% 50% 50% 0;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
  });
};

// Component to handle map clicks
const MapClickHandler = ({ onLocationSelect, selectedLocation }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng);
    },
  });
  return null;
};

const LocationPicker = ({
  value = '',
  onChange,
  onLocationChange,
  label = 'Location',
  required = false,
  error = false,
  helperText = '',
  disabled = false,
  placeholder = 'Select location on map or enter manually',
  initialCenter = [39.9334, 32.8597], // Ankara, Turkey as default
  initialZoom = 10,
  height = 300,
  showCurrentLocation = true,
  ...props
}) => {
  const { t, i18n } = useTranslation();
  const [isMapMode, setIsMapMode] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationText, setLocationText] = useState(value);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const mapRef = useRef(null);
  
  // Manual input fields
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [description, setDescription] = useState('');

  // Function to translate country names
  const translateCountryName = (countryName) => {
    if (!countryName) return '';
    
    // Handle Turkey/Türkiye translation
    if (countryName.toLowerCase().includes('turkey') || countryName.toLowerCase().includes('türkiye')) {
      return i18n.language === 'tr' ? 'Türkiye' : 'Turkey';
    }
    
    // Add more country translations as needed
    const countryTranslations = {
      'Turkey': i18n.language === 'tr' ? 'Türkiye' : 'Turkey',
      'Türkiye': i18n.language === 'tr' ? 'Türkiye' : 'Turkey',
      'United States': i18n.language === 'tr' ? 'Amerika Birleşik Devletleri' : 'United States',
      'Germany': i18n.language === 'tr' ? 'Almanya' : 'Germany',
      'France': i18n.language === 'tr' ? 'Fransa' : 'France',
      'United Kingdom': i18n.language === 'tr' ? 'Birleşik Krallık' : 'United Kingdom',
    };
    
    return countryTranslations[countryName] || countryName;
  };

  // Parse address into individual components
  const parseAddress = (address, structuredData = null) => {
    if (!address) return { country: '', city: '', district: '', street: '', description: '' };
    
    // Check if it's coordinates
    const coordMatch = address.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      return { country: '', city: '', district: '', street: '', description: '' };
    }
    
    // If we have structured data from Nominatim, use it for more accurate parsing
    if (structuredData && structuredData.address) {
      const addr = structuredData.address;
      return {
        country: translateCountryName(addr.country || ''),
        city: addr.city || addr.town || addr.village || addr.municipality || '',
        district: addr.suburb || addr.neighbourhood || addr.quarter || addr.district || '',
        street: addr.road || addr.street || addr.pedestrian || '',
        description: ''
      };
    }
    
    // Fallback to parsing display_name if no structured data
    let workingAddress = address;
    const result = { country: '', city: '', district: '', street: '', description: '' };
    
    // Look for description in parentheses
    let descriptionMatch = workingAddress.match(/\(([^)]+)\)$/);
    if (descriptionMatch) {
      result.description = descriptionMatch[1];
      // Remove description from main address for parsing
      workingAddress = workingAddress.replace(/\s*\([^)]+\)$/, '');
    }
    
    const parts = workingAddress.split(',').map(part => part.trim());
    
    // Enhanced parsing logic for Turkish addresses
    if (parts.length >= 1) {
      // Last part is usually country
      result.country = translateCountryName(parts[parts.length - 1] || '');
    }
    
    // Find city by looking for non-numeric parts that aren't obviously districts
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i] || '';
      // Skip if it's a postcode (5 digits for Turkey)
      if (/^\d{5}$/.test(part)) {
        continue;
      }
      // Skip if it's a district indicator
      if (part.toLowerCase().includes('mahallesi') || 
          part.toLowerCase().includes('mahalle') ||
          part.toLowerCase().includes('bölgesi') ||
          part.toLowerCase().includes('bölge')) {
        result.district = part;
        continue;
      }
      // This looks like a city
      if (part && !result.city) {
        result.city = part;
        break;
      }
    }
    
    // Find district if not already found
    if (!result.district) {
      for (let i = parts.length - 3; i >= 0; i--) {
        const part = parts[i] || '';
        if (part && part !== result.city && !/^\d{5}$/.test(part)) {
          result.district = part;
          break;
        }
      }
    }
    
    // Find street
    if (parts.length >= 4) {
      const firstPart = parts[0] || '';
      result.street = firstPart;
    }
    
    return result;
  };

  // Simple initialization from value
  useEffect(() => {
    if (value) {
      // Check if value contains coordinates
      const coordMatch = value.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setSelectedLocation({ lat, lng });
          setLocationText(value);
        }
      } else {
        setLocationText(value);
        // Parse address into individual fields for text mode
        const parsedAddress = parseAddress(value);
        setCountry(parsedAddress.country);
        setCity(parsedAddress.city);
        setDistrict(parsedAddress.district);
        setStreet(parsedAddress.street);
        setDescription(parsedAddress.description);
      }
    }
  }, [value]);

  // Update country name when language changes
  useEffect(() => {
    if (country) {
      const translatedCountry = translateCountryName(country);
      if (translatedCountry !== country) {
        setCountry(translatedCountry);
        
        // Update the full address text if it contains the country
        if (locationText && locationText.includes(country)) {
          const updatedLocationText = locationText.replace(country, translatedCountry);
          setLocationText(updatedLocationText);
          onChange?.(updatedLocationText);
        }
      }
    }
  }, [i18n.language]);

  // Handle location selection from map
  const handleLocationSelect = async (latlng) => {
    const { lat, lng } = latlng;
    setSelectedLocation({ lat, lng });
    setIsLoadingLocation(true);
    setLocationError('');

    // First, set coordinates immediately for faster feedback
    const coordText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    setLocationText(coordText);
    onChange?.(coordText);
    onLocationChange?.({ lat, lng, address: coordText });

    try {
      // Reverse geocoding to get address with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const language = i18n.language === 'tr' ? 'tr' : 'en';
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18&accept-language=${language}`,
        { 
          signal: controller.signal,
          headers: {
            'User-Agent': 'CommunityGardenApp/1.0',
            'Accept-Language': language
          }
        }
      );
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data && data.display_name) {
        let address = data.display_name;
        
        // Apply country name translation to the display address
        if (address.includes('Turkey')) {
          address = address.replace(/Turkey/g, translateCountryName('Turkey'));
        }
        
        setLocationText(address);
        onChange?.(address);
        onLocationChange?.({ lat, lng, address });
        
        // Parse the structured address data for text mode
        const parsedAddress = parseAddress(address, data);
        setCountry(parsedAddress.country);
        setCity(parsedAddress.city);
        setDistrict(parsedAddress.district);
        setStreet(parsedAddress.street);
        setDescription(parsedAddress.description);
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      // Keep the coordinates as fallback
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle manual text input
  const handleTextChange = (event) => {
    const newValue = event.target.value;
    setLocationText(newValue);
    onChange?.(newValue);
    
    // Try to parse coordinates from text
    const coordMatch = newValue.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({ lat, lng });
        onLocationChange?.({ lat, lng, address: newValue });
      }
    }
  };



  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('location.geolocationNotSupported'));
      return;
    }

    setIsLoadingLocation(true);
    setLocationError('');

    // Set a timeout to show progress
    const timeoutId = setTimeout(() => {
      if (isLoadingLocation) {
        setLocationError(t('location.locationDetectionSlow'));
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setCurrentLocation(location);
        handleLocationSelect(location);
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Error getting location:', error);
        let errorMessage = t('location.unableToRetrieve') + ' ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += t('location.permissionDenied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += t('location.positionUnavailable');
            break;
          case error.TIMEOUT:
            errorMessage += t('location.timeout');
            break;
          default:
            errorMessage += t('location.tryAgain');
            break;
        }
        
        setLocationError(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds timeout
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  // Center map on selected location
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      mapRef.current.setView([selectedLocation.lat, selectedLocation.lng], 15);
    }
  }, [selectedLocation]);

  const mapCenter = selectedLocation || currentLocation || initialCenter;

  return (
    <Box {...props}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" component="label" htmlFor="location-picker">
          {label} {required && '*'}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isMapMode}
              onChange={(e) => setIsMapMode(e.target.checked)}
              color="primary"
              disabled={disabled}
            />
          }
          label={isMapMode ? t('location.mapMode') : t('location.textMode')}
          labelPlacement="start"
        />
      </Box>

      {isMapMode ? (
        <Paper elevation={2} sx={{ mb: 2, overflow: 'hidden', position: 'relative' }}>
          <Box sx={{ 
            height: typeof height === 'object' ? height : height, 
            position: 'relative',
            minHeight: { xs: 200, sm: 250 },
            maxHeight: { xs: 300, sm: 400, md: 500 }
          }}>
            <MapContainer
              center={mapCenter}
              zoom={initialZoom}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} selectedLocation={selectedLocation} />
              {selectedLocation && (
                <Marker
                  position={[selectedLocation.lat, selectedLocation.lng]}
                  icon={createCustomIcon('#558b2f')}
                >
                  <Popup>
                    <Typography variant="body2">
                      {t('location.selectedLocation')}
                      <br />
                      {locationText || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                    </Typography>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </Box>
          
          {showCurrentLocation && (
            <Tooltip title={t('location.useCurrentLocation')}>
              <IconButton
                onClick={getCurrentLocation}
                disabled={isLoadingLocation || disabled}
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  zIndex: 1000,
                  backgroundColor: '#558b2f',
                  color: 'white',
                  boxShadow: 3,
                  border: '2px solid white',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: '#33691e',
                    transform: 'scale(1.1)',
                    boxShadow: 4,
                  },
                  '&:disabled': {
                    backgroundColor: '#bdbdbd',
                    color: '#757575',
                  },
                }}
              >
                {isLoadingLocation ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <MyLocationIcon />
                )}
              </IconButton>
            </Tooltip>
          )}
          
          <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon color="action" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {t('location.mapInstructions')}
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              value={locationText}
              onChange={handleTextChange}
              placeholder={t('location.selectedLocationPlaceholder')}
              disabled={disabled}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Paper>
      ) : (
            <Paper elevation={1} sx={{ p: 1, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('location.country')}
                    placeholder={t('location.countryPlaceholder')}
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      // Auto-save
                      const addressParts = [street, district, city, e.target.value].filter(Boolean);
                      const fullAddress = addressParts.join(', ');
                      const finalAddress = description ? `${fullAddress} (${description})` : fullAddress;
                      onChange?.(finalAddress);
                    }}
                    disabled={disabled}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('location.city')}
                    placeholder={t('location.cityPlaceholder')}
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      // Auto-save
                      const addressParts = [street, district, e.target.value, country].filter(Boolean);
                      const fullAddress = addressParts.join(', ');
                      const finalAddress = description ? `${fullAddress} (${description})` : fullAddress;
                      onChange?.(finalAddress);
                    }}
                    disabled={disabled}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('location.district')}
                    placeholder={t('location.districtPlaceholder')}
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      // Auto-save
                      const addressParts = [street, e.target.value, city, country].filter(Boolean);
                      const fullAddress = addressParts.join(', ');
                      const finalAddress = description ? `${fullAddress} (${description})` : fullAddress;
                      onChange?.(finalAddress);
                    }}
                    disabled={disabled}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={t('location.street')}
                    placeholder={t('location.streetPlaceholder')}
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      // Auto-save
                      const addressParts = [e.target.value, district, city, country].filter(Boolean);
                      const fullAddress = addressParts.join(', ');
                      const finalAddress = description ? `${fullAddress} (${description})` : fullAddress;
                      onChange?.(finalAddress);
                    }}
                    disabled={disabled}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label={t('location.description')}
                    placeholder={t('location.descriptionPlaceholder')}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      // Auto-save
                      const addressParts = [street, district, city, country].filter(Boolean);
                      const fullAddress = addressParts.join(', ');
                      const finalAddress = e.target.value ? `${fullAddress} (${e.target.value})` : fullAddress;
                      onChange?.(finalAddress);
                    }}
                    disabled={disabled}
                    multiline
                    rows={2}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EditIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
        </Paper>
      )}

      {locationError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {locationError}
        </Alert>
      )}

      {isLoadingLocation && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {locationText && locationText.includes(',') 
              ? t('location.gettingAddressDetails') 
              : t('location.gettingLocation')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default LocationPicker;

