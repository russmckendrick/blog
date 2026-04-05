#!/usr/bin/env node

/**
 * Reading List Image Cache Script
 *
 * Downloads Open Graph images for reading list bookmarks at build time.
 * Stores images locally to enable Cloudflare image transformations.
 *
 * Usage:
 *   node scripts/cache-reading-images.js                  # Download new images only
 *   node scripts/cache-reading-images.js --force          # Re-download all images
 *   node scripts/cache-reading-images.js --refresh-stale  # Re-download images older than 7 days
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/assets/reading-previews')
const MANIFEST_FILE = path.join(PROJECT_ROOT, 'src/data/reading-image-cache.json')
const CACHE_FILE = path.join(PROJECT_ROOT, 'node_modules/.cache/reading-image-cache.json')
const READING_DATA = path.join(PROJECT_ROOT, 'src/data/reading.json')

const STALE_DAYS = 7
const CONCURRENCY = 4
const REQUEST_DELAY = 500

const args = process.argv.slice(2)
const FORCE_REFRESH = args.includes('--force')
const REFRESH_STALE = args.includes('--refresh-stale')

/**
 * Generate deterministic filename from URL
 */
function getImageFilename(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 12)
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    const cleanHost = hostname.replace(/[^a-z0-9.-]/gi, '-').slice(0, 30)
    return `${cleanHost}-${hash}`
  } catch {
    return `unknown-${hash}`
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch page and parse Open Graph metadata
 */
async function fetchOGMetadata(url) {
  try {
    const { parseHTML } = await import('linkedom')

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RussCloudBot/1.0; +https://russ.cloud)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()
    const { document } = parseHTML(html)

    const getMeta = (property) => {
      const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
      return el?.getAttribute('content') || ''
    }

    const title = getMeta('og:title') ||
      document.querySelector('title')?.textContent || ''

    const description = getMeta('og:description') ||
      getMeta('description') || ''

    let image = getMeta('og:image:secure_url') ||
      getMeta('og:image:url') ||
      getMeta('og:image') || ''

    if (image && !image.startsWith('https://')) {
      if (image.startsWith('http://')) {
        image = image.replace('http://', 'https://')
      } else if (image.startsWith('//')) {
        image = 'https:' + image
      } else if (image.startsWith('/')) {
        const urlObj = new URL(url)
        image = `${urlObj.origin}${image}`
      } else {
        image = ''
      }
    }

    const imageAlt = getMeta('og:image:alt') || ''

    return { title: title.trim(), description: description.trim(), image, imageAlt }
  } catch (error) {
    console.warn(`  Warning: Failed to fetch OG data for ${url}: ${error.message}`)
    return null
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
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, buffer)

    const stats = await fs.stat(localPath)
    return { success: true, size: stats.size }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function loadCache() {
  try {
    const content = await fs.readFile(CACHE_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { version: 1, entries: {} }
  }
}

async function saveCache(cache) {
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2))
}

async function loadManifest() {
  try {
    const content = await fs.readFile(MANIFEST_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {}
  }
}

async function saveManifest(manifest) {
  await fs.mkdir(path.dirname(MANIFEST_FILE), { recursive: true })
  await fs.writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2))
}

function isStale(entry) {
  if (!entry?.fetchedAt) return true
  const fetchedAt = new Date(entry.fetchedAt)
  const now = new Date()
  const daysDiff = (now - fetchedAt) / (1000 * 60 * 60 * 24)
  return daysDiff > STALE_DAYS
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function main() {
  console.log('Reading List Image Cache\n')

  if (FORCE_REFRESH) {
    console.log('Mode: Force refresh (re-downloading all images)\n')
  } else if (REFRESH_STALE) {
    console.log(`Mode: Refresh stale (re-downloading images older than ${STALE_DAYS} days)\n`)
  } else {
    console.log('Mode: Incremental (downloading new images only)\n')
  }

  // Load reading list
  let readingData
  try {
    const content = await fs.readFile(READING_DATA, 'utf-8')
    readingData = JSON.parse(content)
  } catch {
    console.warn('No reading.json found. Run fetch-reading-list.js first.')
    return
  }

  if (!Array.isArray(readingData) || readingData.length === 0) {
    console.log('No reading list items found.')
    return
  }

  // Extract unique URLs
  const urls = [...new Set(readingData.map(item => item.url))]
  console.log(`Found ${urls.length} unique URLs in reading list\n`)

  const cache = await loadCache()
  const manifest = await loadManifest()

  let downloaded = 0
  let cached = 0
  let failed = 0
  let noImage = 0
  let totalBytes = 0
  let processed = 0

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY)

    await Promise.all(batch.map(async (url) => {
      processed++
      const cacheEntry = cache.entries[url]
      const filename = getImageFilename(url)
      const localPath = path.join(OUTPUT_DIR, `${filename}.jpg`)
      const publicPath = `/assets/reading-previews/${filename}.jpg`

      // Check if we should skip this URL
      if (!FORCE_REFRESH) {
        if (cacheEntry && !REFRESH_STALE) {
          // Already processed (with or without image)
          try {
            if (cacheEntry.localImage) {
              await fs.access(localPath)
            }
            cached++
            return
          } catch {
            // File doesn't exist, need to re-download
          }
        } else if (cacheEntry && REFRESH_STALE && !isStale(cacheEntry)) {
          try {
            if (cacheEntry.localImage) {
              await fs.access(localPath)
            }
            cached++
            return
          } catch {
            // File doesn't exist, need to re-download
          }
        }
      }

      console.log(`  [${processed}/${urls.length}] ${url}`)

      await delay(REQUEST_DELAY)

      const ogData = await fetchOGMetadata(url)
      if (!ogData) {
        failed++
        manifest[url] = {
          localImage: null,
          originalImage: null,
          imageType: null,
          title: '',
          description: '',
          fetchedAt: new Date().toISOString(),
        }
        cache.entries[url] = manifest[url]
        return
      }

      if (ogData.image) {
        const result = await downloadImage(ogData.image, localPath)

        if (result.success) {
          console.log(`    Downloaded OG image: ${formatBytes(result.size)}`)
          downloaded++
          totalBytes += result.size

          manifest[url] = {
            localImage: publicPath,
            originalImage: ogData.image,
            imageType: 'og-image',
            title: ogData.title,
            description: ogData.description,
            imageAlt: ogData.imageAlt,
            fetchedAt: new Date().toISOString(),
          }
          cache.entries[url] = manifest[url]
          return
        }
      }

      // No OG image found or download failed
      noImage++
      manifest[url] = {
        localImage: null,
        originalImage: ogData.image || null,
        imageType: null,
        title: ogData.title,
        description: ogData.description,
        fetchedAt: new Date().toISOString(),
      }
      cache.entries[url] = manifest[url]
    }))
  }

  await saveCache(cache)
  await saveManifest(manifest)

  console.log('\nResults:')
  console.log(`  Downloaded: ${downloaded} (${formatBytes(totalBytes)})`)
  console.log(`  Cached: ${cached}`)
  if (noImage > 0) console.log(`  No OG image: ${noImage}`)
  if (failed > 0) console.log(`  Failed: ${failed}`)
  console.log(`\nManifest: ${MANIFEST_FILE}`)
  console.log(`Images: ${OUTPUT_DIR}`)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
