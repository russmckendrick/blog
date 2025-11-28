#!/usr/bin/env node

/**
 * Hero Image Color Extraction Script
 *
 * Extracts dominant colors from hero images at build time for dynamic gradient generation.
 * Uses Sharp for fast image processing with caching for incremental builds.
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/hero-colors.json');
const CACHE_FILE = path.join(PROJECT_ROOT, 'node_modules/.cache/hero-colors-cache.json');

// Color utility functions
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x =>
    Math.min(255, Math.max(0, Math.round(x))).toString(16).padStart(2, '0')
  ).join('');
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

function darkenColor(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r * (1 - amount),
    g * (1 - amount),
    b * (1 - amount)
  );
}

function lightenColor(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  );
}

// Calculate color luminance (0-1 range)
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate color saturation (0-1 range)
function getSaturation(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}

/**
 * Extract dominant colors from an image using Sharp
 * Improved algorithm for more vibrant, distinct colors
 */
async function extractColors(imagePath) {
  try {
    // Resize to 128x128 for better color sampling
    const { data, info } = await sharp(imagePath)
      .resize(128, 128, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Collect all colors with their properties
    const colors = [];

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luminance = getLuminance(r, g, b);
      const saturation = getSaturation(r, g, b);

      // Skip very dark or very light colors
      if (luminance < 0.08 || luminance > 0.92) continue;

      colors.push({ r, g, b, saturation, luminance });
    }

    // Sort by saturation (most vibrant first) then by frequency
    const colorCounts = new Map();

    for (const { r, g, b, saturation } of colors) {
      // Quantize to 32-step buckets
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;

      const key = `${qr},${qg},${qb}`;

      if (!colorCounts.has(key)) {
        colorCounts.set(key, { count: 0, saturation: 0, r: qr, g: qg, b: qb });
      }

      const entry = colorCounts.get(key);
      entry.count++;
      entry.saturation = Math.max(entry.saturation, saturation);
    }

    // Score colors by vibrance and frequency
    const scoredColors = [...colorCounts.values()]
      .map(c => ({
        ...c,
        // Heavily weight saturation, then frequency
        score: (c.saturation * 3) + (c.count / colors.length)
      }))
      .sort((a, b) => b.score - a.score);

    // Pick distinct colors (avoid similar hues)
    const selectedColors = [];
    for (const color of scoredColors) {
      if (selectedColors.length >= 5) break;

      // Check if this color is distinct from already selected
      const isDistinct = selectedColors.every(selected => {
        const dr = Math.abs(color.r - selected.r);
        const dg = Math.abs(color.g - selected.g);
        const db = Math.abs(color.b - selected.b);
        return (dr + dg + db) > 80; // Minimum color distance
      });

      if (isDistinct || selectedColors.length === 0) {
        selectedColors.push(color);
      }
    }

    // Convert to hex
    const hexColors = selectedColors.map(c => rgbToHex(c.r, c.g, c.b));

    // Ensure we have enough colors with good defaults
    const primary = hexColors[0] || '#3B82F6';
    const secondary = hexColors[1] || darkenColor(primary, 0.25);
    const accent = hexColors[2] || lightenColor(primary, 0.15);
    const tertiary = hexColors[3] || darkenColor(secondary, 0.2);

    return {
      primary,
      secondary,
      accent,
      tertiary,
      primaryDark: darkenColor(primary, 0.4),
      secondaryDark: darkenColor(secondary, 0.4),
      accentDark: darkenColor(accent, 0.35),
      tertiaryDark: darkenColor(tertiary, 0.35)
    };
  } catch (error) {
    console.error(`  Error processing ${path.basename(imagePath)}:`, error.message);
    return null;
  }
}

/**
 * Main extraction process
 */
async function main() {
  console.log('Extracting hero image colors...\n');

  // Find all hero/cover images
  const patterns = [
    'src/assets/**/blog-cover-*.{jpg,jpeg,png,webp}',
    'src/assets/**/cover.{jpg,jpeg,png,webp}',
    'src/assets/**/tunes-cover-*.{jpg,jpeg,png,webp}'
  ];

  const imageFiles = [];
  for (const pattern of patterns) {
    const files = await fg(pattern, { cwd: PROJECT_ROOT, absolute: true });
    imageFiles.push(...files);
  }

  // Remove duplicates
  const uniqueFiles = [...new Set(imageFiles)];
  console.log(`Found ${uniqueFiles.length} hero images\n`);

  // Load cache for incremental processing
  let cache = {};
  try {
    const cacheContent = await fs.readFile(CACHE_FILE, 'utf-8');
    cache = JSON.parse(cacheContent);
  } catch {
    // No cache file exists yet
  }

  const results = {};
  let processed = 0;
  let cached = 0;
  let errors = 0;

  for (const imagePath of uniqueFiles) {
    const stat = await fs.stat(imagePath);
    // Create a relative key from src/assets/
    const key = imagePath.replace(PROJECT_ROOT + '/src/assets/', '');
    const cacheKey = `${key}:${stat.mtime.getTime()}`;

    if (cache[cacheKey]) {
      results[key] = cache[cacheKey];
      cached++;
    } else {
      const colors = await extractColors(imagePath);
      if (colors) {
        results[key] = colors;
        cache[cacheKey] = colors;
        processed++;
        console.log(`  Extracted: ${key}`);
      } else {
        errors++;
      }
    }
  }

  // Ensure output directory exists
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2));

  // Save cache
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));

  console.log(`\nResults:`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Cached: ${cached}`);
  if (errors > 0) console.log(`  Errors: ${errors}`);
  console.log(`\nOutput: ${OUTPUT_FILE}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
