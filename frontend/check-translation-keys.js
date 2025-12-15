#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Function to flatten nested JSON object into dot notation keys
function flattenKeys(obj, prefix = '') {
  const keys = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // Recursively flatten nested objects
        keys.push(...flattenKeys(obj[key], fullKey));
      } else {
        // This is a leaf node (actual translation key)
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

// Function to load and parse JSON file
function loadTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(colorize(`Error loading ${filePath}: ${error.message}`, 'red'));
    process.exit(1);
  }
}

// Main comparison function
function compareTranslationKeys() {
  const localesDir = path.join(__dirname, 'src', 'i18n', 'locales');
  const enPath = path.join(localesDir, 'en.json');
  const arPath = path.join(localesDir, 'ar.json');
  const trPath = path.join(localesDir, 'tr.json');

  // Check if files exist
  if (!fs.existsSync(enPath)) {
    console.error(colorize(`English translation file not found: ${enPath}`, 'red'));
    process.exit(1);
  }

  if (!fs.existsSync(arPath)) {
    console.error(colorize(`Arabic translation file not found: ${arPath}`, 'red'));
    process.exit(1);
  }

  // Load translation files
  console.log(colorize('Loading translation files...', 'blue'));
  const enTranslations = loadTranslationFile(enPath);
  const arTranslations = loadTranslationFile(arPath);
  const trTranslations = fs.existsSync(trPath) ? loadTranslationFile(trPath) : null;

  // Flatten keys
  console.log(colorize('Analyzing translation keys...', 'blue'));
  const enKeys = new Set(flattenKeys(enTranslations));
  const arKeys = new Set(flattenKeys(arTranslations));
  const trKeys = trTranslations ? new Set(flattenKeys(trTranslations)) : null;

  // Find missing keys
  const missingInArabic = [...enKeys].filter(key => !arKeys.has(key));
  const extraInArabic = [...arKeys].filter(key => !enKeys.has(key));
  const missingInTurkish = trKeys ? [...enKeys].filter(key => !trKeys.has(key)) : [];

  // Display results
  console.log('\n' + colorize('='.repeat(80), 'cyan'));
  console.log(colorize('TRANSLATION KEY COMPARISON REPORT', 'bold'));
  console.log(colorize('='.repeat(80), 'cyan'));

  // Summary statistics
  console.log('\n' + colorize('📊 SUMMARY STATISTICS:', 'bold'));
  console.log(`${colorize('English keys:', 'blue')} ${enKeys.size}`);
  console.log(`${colorize('Arabic keys:', 'blue')} ${arKeys.size}`);
  if (trKeys) {
    console.log(`${colorize('Turkish keys:', 'blue')} ${trKeys.size}`);
  }

  // Missing in Arabic
  console.log('\n' + colorize('🔍 KEYS MISSING IN ARABIC:', 'bold'));
  if (missingInArabic.length === 0) {
    console.log(colorize('✅ No missing keys! Arabic translation is complete.', 'green'));
  } else {
    console.log(colorize(`❌ Found ${missingInArabic.length} missing keys:`, 'red'));
    missingInArabic.sort().forEach(key => {
      console.log(`  ${colorize('•', 'red')} ${key}`);
    });
  }

  // Extra in Arabic (keys that don't exist in English) - informational only
  console.log('\n' + colorize('ℹ️  EXTRA KEYS IN ARABIC (informational):', 'bold'));
  if (extraInArabic.length === 0) {
    console.log(colorize('No extra keys found.', 'blue'));
  } else {
    console.log(colorize(`Found ${extraInArabic.length} extra keys (these are OK, language-specific):`, 'blue'));
    extraInArabic.sort().forEach(key => {
      console.log(`  ${colorize('•', 'blue')} ${key}`);
    });
  }

  // Missing in Turkish (if Turkish file exists)
  if (trKeys) {
    console.log('\n' + colorize('🔍 KEYS MISSING IN TURKISH:', 'bold'));
    if (missingInTurkish.length === 0) {
      console.log(colorize('✅ No missing keys! Turkish translation is complete.', 'green'));
    } else {
      console.log(colorize(`❌ Found ${missingInTurkish.length} missing keys:`, 'red'));
      missingInTurkish.sort().forEach(key => {
        console.log(`  ${colorize('•', 'red')} ${key}`);
      });
    }
  }

  // Section-wise analysis - count missing keys per section
  console.log('\n' + colorize('📋 SECTION-WISE ANALYSIS:', 'bold'));
  const enSections = {};
  const missingSections = {};

  [...enKeys].forEach(key => {
    const section = key.split('.')[0];
    enSections[section] = (enSections[section] || 0) + 1;
  });

  // Count missing keys per section
  missingInArabic.forEach(key => {
    const section = key.split('.')[0];
    missingSections[section] = (missingSections[section] || 0) + 1;
  });

  console.log('\nSection comparison (only shows sections with missing keys):');
  const sectionsWithMissing = Object.keys(missingSections).sort();

  if (sectionsWithMissing.length === 0) {
    console.log(colorize('  ✅ All sections are complete!', 'green'));
  } else {
    sectionsWithMissing.forEach(section => {
      const enCount = enSections[section] || 0;
      const missingCount = missingSections[section];
      const arCount = enCount - missingCount;
      console.log(`  ${colorize('❌', 'red')} ${colorize(section.padEnd(15), 'cyan')}: ${missingCount} missing (${arCount}/${enCount} translated)`);
    });
  }

  // Generate missing keys template
  if (missingInArabic.length > 0) {
    console.log('\n' + colorize('📝 MISSING KEYS TEMPLATE:', 'bold'));
    console.log(colorize('Copy the following structure to add missing Arabic translations:', 'blue'));
    console.log('\n' + colorize('-'.repeat(50), 'yellow'));

    // Group missing keys by section
    const missingBySection = {};
    missingInArabic.forEach(key => {
      const parts = key.split('.');
      const section = parts[0];
      const subKey = parts.slice(1).join('.');

      if (!missingBySection[section]) {
        missingBySection[section] = [];
      }
      missingBySection[section].push(subKey);
    });

    Object.keys(missingBySection).sort().forEach(section => {
      console.log(`"${section}": {`);
      missingBySection[section].sort().forEach(subKey => {
        const fullKey = `${section}.${subKey}`;
        const enValue = getNestedValue(enTranslations, fullKey);
        console.log(`  "${subKey}": "${colorize('[TRANSLATE]', 'red')} ${enValue}",`);
      });
      console.log('},\n');
    });

    console.log(colorize('-'.repeat(50), 'yellow'));
  }

  // Final status
  console.log('\n' + colorize('🎯 FINAL STATUS:', 'bold'));
  const isArComplete = missingInArabic.length === 0;
  const isTrComplete = missingInTurkish.length === 0;

  // Arabic status
  if (isArComplete) {
    console.log(colorize('🎉 Arabic: 100% complete!', 'green'));
  } else {
    const arCoverage = (((enKeys.size - missingInArabic.length) / enKeys.size) * 100).toFixed(1);
    console.log(colorize(`📝 Arabic: ${arCoverage}% complete (${missingInArabic.length} keys missing)`, 'yellow'));
  }

  // Turkish status
  if (trKeys) {
    if (isTrComplete) {
      console.log(colorize('🎉 Turkish: 100% complete!', 'green'));
    } else {
      const trCoverage = (((enKeys.size - missingInTurkish.length) / enKeys.size) * 100).toFixed(1);
      console.log(colorize(`📝 Turkish: ${trCoverage}% complete (${missingInTurkish.length} keys missing)`, 'yellow'));
    }
  }

  console.log('\n' + colorize('='.repeat(80), 'cyan'));

  return {
    missingInArabic: missingInArabic.length,
    missingInTurkish: missingInTurkish.length,
    extraInArabic: extraInArabic.length,
    totalEnKeys: enKeys.size,
    totalArKeys: arKeys.size,
    isArComplete: isArComplete,
    isTrComplete: isTrComplete
  };
}

// Helper function to get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '[KEY NOT FOUND]';
  }, obj);
}

// Run the comparison
const isMainModule = path.resolve(process.argv[1]) === path.resolve(__filename);
if (isMainModule) {
  compareTranslationKeys();
}

export { compareTranslationKeys, flattenKeys };
