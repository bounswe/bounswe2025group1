/**
 * Utility functions for location and address handling
 */

/**
 * Translates country names in location strings based on current language
 * @param {string} location - The location string that may contain country names
 * @param {string} language - Current language ('tr' for Turkish, 'en' for English)
 * @returns {string} - Location string with translated country names
 */
export const translateLocationString = (location, language) => {
  if (!location || typeof location !== 'string') return location || '';
  
  // Country and region name translations
  const locationTranslations = {
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
    'Italy': language === 'tr' ? 'İtalya' : 'Italy',
    'İtalya': language === 'tr' ? 'İtalya' : 'Italy',
    'Spain': language === 'tr' ? 'İspanya' : 'Spain',
    'İspanya': language === 'tr' ? 'İspanya' : 'Spain',
    'Greece': language === 'tr' ? 'Yunanistan' : 'Greece',
    'Yunanistan': language === 'tr' ? 'Yunanistan' : 'Greece',
    
    // Turkish Regions
    'Marmara Region': language === 'tr' ? 'Marmara Bölgesi' : 'Marmara Region',
    'Marmara Bölgesi': language === 'tr' ? 'Marmara Bölgesi' : 'Marmara Region',
    'Central Anatolia Region': language === 'tr' ? 'İç Anadolu Bölgesi' : 'Central Anatolia Region',
    'İç Anadolu Bölgesi': language === 'tr' ? 'İç Anadolu Bölgesi' : 'Central Anatolia Region',
    'Aegean Region': language === 'tr' ? 'Ege Bölgesi' : 'Aegean Region',
    'Ege Bölgesi': language === 'tr' ? 'Ege Bölgesi' : 'Aegean Region',
    'Mediterranean Region': language === 'tr' ? 'Akdeniz Bölgesi' : 'Mediterranean Region',
    'Akdeniz Bölgesi': language === 'tr' ? 'Akdeniz Bölgesi' : 'Mediterranean Region',
    'Black Sea Region': language === 'tr' ? 'Karadeniz Bölgesi' : 'Black Sea Region',
    'Karadeniz Bölgesi': language === 'tr' ? 'Karadeniz Bölgesi' : 'Black Sea Region',
    'Eastern Anatolia Region': language === 'tr' ? 'Doğu Anadolu Bölgesi' : 'Eastern Anatolia Region',
    'Doğu Anadolu Bölgesi': language === 'tr' ? 'Doğu Anadolu Bölgesi' : 'Eastern Anatolia Region',
    'Southeastern Anatolia Region': language === 'tr' ? 'Güneydoğu Anadolu Bölgesi' : 'Southeastern Anatolia Region',
    'Güneydoğu Anadolu Bölgesi': language === 'tr' ? 'Güneydoğu Anadolu Bölgesi' : 'Southeastern Anatolia Region',
  };
  
  let translatedLocation = location;
  
  // Apply translations for each location name found in the location string
  Object.entries(locationTranslations).forEach(([original, translated]) => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${original}\\b`, 'gi');
    translatedLocation = translatedLocation.replace(regex, translated);
  });
  
  return translatedLocation;
};

/**
 * Translates a single country name
 * @param {string} countryName - The country name to translate
 * @param {string} language - Current language ('tr' for Turkish, 'en' for English)
 * @returns {string} - Translated country name
 */
export const translateCountryName = (countryName, language) => {
  if (!countryName) return '';
  
  // Handle Turkey/Türkiye translation specifically
  if (countryName.toLowerCase().includes('turkey') || countryName.toLowerCase().includes('türkiye')) {
    return language === 'tr' ? 'Türkiye' : 'Turkey';
  }
  
  // Use a simplified translation map for individual country names
  const countryTranslations = {
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
