import { supabase } from '../config/supabaseConfig';

/**
 * Build select query - always uses English fields
 */
function buildSelectQuery() {
  return [
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
  ].join(', ');
}

/**
 * Transform plant data to match frontend expectations - always uses English fields
 */
function transformPlant(plant) {
  if (!plant) return null;

  return {
    id: plant.id,
    name: plant.name,
    scientificName: plant.scientific_name,
    type: plant.type,
    image: plant.image,
    description: plant.description,
    habitat: plant.habitat,
    sunlight: plant.sunlight,
    soil: plant.soil,
    notes: plant.notes,
    difficulty: plant.difficulty,
    season: plant.season,
    edible: plant.edible,
    vegetable: plant.vegetable,
    watering: plant.watering,
    spacing: plant.spacing,
    climateZone: plant.climate_zone,
    growthDuration: plant.growth_duration,
    commonProblems: plant.common_problems,
    companionPlants: plant.companion_plants,
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
 * @returns {Promise<Object>} - { data: plants[], total: number, page: number, perPage: number }
 */
export async function fetchPlants({ search, type, page = 1, perPage = 20 } = {}) {
  try {
    let query = supabase
      .from('plants')
      .select(buildSelectQuery(), { count: 'exact' });

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
      data: data.map(plant => transformPlant(plant)),
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
 * @returns {Promise<Object>} - Plant object
 */
export async function fetchPlantById(id) {
  try {
    const { data, error } = await supabase
      .from('plants')
      .select(buildSelectQuery())
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching plant:', error);
      throw error;
    }

    return transformPlant(data);
  } catch (error) {
    console.error('Error in fetchPlantById:', error);
    throw error;
  }
}

/**
 * Fetch all soil types
 * @returns {Promise<Array>} - Array of soil types
 */
export async function fetchSoilTypes() {
  try {
    const { data, error } = await supabase
      .from('soil_types')
      .select('id, name, color, description')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching soil types:', error);
      throw error;
    }

    return data.map(soilType => ({
      id: soilType.id,
      name: soilType.name,
      color: soilType.color,
      description: soilType.description,
    }));
  } catch (error) {
    console.error('Error in fetchSoilTypes:', error);
    throw error;
  }
}

/**
 * Fetch all tools
 * @returns {Promise<Array>} - Array of tools
 */
export async function fetchTools() {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id, name, category, type, skill_level, image, description, uses, tips')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching tools:', error);
      throw error;
    }

    return data.map(tool => ({
      id: tool.id,
      name: tool.name,
      category: tool.category,
      type: tool.type,
      skillLevel: tool.skill_level,
      image: tool.image,
      description: tool.description,
      uses: tool.uses,
      tips: tool.tips,
    }));
  } catch (error) {
    console.error('Error in fetchTools:', error);
    throw error;
  }
}

