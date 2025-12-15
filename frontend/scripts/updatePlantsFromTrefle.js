import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trefle API configuration
const TREFLE_API_BASE = 'https://trefle.io/api/v1';
const TREFLE_API_TOKEN = process.env.TREFLE_API_TOKEN || process.argv[2];

if (!TREFLE_API_TOKEN) {
  console.error('Error: Trefle API token is required.');
  console.error('Usage: TREFLE_API_TOKEN=your_token node scripts/updatePlantsFromTrefle.js');
  console.error('   or: node scripts/updatePlantsFromTrefle.js your_token');
  process.exit(1);
}

// Rate limiting: Trefle API allows 50 requests per minute max
// We'll use ~1.3 seconds between requests = ~45 requests/minute (safe margin)
const REQUEST_DELAY_MS = 1300; // 1.3 seconds = ~45 requests/minute
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Track requests per minute to ensure we don't exceed limits
let requestCount = 0;
let minuteStartTime = Date.now();

async function rateLimitedRequest(fn) {
  const now = Date.now();
  
  // Reset counter if a minute has passed
  if (now - minuteStartTime >= 60000) {
    requestCount = 0;
    minuteStartTime = now;
  }
  
  // If we've made 50 requests in this minute, wait until the next minute
  if (requestCount >= 50) {
    const waitTime = 60000 - (now - minuteStartTime) + 100; // Add 100ms buffer
    console.log(`  ⏳ Rate limit reached (50/min). Waiting ${Math.ceil(waitTime/1000)}s...`);
    await delay(waitTime);
    requestCount = 0;
    minuteStartTime = Date.now();
  }
  
  requestCount++;
  const result = await fn();
  
  // Wait after each request to space them out (except if we just waited for rate limit)
  if (requestCount < 50) {
    await delay(REQUEST_DELAY_MS);
  }
  
  return result;
}

// Fetch data from Trefle API
async function fetchTrefleData(url) {
  return rateLimitedRequest(async () => {
    try {
      const response = await fetch(`${url}?token=${TREFLE_API_TOKEN}`);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        if (response.status === 429) {
          console.error(`  ⚠️ Rate limit exceeded. Waiting 60 seconds...`);
          await delay(60000);
          // Retry once
          const retryResponse = await fetch(`${url}?token=${TREFLE_API_TOKEN}`);
          if (!retryResponse.ok) {
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          return await retryResponse.json();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message);
      return null;
    }
  });
}

// Search for a plant in Trefle
async function searchPlant(query, exactMatch = false) {
  return rateLimitedRequest(async () => {
    const url = `${TREFLE_API_BASE}/plants/search`;
    const response = await fetch(`${url}?token=${TREFLE_API_TOKEN}&q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error(`  ⚠️ Rate limit exceeded. Waiting 60 seconds...`);
        await delay(60000);
        // Retry once
        const retryResponse = await fetch(`${url}?token=${TREFLE_API_TOKEN}&q=${encodeURIComponent(query)}`);
        if (!retryResponse.ok) {
          return null;
        }
        const retryData = await retryResponse.json();
        if (retryData.data && retryData.data.length > 0) {
          if (exactMatch) {
            const exact = retryData.data.find(
              plant => plant.scientific_name?.toLowerCase() === query.toLowerCase()
            );
            if (exact) return exact;
          }
          return retryData.data[0];
        }
        return null;
      }
      return null;
    }
    
    const data = await response.json();
    if (data.data && data.data.length > 0) {
      if (exactMatch) {
        // Try to find exact match by scientific name
        const exact = data.data.find(
          plant => plant.scientific_name?.toLowerCase() === query.toLowerCase()
        );
        if (exact) return exact;
      }
      // Return the first result
      return data.data[0];
    }
    return null;
  });
}

// Get detailed species information
async function getSpeciesDetails(slug) {
  const url = `${TREFLE_API_BASE}/species/${slug}`;
  return await fetchTrefleData(url);
}

// Helper function to clean empty values from object
function cleanObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.filter(item => item !== null && item !== undefined && item !== '');
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip null, undefined, empty strings, empty arrays, empty objects
    if (value === null || value === undefined || value === '') continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) continue;
    
    // Recursively clean nested objects
    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanObject(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else if (Array.isArray(value)) {
      const cleanedArray = cleanObject(value);
      if (cleanedArray.length > 0) {
        cleaned[key] = cleanedArray;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

// Map Trefle data to our plant structure
function mapTrefleToPlant(trefleData, existingPlant) {
  if (!trefleData || !trefleData.data) {
    return existingPlant;
  }

  const species = trefleData.data;
  const updatedPlant = { ...existingPlant };

  // Update image with real URL from Trefle
  if (species.image_url) {
    updatedPlant.image = species.image_url;
  } else if (species.images && species.images.habit && species.images.habit.length > 0) {
    updatedPlant.image = species.images.habit[0].image_url;
  } else if (species.images && species.images.flower && species.images.flower.length > 0) {
    updatedPlant.image = species.images.flower[0].image_url;
  } else if (species.images && species.images.leaf && species.images.leaf.length > 0) {
    updatedPlant.image = species.images.leaf[0].image_url;
  }

  // Update scientific name if more specific
  if (species.scientific_name && species.scientific_name !== existingPlant.scientificName) {
    // Only update if the new name is more specific (contains the old name)
    if (species.scientific_name.toLowerCase().includes(existingPlant.scientificName.toLowerCase())) {
      updatedPlant.scientificName = species.scientific_name;
    }
  }

  // Update description with observations if available
  if (species.observations && !existingPlant.description.includes(species.observations)) {
    updatedPlant.description = `${existingPlant.description} Found in: ${species.observations}.`;
  }

  // Update habitat information
  if (species.observations) {
    updatedPlant.habitat = `${existingPlant.habitat || ''} Native to: ${species.observations}.`.trim();
  }

  // Add edibility and safety data
  if (species.edible !== undefined && species.edible !== null) {
    updatedPlant.edible = species.edible;
  }
  if (species.edible_part && species.edible_part.length > 0) {
    updatedPlant.edibleParts = species.edible_part.filter(p => p); // Remove nulls
  }
  if (species.specifications?.toxicity) {
    updatedPlant.toxicity = species.specifications.toxicity;
  }
  if (species.vegetable !== undefined && species.vegetable !== null) {
    updatedPlant.vegetable = species.vegetable;
  }

  // Add growth requirements
  if (species.growth) {
    const growthReqs = {};
    
    if (species.growth.light !== undefined && species.growth.light !== null) {
      growthReqs.light = species.growth.light;
    }
    if (species.growth.atmospheric_humidity !== undefined && species.growth.atmospheric_humidity !== null) {
      growthReqs.atmosphericHumidity = species.growth.atmospheric_humidity;
    }
    
    if (species.growth.ph_minimum !== undefined || species.growth.ph_maximum !== undefined) {
      growthReqs.ph = {
        min: species.growth.ph_minimum,
        max: species.growth.ph_maximum
      };
    }
    
    if (species.growth.minimum_temperature || species.growth.maximum_temperature) {
      growthReqs.temperature = {
        min: species.growth.minimum_temperature ? {
          c: species.growth.minimum_temperature.deg_c,
          f: species.growth.minimum_temperature.deg_f
        } : null,
        max: species.growth.maximum_temperature ? {
          c: species.growth.maximum_temperature.deg_c,
          f: species.growth.maximum_temperature.deg_f
        } : null
      };
    }
    
    if (species.growth.minimum_precipitation_mm !== undefined || species.growth.maximum_precipitation_mm !== undefined) {
      growthReqs.precipitation = {
        min: species.growth.minimum_precipitation_mm,
        max: species.growth.maximum_precipitation_mm
      };
    }
    
    const soil = {};
    if (species.growth.soil_nutriments !== undefined && species.growth.soil_nutriments !== null) soil.nutriments = species.growth.soil_nutriments;
    if (species.growth.soil_salinity !== undefined && species.growth.soil_salinity !== null) soil.salinity = species.growth.soil_salinity;
    if (species.growth.soil_texture !== undefined && species.growth.soil_texture !== null) soil.texture = species.growth.soil_texture;
    if (species.growth.soil_humidity !== undefined && species.growth.soil_humidity !== null) soil.humidity = species.growth.soil_humidity;
    if (Object.keys(soil).length > 0) {
      growthReqs.soil = soil;
    }
    
    if (species.growth.minimum_root_depth_cm !== undefined && species.growth.minimum_root_depth_cm !== null) {
      growthReqs.rootDepth = species.growth.minimum_root_depth_cm;
    }
    
    if (Object.keys(growthReqs).length > 0) {
      updatedPlant.growthRequirements = growthReqs;
    }
  }

  // Add growth characteristics
  const growthChars = {};
  
  if (species.duration && species.duration.length > 0) {
    growthChars.duration = species.duration.filter(d => d);
  }
  if (species.growth?.days_to_harvest !== undefined && species.growth.days_to_harvest !== null) {
    growthChars.daysToHarvest = species.growth.days_to_harvest;
  }
  if (species.specifications?.growth_rate) {
    growthChars.rate = species.specifications.growth_rate;
  }
  if (species.specifications?.growth_form) {
    growthChars.form = species.specifications.growth_form;
  }
  if (species.specifications?.growth_habit) {
    growthChars.habit = species.specifications.growth_habit;
  }
  
  if (species.specifications?.average_height?.cm !== undefined || species.specifications?.maximum_height?.cm !== undefined) {
    growthChars.height = {
      average: species.specifications?.average_height?.cm,
      maximum: species.specifications?.maximum_height?.cm
    };
  }
  
  if (species.specifications?.ligneous_type) {
    growthChars.ligneousType = species.specifications.ligneous_type;
  }
  if (species.growth?.growth_months && species.growth.growth_months.length > 0) {
    growthChars.growthMonths = species.growth.growth_months.filter(m => m);
  }
  if (species.growth?.bloom_months && species.growth.bloom_months.length > 0) {
    growthChars.bloomMonths = species.growth.bloom_months.filter(m => m);
  }
  if (species.growth?.fruit_months && species.growth.fruit_months.length > 0) {
    growthChars.fruitMonths = species.growth.fruit_months.filter(m => m);
  }
  
  if (Object.keys(growthChars).length > 0) {
    updatedPlant.growthCharacteristics = growthChars;
  }

  // Add visual characteristics
  const visualChars = {};
  
  if (species.flower) {
    const flower = {};
    if (species.flower.color && species.flower.color.length > 0) {
      flower.colors = species.flower.color.filter(c => c);
    }
    if (species.flower.conspicuous !== undefined && species.flower.conspicuous !== null) {
      flower.conspicuous = species.flower.conspicuous;
    }
    if (Object.keys(flower).length > 0) {
      visualChars.flower = flower;
    }
  }
  
  if (species.foliage) {
    const foliage = {};
    if (species.foliage.texture) {
      foliage.texture = species.foliage.texture;
    }
    if (species.foliage.color && species.foliage.color.length > 0) {
      foliage.colors = species.foliage.color.filter(c => c);
    }
    if (species.foliage.leaf_retention !== undefined && species.foliage.leaf_retention !== null) {
      foliage.leafRetention = species.foliage.leaf_retention;
    }
    if (Object.keys(foliage).length > 0) {
      visualChars.foliage = foliage;
    }
  }
  
  if (species.fruit_or_seed) {
    const fruit = {};
    if (species.fruit_or_seed.color && species.fruit_or_seed.color.length > 0) {
      fruit.colors = species.fruit_or_seed.color.filter(c => c);
    }
    if (species.fruit_or_seed.shape) {
      fruit.shape = species.fruit_or_seed.shape;
    }
    if (species.fruit_or_seed.conspicuous !== undefined && species.fruit_or_seed.conspicuous !== null) {
      fruit.conspicuous = species.fruit_or_seed.conspicuous;
    }
    if (species.fruit_or_seed.seed_persistence !== undefined && species.fruit_or_seed.seed_persistence !== null) {
      fruit.seedPersistence = species.fruit_or_seed.seed_persistence;
    }
    if (Object.keys(fruit).length > 0) {
      visualChars.fruit = fruit;
    }
  }
  
  if (Object.keys(visualChars).length > 0) {
    updatedPlant.visualCharacteristics = visualChars;
  }

  // Add growing instructions
  if (species.growth?.description || species.growth?.sowing) {
    const instructions = {};
    if (species.growth.description) {
      instructions.description = species.growth.description;
    }
    if (species.growth.sowing) {
      instructions.sowing = species.growth.sowing;
    }
    updatedPlant.growingInstructions = instructions;
  }

  // Add distribution
  if (species.distributions) {
    const distribution = {};
    if (species.distributions.native && species.distributions.native.length > 0) {
      distribution.native = species.distributions.native.map(z => ({
        name: z.name,
        tdwgCode: z.tdwg_code
      }));
    }
    if (species.distributions.introduced && species.distributions.introduced.length > 0) {
      distribution.introduced = species.distributions.introduced.map(z => ({
        name: z.name,
        tdwgCode: z.tdwg_code
      }));
    }
    if (Object.keys(distribution).length > 0) {
      updatedPlant.distribution = distribution;
    }
  }

  // Enhanced images with copyright
  if (species.images) {
    updatedPlant.imagesDetailed = {
      flower: species.images.flower?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || [],
      leaf: species.images.leaf?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || [],
      fruit: species.images.fruit?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || [],
      habit: species.images.habit?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || [],
      bark: species.images.bark?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || [],
      other: species.images.other?.map(img => ({
        id: img.id,
        url: img.image_url,
        copyright: img.copyright
      })) || []
    };
  }

  // Keep simple images array for backward compatibility
  if (species.images) {
    updatedPlant.images = {
      flower: species.images.flower?.map(img => img.image_url) || [],
      leaf: species.images.leaf?.map(img => img.image_url) || [],
      fruit: species.images.fruit?.map(img => img.image_url) || [],
      habit: species.images.habit?.map(img => img.image_url) || [],
      bark: species.images.bark?.map(img => img.image_url) || [],
      other: species.images.other?.map(img => img.image_url) || []
    };
  }

  // Update common names if available (for translations)
  if (species.common_names) {
    if (species.common_names.tr && species.common_names.tr.length > 0 && !updatedPlant.name_tr) {
      updatedPlant.name_tr = species.common_names.tr[0];
    }
    if (species.common_names.ar && species.common_names.ar.length > 0 && !updatedPlant.name_ar) {
      updatedPlant.name_ar = species.common_names.ar[0];
    }
  }

  // Add Trefle-specific metadata
  updatedPlant.trefleId = species.id;
  updatedPlant.trefleSlug = species.slug;
  if (species.family) {
    updatedPlant.family = species.family;
  }
  if (species.genus) {
    updatedPlant.genus = species.genus;
  }

  return updatedPlant;
}

// Main function
async function updatePlantsFromTrefle() {
  const plantsJsonPath = path.join(__dirname, '../src/data/plants.json');
  
  console.log('Reading plants.json...');
  const plantsData = JSON.parse(fs.readFileSync(plantsJsonPath, 'utf8'));
  
  console.log(`Found ${plantsData.plants.length} plants to update.`);
  console.log('Starting to fetch data from Trefle API...\n');

  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (let i = 0; i < plantsData.plants.length; i++) {
    const plant = plantsData.plants[i];
    const plantName = plant.name;
    const scientificName = plant.scientificName;

    console.log(`[${i + 1}/${plantsData.plants.length}] Processing: ${plantName} (${scientificName})`);

    try {
      // First, try searching by scientific name with exact match
      let treflePlant = await searchPlant(scientificName, true);
      
      // If not found, try searching by scientific name without exact match
      if (!treflePlant) {
        treflePlant = await searchPlant(scientificName);
      }
      
      // If still not found, try searching by common name
      if (!treflePlant) {
        console.log(`  → Scientific name not found, trying common name: ${plantName}`);
        treflePlant = await searchPlant(plantName);
      }

      if (!treflePlant) {
        console.log(`  ✗ Not found in Trefle API`);
        notFoundCount++;
        continue;
      }

      console.log(`  ✓ Found: ${treflePlant.common_name || treflePlant.scientific_name}`);

      // Get detailed species information
      const slug = treflePlant.slug || treflePlant.id;
      const speciesDetails = await getSpeciesDetails(slug);

      if (speciesDetails) {
        const updatedPlant = mapTrefleToPlant(speciesDetails, plant);
        plantsData.plants[i] = cleanObject(updatedPlant);
        updatedCount++;
        console.log(`  ✓ Updated with Trefle data`);
        
        // Log what new data was found
        const logItems = [];
        if (updatedPlant.edible) logItems.push(`Edible: ${updatedPlant.edibleParts?.join(', ') || 'yes'}`);
        if (updatedPlant.toxicity) logItems.push(`Toxicity: ${updatedPlant.toxicity}`);
        if (updatedPlant.growthRequirements?.light !== undefined) logItems.push(`Light: ${updatedPlant.growthRequirements.light}/10`);
        if (updatedPlant.growthCharacteristics?.duration) logItems.push(`Duration: ${updatedPlant.growthCharacteristics.duration.join(', ')}`);
        if (updatedPlant.imagesDetailed) {
          const imageCount = Object.values(updatedPlant.imagesDetailed).reduce((sum, arr) => sum + arr.length, 0);
          if (imageCount > 0) logItems.push(`${imageCount} images`);
        }
        if (logItems.length > 0) {
          console.log(`    - ${logItems.join(' | ')}`);
        }
      } else {
        // Use the basic plant data from search
        if (treflePlant.image_url) {
          plantsData.plants[i].image = treflePlant.image_url;
        }
        updatedCount++;
        console.log(`  ✓ Updated with basic Trefle data`);
      }

    } catch (error) {
      console.error(`  ✗ Error processing ${plantName}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== Update Summary ===');
  console.log(`Total plants: ${plantsData.plants.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);

  // Write updated data back to file
  console.log('\nWriting updated data to plants.json...');
  fs.writeFileSync(plantsJsonPath, JSON.stringify(plantsData, null, 2), 'utf8');
  console.log('✓ Successfully updated plants.json');
}

// Run the script
updatePlantsFromTrefle().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

