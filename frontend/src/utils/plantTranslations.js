// Helper utility for getting translated plant data
// This function retrieves translated values from plant objects based on current language

/**
 * Get translated value from a plant field
 * @param {Object} plant - Plant object
 * @param {string} field - Field name (e.g., 'name', 'description')
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {string} Translated value or fallback to English
 */
export const getTranslatedField = (plant, field, lang = 'en') => {
  if (!plant) return '';
  
  // If English or field doesn't exist, return default
  if (lang === 'en' || !plant[`${field}_${lang}`]) {
    return plant[field] || '';
  }
  
  return plant[`${field}_${lang}`] || plant[field] || '';
};

/**
 * Get translated object (for nested objects like watering, spacing, etc.)
 * @param {Object} plant - Plant object
 * @param {string} field - Field name (e.g., 'watering', 'spacing')
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Object} Translated object or fallback to English
 */
export const getTranslatedObject = (plant, field, lang = 'en') => {
  if (!plant) return {};
  
  // If English or translated version doesn't exist, return default
  if (lang === 'en' || !plant[`${field}_${lang}`]) {
    return plant[field] || {};
  }
  
  return plant[`${field}_${lang}`] || plant[field] || {};
};

/**
 * Get translated array (for arrays like commonProblems, companionPlants arrays)
 * @param {Object} plant - Plant object
 * @param {string} field - Field name (e.g., 'commonProblems')
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Array} Translated array or fallback to English
 */
export const getTranslatedArray = (plant, field, lang = 'en') => {
  if (!plant) return [];
  
  // If English or translated version doesn't exist, return default
  if (lang === 'en' || !plant[`${field}_${lang}`]) {
    return plant[field] || [];
  }
  
  return plant[`${field}_${lang}`] || plant[field] || [];
};

/**
 * Get translated companion plants object
 * @param {Object} plant - Plant object
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Object} Translated companion plants object
 */
export const getTranslatedCompanionPlants = (plant, lang = 'en') => {
  if (!plant || !plant.companionPlants) return { growsWellWith: [], avoidNear: [] };
  
  if (lang === 'en' || !plant.companionPlants_tr || !plant.companionPlants_ar) {
    return plant.companionPlants || { growsWellWith: [], avoidNear: [] };
  }
  
  const translated = lang === 'tr' ? plant.companionPlants_tr : plant.companionPlants_ar;
  return translated || plant.companionPlants || { growsWellWith: [], avoidNear: [] };
};




