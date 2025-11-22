import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
} from 'react-native';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAccessibleColors } from '../../contexts/AccessibilityContextSimple';
import {
  getUserCurrentLocation,
  reverseGeocode,
  Coordinates,
  LocationData,
} from '../../utils/locationUtils';

interface LocationPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onLocationChange?: (data: LocationData) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  initialCenter?: Coordinates;
  initialZoom?: number;
  showCurrentLocation?: boolean;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value = '',
  onChange,
  onLocationChange,
  label = 'Location',
  required = false,
  disabled = false,
  placeholder = 'Select location on map or enter manually',
  initialCenter = { lat: 39.9334, lng: 32.8597 }, // Ankara, Turkey
  initialZoom = 10,
  showCurrentLocation = true,
}) => {
  const { t, i18n } = useTranslation();
  const colors = useAccessibleColors();
  const mapRef = useRef<MapView>(null);

  const [isMapMode, setIsMapMode] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [locationText, setLocationText] = useState(value);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Manual input fields
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [description, setDescription] = useState('');

  // Initialize from value
  useEffect(() => {
    if (value) {
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
        // Parse address into fields for text mode
        const parts = value.split(',').map(part => part.trim());
        if (parts.length >= 1) {
          setCountry(parts[parts.length - 1] || '');
        }
        if (parts.length >= 2) {
          setCity(parts[parts.length - 2] || '');
        }
        if (parts.length >= 3) {
          setDistrict(parts[parts.length - 3] || '');
        }
        if (parts.length >= 4) {
          setStreet(parts[0] || '');
        }
      }
    }
  }, [value]);

  // Handle map press to select location
  const handleMapPress = async (event: MapPressEvent) => {
    if (disabled) return;

    const { latitude, longitude } = event.nativeEvent.coordinate;
    const coords: Coordinates = { lat: latitude, lng: longitude };
    setSelectedLocation(coords);
    setIsLoadingLocation(true);
    setLocationError('');

    // Set coordinates immediately
    const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    setLocationText(coordText);
    onChange?.(coordText);
    onLocationChange?.({ lat: latitude, lng: longitude, address: coordText });

    try {
      // Reverse geocode to get address
      const language = i18n.language === 'tr' ? 'tr' : 'en';
      const address = await reverseGeocode(latitude, longitude, language);

      if (address) {
        setLocationText(address);
        onChange?.(address);
        onLocationChange?.({ lat: latitude, lng: longitude, address });

        // Parse address for text mode fields
        const parts = address.split(',').map(part => part.trim());
        if (parts.length >= 1) setCountry(parts[parts.length - 1] || '');
        if (parts.length >= 2) setCity(parts[parts.length - 2] || '');
        if (parts.length >= 3) setDistrict(parts[parts.length - 3] || '');
        if (parts.length >= 4) setStreet(parts[0] || '');
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    if (disabled) return;

    setIsLoadingLocation(true);
    setLocationError('');

    try {
      const coords = await getUserCurrentLocation();

      if (!coords) {
        setLocationError(t('location.permissionDenied') || 'Location permission denied');
        setIsLoadingLocation(false);
        return;
      }

      setSelectedLocation(coords);

      // Animate map to current location
      mapRef.current?.animateToRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Get address for the location
      const language = i18n.language === 'tr' ? 'tr' : 'en';
      const address = await reverseGeocode(coords.lat, coords.lng, language);

      if (address) {
        setLocationText(address);
        onChange?.(address);
        onLocationChange?.({ ...coords, address });

        // Parse address for text mode fields
        const parts = address.split(',').map(part => part.trim());
        if (parts.length >= 1) setCountry(parts[parts.length - 1] || '');
        if (parts.length >= 2) setCity(parts[parts.length - 2] || '');
        if (parts.length >= 3) setDistrict(parts[parts.length - 3] || '');
        if (parts.length >= 4) setStreet(parts[0] || '');
      } else {
        const coordText = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
        setLocationText(coordText);
        onChange?.(coordText);
        onLocationChange?.({ ...coords, address: coordText });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setLocationError(t('location.unableToRetrieve') || 'Unable to retrieve location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle manual text input changes
  const handleTextChange = (text: string) => {
    setLocationText(text);
    onChange?.(text);

    // Try to parse coordinates from text
    const coordMatch = text.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSelectedLocation({ lat, lng });
        onLocationChange?.({ lat, lng, address: text });
      }
    }
  };

  // Build address from manual input fields
  const buildAddressFromFields = () => {
    const addressParts = [street, district, city, country].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    const finalAddress = description ? `${fullAddress} (${description})` : fullAddress;
    return finalAddress;
  };

  // Handle field changes in text mode
  const updateFieldAndAddress = (
    field: 'country' | 'city' | 'district' | 'street' | 'description',
    value: string
  ) => {
    switch (field) {
      case 'country':
        setCountry(value);
        break;
      case 'city':
        setCity(value);
        break;
      case 'district':
        setDistrict(value);
        break;
      case 'street':
        setStreet(value);
        break;
      case 'description':
        setDescription(value);
        break;
    }

    // Use setTimeout to ensure state is updated before building address
    setTimeout(() => {
      const tempCountry = field === 'country' ? value : country;
      const tempCity = field === 'city' ? value : city;
      const tempDistrict = field === 'district' ? value : district;
      const tempStreet = field === 'street' ? value : street;
      const tempDescription = field === 'description' ? value : description;

      const addressParts = [tempStreet, tempDistrict, tempCity, tempCountry].filter(Boolean);
      const fullAddress = addressParts.join(', ');
      const finalAddress = tempDescription ? `${fullAddress} (${tempDescription})` : fullAddress;

      setLocationText(finalAddress);
      onChange?.(finalAddress);
    }, 0);
  };

  const mapRegion: Region = selectedLocation
    ? {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: initialCenter.lat,
        longitude: initialCenter.lng,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      {/* Header with label and mode switch */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.text }]}>
          {label} {required && '*'}
        </Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: colors.textSecondary }]}>
            {isMapMode ? t('location.mapMode') || 'Map' : t('location.textMode') || 'Text'}
          </Text>
          <Switch
            value={isMapMode}
            onValueChange={setIsMapMode}
            disabled={disabled}
            thumbColor={isMapMode ? colors.primary : colors.textSecondary}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {isMapMode ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={handleMapPress}
          >
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.lat,
                  longitude: selectedLocation.lng,
                }}
                pinColor="#558b2f"
              />
            )}
          </MapView>

          {/* Current location button */}
          {showCurrentLocation && (
            <TouchableOpacity
              style={[styles.currentLocationButton, { backgroundColor: colors.primary }]}
              onPress={getCurrentLocation}
              disabled={isLoadingLocation || disabled}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="locate" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          )}

          {/* Location text display/input */}
          <View style={[styles.locationInputContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.locationInputHeader}>
              <Ionicons name="location" size={16} color={colors.textSecondary} />
              <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
                {t('location.mapInstructions') || 'Tap on the map to select a location'}
              </Text>
            </View>
            <TextInput
              style={[
                styles.locationInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={locationText}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              editable={!disabled}
              multiline
            />
          </View>
        </View>
      ) : (
        <View style={[styles.textModeContainer, { backgroundColor: colors.surface }]}>
          {/* Country */}
          <TextInput
            style={[
              styles.fieldInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('location.countryPlaceholder') || 'Country'}
            placeholderTextColor={colors.textSecondary}
            value={country}
            onChangeText={(text) => updateFieldAndAddress('country', text)}
            editable={!disabled}
          />

          {/* City */}
          <TextInput
            style={[
              styles.fieldInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('location.cityPlaceholder') || 'City'}
            placeholderTextColor={colors.textSecondary}
            value={city}
            onChangeText={(text) => updateFieldAndAddress('city', text)}
            editable={!disabled}
          />

          {/* District */}
          <TextInput
            style={[
              styles.fieldInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('location.districtPlaceholder') || 'District'}
            placeholderTextColor={colors.textSecondary}
            value={district}
            onChangeText={(text) => updateFieldAndAddress('district', text)}
            editable={!disabled}
          />

          {/* Street */}
          <TextInput
            style={[
              styles.fieldInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('location.streetPlaceholder') || 'Street'}
            placeholderTextColor={colors.textSecondary}
            value={street}
            onChangeText={(text) => updateFieldAndAddress('street', text)}
            editable={!disabled}
          />

          {/* Description */}
          <TextInput
            style={[
              styles.fieldInput,
              styles.descriptionInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t('location.descriptionPlaceholder') || 'Additional description (optional)'}
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={(text) => updateFieldAndAddress('description', text)}
            editable={!disabled}
            multiline
          />
        </View>
      )}

      {/* Error message */}
      {locationError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#d32f2f" />
          <Text style={styles.errorText}>{locationError}</Text>
        </View>
      ) : null}

      {/* Loading indicator */}
      {isLoadingLocation && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {locationText && locationText.includes(',')
              ? t('location.gettingAddressDetails') || 'Getting address details...'
              : t('location.gettingLocation') || 'Getting location...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 12,
    marginRight: 8,
  },
  mapContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    height: 250,
    width: '100%',
  },
  currentLocationButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationInputContainer: {
    padding: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  locationInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    marginLeft: 4,
  },
  locationInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
  },
  textModeContainer: {
    padding: 12,
    borderRadius: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  descriptionInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    fontSize: 12,
    marginLeft: 8,
  },
});

export default LocationPicker;
