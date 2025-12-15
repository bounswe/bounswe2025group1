import { supabase } from '../config/supabaseConfig';

/**
 * Get language-specific field name
 */
function getLangField(field, lang) {
  if (lang === 'en') return field;
  if (lang === 'tr') return `${field}_tr`;
  if (lang === 'ar') return `${field}_ar`;
  return field;
}

/**
 * Build select query with language-specific fields
 */
function buildSelectQuery(lang = 'en') {
  const baseFields = [
    'id',
    'name',
    'scientific_name',
    'type',
    'image',
    'description',
    'habitat',
    'sunlight',
    'soil',
    'notes',
    'difficulty',
    'season',
    'edible',
    'vegetable',
    'watering',
    'spacing',
    'climate_zone',
    'growth_duration',
    'common_problems',
    'companion_plants',
    'distribution',
    'growth_requirements',
    'growth_characteristics',
    'visual_characteristics',
    'images_detailed',
  ];

  const fields = [...baseFields];
  
  // Add language-specific fields if not English
  if (lang !== 'en') {
    fields.push(
      getLangField('name', lang),
      getLangField('description', lang),
      getLangField('habitat', lang),
      getLangField('soil', lang),
      getLangField('sunlight', lang),
      getLangField('watering', lang),
      getLangField('spacing', lang),
      getLangField('growth_duration', lang),
      getLangField('common_problems', lang),
      getLangField('companion_plants', lang)
    );
  }

  return fields.join(', ');
}

/**
 * Transform plant data to match frontend expectations
 */
function transformPlant(plant, lang = 'en') {
  if (!plant) return null;

  // Helper to get translated field
  const getField = (field) => {
    if (lang === 'en') return plant[field];
    const langField = getLangField(field, lang);
    return plant[langField] || plant[field];
  };

  return {
    id: plant.id,
    name: getField('name'),
    scientificName: plant.scientific_name,
    type: plant.type,
    image: plant.image,
    description: getField('description'),
    habitat: getField('habitat'),
    sunlight: getField('sunlight'),
    soil: getField('soil'),
    notes: plant.notes,
    difficulty: plant.difficulty,
    season: plant.season,
    edible: plant.edible,
    vegetable: plant.vegetable,
    watering: getField('watering') || plant.watering,
    spacing: getField('spacing') || plant.spacing,
    climateZone: plant.climate_zone,
    growthDuration: getField('growth_duration'),
    commonProblems: getField('common_problems') || plant.common_problems,
    companionPlants: getField('companion_plants') || plant.companion_plants,
    distribution: plant.distribution,
    growthRequirements: plant.growth_requirements,
    growthCharacteristics: plant.growth_characteristics,
    visualCharacteristics: plant.visual_characteristics,
    imagesDetailed: plant.images_detailed,
  };
}

/**
 * Fetch all plants with optional filters
 * @param {Object} params - Query parameters
 * @param {string} params.search - Search query (searches name and scientific_name)
 * @param {string} params.type - Filter by plant type
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.perPage - Items per page (default: 20)
 * @param {string} params.lang - Language code ('en', 'tr', 'ar')
 * @returns {Promise<Object>} - { data: plants[], total: number, page: number, perPage: number }
 */
export async function fetchPlants({ search, type, page = 1, perPage = 20, lang = 'en' } = {}) {
  try {
    let query = supabase
      .from('plants')
      .select(buildSelectQuery(lang), { count: 'exact' });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,scientific_name.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    // Order by name
    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching plants:', error);
      throw error;
    }

    return {
      data: data.map(plant => transformPlant(plant, lang)),
      total: count || 0,
      page,
      perPage,
    };
  } catch (error) {
    console.error('Error in fetchPlants:', error);
    throw error;
  }
}

/**
 * Fetch a single plant by ID
 * @param {string} id - Plant ID
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Promise<Object>} - Plant object
 */
export async function fetchPlantById(id, lang = 'en') {
  try {
    const { data, error } = await supabase
      .from('plants')
      .select(buildSelectQuery(lang))
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching plant:', error);
      throw error;
    }

    return transformPlant(data, lang);
  } catch (error) {
    console.error('Error in fetchPlantById:', error);
    throw error;
  }
}

/**
 * Fetch all soil types
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Promise<Array>} - Array of soil types
 */
export async function fetchSoilTypes(lang = 'en') {
  try {
    const fields = ['id', 'name', 'color', 'description'];
    if (lang !== 'en') {
      fields.push(
        getLangField('name', lang),
        getLangField('description', lang)
      );
    }

    const { data, error } = await supabase
      .from('soil_types')
      .select(fields.join(', '))
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching soil types:', error);
      throw error;
    }

    return data.map(soilType => ({
      id: soilType.id,
      name: lang === 'en' ? soilType.name : (soilType[getLangField('name', lang)] || soilType.name),
      color: soilType.color,
      description: lang === 'en' ? soilType.description : (soilType[getLangField('description', lang)] || soilType.description),
    }));
  } catch (error) {
    console.error('Error in fetchSoilTypes:', error);
    throw error;
  }
}

/**
 * Fetch all tools
 * @param {string} lang - Language code ('en', 'tr', 'ar')
 * @returns {Promise<Array>} - Array of tools
 */
export async function fetchTools(lang = 'en') {
  try {
    const fields = ['id', 'name', 'category', 'type', 'skill_level', 'image', 'description', 'uses', 'tips'];
    if (lang !== 'en') {
      fields.push(
        getLangField('name', lang),
        getLangField('category', lang),
        getLangField('type', lang),
        getLangField('skill_level', lang),
        getLangField('description', lang),
        getLangField('uses', lang),
        getLangField('tips', lang)
      );
    }

    const { data, error } = await supabase
      .from('tools')
      .select(fields.join(', '))
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }

    return data.map(tool => {
      const getField = (field) => {
        if (lang === 'en') return tool[field];
        const langField = getLangField(field, lang);
        return tool[langField] || tool[field];
      };

      return {
        id: tool.id,
        name: getField('name'),
        category: getField('category'),
        type: getField('type'),
        skillLevel: getField('skill_level'),
        image: tool.image,
        description: getField('description'),
        uses: getField('uses') || tool.uses,
        tips: getField('tips'),
      };
    });
  } catch (error) {
    console.error('Error in fetchTools:', error);
    throw error;
  }
}

