#!/usr/bin/env node

/**
 * Link Preview Image Cache Script
 *
 * Downloads Open Graph images at build time for LinkPreview components.
 * Stores images locally to enable Cloudflare image transformations.
 *
 * Usage:
 *   node scripts/cache-link-preview-images.js           # Download new images only
 *   node scripts/cache-link-preview-images.js --force   # Re-download all images
 *   node scripts/cache-link-preview-images.js --refresh-stale  # Re-download images older than 7 days
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/assets/link-previews');
const MANIFEST_FILE = path.join(PROJECT_ROOT, 'src/data/link-preview-cache.json');
const CACHE_FILE = path.join(PROJECT_ROOT, 'node_modules/.cache/link-preview-cache.json');

const STALE_DAYS = 7;
const CONCURRENCY = 4; // Process 4 URLs at a time
const REQUEST_DELAY = 500; // 500ms delay between requests to be polite

// Parse CLI arguments
const args = process.argv.slice(2);
const FORCE_REFRESH = args.includes('--force');
const REFRESH_STALE = args.includes('--refresh-stale');

/**
 * Regex to find LinkPreview components in MDX files
 * Matches: <LinkPreview id="https://..." /> or <LinkPreview id="https://..." hideMedia />
 */
const LINK_PREVIEW_REGEX = /<LinkPreview\s+id=["']([^"']+)["'](?:\s+hideMedia)?(?:\s*\/?)?>/g;
const HIDE_MEDIA_REGEX = /<LinkPreview\s+id=["']([^"']+)["']\s+hideMedia/;

/**
 * Generate deterministic filename from URL
 */
function getImageFilename(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    // Clean hostname for filesystem
    const cleanHost = hostname.replace(/[^a-z0-9.-]/gi, '-').slice(0, 30);
    return `${cleanHost}-${hash}`;
  } catch {
    return `unknown-${hash}`;
  }
}

/**
 * Delay helper
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch page and parse Open Graph metadata
 * Uses the same approach as @astro-community/astro-embed-link-preview
 * Returns both metadata and the parsed document for favicon discovery
 */
async function fetchOGMetadata(url) {
  try {
    // Dynamic import for ES modules
    const { parseHTML } = await import('linkedom');

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RussCloudBot/1.0; +https://russ.cloud)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const { document } = parseHTML(html);

    // Extract OG metadata
    const getMeta = (property) => {
      const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
      return el?.getAttribute('content') || '';
    };

    const title = getMeta('og:title') ||
      document.querySelector('title')?.textContent || '';

    const description = getMeta('og:description') ||
      getMeta('description') || '';

    // Try multiple image sources
    let image = getMeta('og:image:secure_url') ||
      getMeta('og:image:url') ||
      getMeta('og:image') || '';

    // Only use HTTPS images
    if (image && !image.startsWith('https://')) {
      if (image.startsWith('http://')) {
        image = image.replace('http://', 'https://');
      } else if (image.startsWith('//')) {
        image = 'https:' + image;
      } else if (image.startsWith('/')) {
        // Relative URL - resolve against base
        const urlObj = new URL(url);
        image = `${urlObj.origin}${image}`;
      } else {
        image = '';
      }
    }

    const imageAlt = getMeta('og:image:alt') || '';

    return {
      title: title.trim(),
      description: description.trim(),
      image,
      imageAlt,
      url: getMeta('og:url') || url,
      document, // Return document for favicon discovery
    };
  } catch (error) {
    console.warn(`  Warning: Failed to fetch OG data for ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Discover favicons from HTML document
 * Returns array of candidates sorted by priority
 */
function discoverFavicons(baseUrl, document) {
  const candidates = [];
  const urlObj = new URL(baseUrl);

  // Helper to resolve relative URLs
  const resolveUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return null; // Skip data URIs
    if (url.startsWith('https://')) return url;
    if (url.startsWith('http://')) return url.replace('http://', 'https://');
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return `${urlObj.origin}${url}`;
    return `${urlObj.origin}/${url}`;
  };

  // Helper to extract size from sizes attribute
  const parseSize = (sizes) => {
    if (!sizes) return 0;
    const match = sizes.match(/(\d+)x\d+/);
    return match ? parseInt(match[1]) : 0;
  };

  // 1. Apple Touch Icon (usually 180x180)
  const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
  appleTouchIcons.forEach(link => {
    const href = link.getAttribute('href');
    const url = resolveUrl(href);
    if (url) {
      const size = parseSize(link.getAttribute('sizes')) || 180;
      candidates.push({ url, size, priority: 1, type: 'apple-touch-icon' });
    }
  });

  // 2. SVG favicons (vector, scalable)
  const svgIcons = document.querySelectorAll('link[rel*="icon"][type="image/svg+xml"]');
  svgIcons.forEach(link => {
    const href = link.getAttribute('href');
    const url = resolveUrl(href);
    if (url) {
      candidates.push({ url, size: 999, priority: 2, type: 'svg' });
    }
  });

  // 3. Large PNG favicons
  const pngIcons = document.querySelectorAll('link[rel*="icon"][type="image/png"]');
  pngIcons.forEach(link => {
    const href = link.getAttribute('href');
    const url = resolveUrl(href);
    if (url) {
      const size = parseSize(link.getAttribute('sizes')) || 32;
      if (size >= 32) { // Only accept 32x32 or larger
        candidates.push({ url, size, priority: 3, type: 'png' });
      }
    }
  });

  // 4. Generic icon links
  const genericIcons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  genericIcons.forEach(link => {
    const href = link.getAttribute('href');
    const url = resolveUrl(href);
    if (url && !candidates.some(c => c.url === url)) {
      const size = parseSize(link.getAttribute('sizes')) || 32;
      candidates.push({ url, size, priority: 4, type: 'generic' });
    }
  });

  // 5. Standard /favicon.ico
  const faviconIcoUrl = `${urlObj.origin}/favicon.ico`;
  if (!candidates.some(c => c.url === faviconIcoUrl)) {
    candidates.push({ url: faviconIcoUrl, size: 32, priority: 5, type: 'ico' });
  }

  // Sort by priority first, then by size (larger is better)
  return candidates.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.size - a.size;
  });
}

/**
 * Download favicon to local filesystem
 * Returns the file extension based on content type
 */
async function downloadFavicon(faviconUrl, baseFilename) {
  try {
    const response = await fetch(faviconUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RussCloudBot/1.0; +https://russ.cloud)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`);
    }

    // Determine file extension from content type
    let ext = '.png';
    if (contentType.includes('svg')) ext = '.svg';
    else if (contentType.includes('x-icon') || contentType.includes('vnd.microsoft.icon')) ext = '.ico';
    else if (contentType.includes('png')) ext = '.png';
    else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('webp')) ext = '.webp';

    const localPath = path.join(OUTPUT_DIR, `${baseFilename}-favicon${ext}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Ensure directory exists
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Write image
    await fs.writeFile(localPath, buffer);

    // Get file size for logging
    const stats = await fs.stat(localPath);
    return { success: true, size: stats.size, localPath, ext };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Download image to local filesystem
 */
async function downloadImage(imageUrl, localPath) {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RussCloudBot/1.0; +https://russ.cloud)',
        'Accept': 'image/*',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout for images
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Ensure directory exists
    await fs.mkdir(path.dirname(localPath), { recursive: true });

    // Write image
    await fs.writeFile(localPath, buffer);

    // Get file size for logging
    const stats = await fs.stat(localPath);
    return { success: true, size: stats.size };
  } catch (error) {
    console.warn(`  Warning: Failed to download ${imageUrl}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Scan all MDX files for LinkPreview components
 */
async function scanContentForLinkPreviews() {
  const pattern = 'src/content/**/*.mdx';
  const files = await fg(pattern, { cwd: PROJECT_ROOT, absolute: true });

  const urls = new Map(); // URL -> { hasMedia: boolean, files: string[] }

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const relativePath = path.relative(PROJECT_ROOT, file);

    let match;
    LINK_PREVIEW_REGEX.lastIndex = 0;

    while ((match = LINK_PREVIEW_REGEX.exec(content)) !== null) {
      const url = match[0];
      const id = match[1];

      // Check if this specific instance has hideMedia
      const hasHideMedia = HIDE_MEDIA_REGEX.test(url);

      if (!urls.has(id)) {
        urls.set(id, { hasMedia: !hasHideMedia, files: [relativePath] });
      } else {
        const entry = urls.get(id);
        // If ANY usage doesn't have hideMedia, we need the image
        if (!hasHideMedia) entry.hasMedia = true;
        if (!entry.files.includes(relativePath)) {
          entry.files.push(relativePath);
        }
      }
    }
  }

  return urls;
}

/**
 * Load existing cache
 */
async function loadCache() {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { version: 1, entries: {} };
  }
}

/**
 * Save cache
 */
async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Load existing manifest
 */
async function loadManifest() {
  try {
    const content = await fs.readFile(MANIFEST_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save manifest
 */
async function saveManifest(manifest) {
  await fs.mkdir(path.dirname(MANIFEST_FILE), { recursive: true });
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

/**
 * Check if a cache entry is stale
 */
function isStale(entry) {
  if (!entry?.fetchedAt) return true;
  const fetchedAt = new Date(entry.fetchedAt);
  const now = new Date();
  const daysDiff = (now - fetchedAt) / (1000 * 60 * 60 * 24);
  return daysDiff > STALE_DAYS;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Main processing function
 */
async function main() {
  console.log('Link Preview Image Cache\n');

  if (FORCE_REFRESH) {
    console.log('Mode: Force refresh (re-downloading all images)\n');
  } else if (REFRESH_STALE) {
    console.log(`Mode: Refresh stale (re-downloading images older than ${STALE_DAYS} days)\n`);
  } else {
    console.log('Mode: Incremental (downloading new images only)\n');
  }

  // Scan content for LinkPreview URLs
  console.log('Scanning content files...');
  const urlMap = await scanContentForLinkPreviews();

  // Filter to only URLs that need images (not hideMedia)
  const urlsNeedingImages = [...urlMap.entries()]
    .filter(([, info]) => info.hasMedia)
    .map(([url]) => url);

  console.log(`Found ${urlMap.size} LinkPreview URLs (${urlsNeedingImages.length} need images)\n`);

  if (urlsNeedingImages.length === 0) {
    console.log('No LinkPreview URLs found that need images.');
    return;
  }

  // Load cache and manifest
  const cache = await loadCache();
  const manifest = await loadManifest();

  // Track stats
  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  let skipped = 0;
  let totalBytes = 0;

  // Process URLs
  for (let i = 0; i < urlsNeedingImages.length; i += CONCURRENCY) {
    const batch = urlsNeedingImages.slice(i, i + CONCURRENCY);

    await Promise.all(batch.map(async (url) => {
      const cacheEntry = cache.entries[url];
      const filename = getImageFilename(url);
      const localPath = path.join(OUTPUT_DIR, `${filename}.jpg`);
      const publicPath = `/assets/link-previews/${filename}.jpg`;

      // Check if we should skip this URL
      if (!FORCE_REFRESH) {
        if (cacheEntry?.localImage && !REFRESH_STALE) {
          // Have cached entry, not refreshing stale - check if file exists
          try {
            await fs.access(localPath);
            // File exists and we're not refreshing - use cached
            cached++;
            return;
          } catch {
            // File doesn't exist, need to download
          }
        } else if (cacheEntry?.localImage && REFRESH_STALE && !isStale(cacheEntry)) {
          // Have cached entry, refreshing stale, but not stale yet
          try {
            await fs.access(localPath);
            cached++;
            return;
          } catch {
            // File doesn't exist, need to download
          }
        }
      }

      // Need to fetch OG data and download image
      console.log(`  Processing: ${url}`);

      // Add delay to be polite
      await delay(REQUEST_DELAY);

      const ogData = await fetchOGMetadata(url);
      if (!ogData) {
        failed++;
        // Update manifest with fallback (no local image)
        manifest[url] = {
          localImage: null,
          originalImage: null,
          imageType: null,
          title: '',
          description: '',
          fetchedAt: new Date().toISOString(),
        };
        return;
      }

      // Try to download OG image first
      if (ogData.image) {
        const result = await downloadImage(ogData.image, localPath);

        if (result.success) {
          console.log(`    Downloaded OG image: ${formatBytes(result.size)}`);
          downloaded++;
          totalBytes += result.size;

          manifest[url] = {
            localImage: publicPath,
            originalImage: ogData.image,
            imageType: 'og-image',
            title: ogData.title,
            description: ogData.description,
            imageAlt: ogData.imageAlt,
            fetchedAt: new Date().toISOString(),
          };
          cache.entries[url] = manifest[url];
          return;
        }
      }

      // No OG image or OG image download failed - try favicon fallback
      console.log(`    No OG image found, trying favicons...`);
      const favicons = discoverFavicons(url, ogData.document);

      if (favicons.length === 0) {
        console.log(`    No favicons found either`);
        skipped++;
        manifest[url] = {
          localImage: null,
          originalImage: null,
          imageType: null,
          title: ogData.title,
          description: ogData.description,
          fetchedAt: new Date().toISOString(),
        };
        cache.entries[url] = manifest[url];
        return;
      }

      // Try each favicon candidate until one succeeds
      let faviconSuccess = false;
      for (const favicon of favicons) {
        console.log(`    Trying ${favicon.type} favicon (${favicon.size}px)...`);
        const result = await downloadFavicon(favicon.url, filename);

        if (result.success) {
          const faviconPublicPath = `/assets/link-previews/${filename}-favicon${result.ext}`;
          console.log(`    Downloaded favicon: ${formatBytes(result.size)}`);
          downloaded++;
          totalBytes += result.size;

          manifest[url] = {
            localImage: faviconPublicPath,
            originalImage: null,
            faviconUrl: favicon.url,
            imageType: 'favicon',
            title: ogData.title,
            description: ogData.description,
            fetchedAt: new Date().toISOString(),
          };
          cache.entries[url] = manifest[url];
          faviconSuccess = true;
          break;
        }
      }

      if (!faviconSuccess) {
        console.log(`    All favicon attempts failed`);
        failed++;
        manifest[url] = {
          localImage: null,
          originalImage: ogData.image || null,
          imageType: null,
          title: ogData.title,
          description: ogData.description,
          fetchedAt: new Date().toISOString(),
        };
        cache.entries[url] = manifest[url];
      }
    }));
  }

  // Save cache and manifest
  await saveCache(cache);
  await saveManifest(manifest);

  // Summary
  console.log('\nResults:');
  console.log(`  Downloaded: ${downloaded} (${formatBytes(totalBytes)})`);
  console.log(`  Cached: ${cached}`);
  if (skipped > 0) console.log(`  No image: ${skipped}`);
  if (failed > 0) console.log(`  Failed: ${failed}`);
  console.log(`\nManifest: ${MANIFEST_FILE}`);
  console.log(`Images: ${OUTPUT_DIR}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
