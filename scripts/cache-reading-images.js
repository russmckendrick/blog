#!/usr/bin/env node

/**
 * Reading List Image Cache Script
 *
 * Downloads Open Graph images for reading list bookmarks at build time.
 * Stores images locally to enable Cloudflare image transformations.
 *
 * Usage:
 *   node scripts/cache-reading-images.js                                  # Download new images only
 *   node scripts/cache-reading-images.js --force                          # Re-fetch entries missing title/description/image
 *   node scripts/cache-reading-images.js --force --force-really-no-cache  # Re-download everything from scratch
 *   node scripts/cache-reading-images.js --refresh-stale                  # Re-download images older than 7 days
 *   node scripts/cache-reading-images.js --force --limit 10               # Process the next 10 URLs that need work
 *   node scripts/cache-reading-images.js --force --limit 0                # Dry run: list what needs work
 *   node scripts/cache-reading-images.js --only <url>                     # (Re)process one URL, whatever its state
 *
 * --limit N always means "the next N URLs that need work" under the active
 * mode, newest first. A URL that keeps failing is given up on after
 * MAX_ATTEMPTS tries; --force-really-no-cache resets that.
 *
 * Sites that answer 403 or sit behind a Cloudflare challenge are retried in
 * headless Chrome: Puppeteer's own download if installed, otherwise the
 * system Google Chrome (or PUPPETEER_EXECUTABLE_PATH). Medium posts that are
 * hard-blocked even there fall back to a read-only Medium mirror (Freedium by
 * default, MEDIUM_MIRROR to override) for the title, subtitle and cover image
 * id; the image itself is downloaded from Medium's own CDN.
 */

import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import OAuth from 'oauth-1.0a'
import puppeteer from 'puppeteer'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const OUTPUT_DIR = path.join(PROJECT_ROOT, 'public/assets/reading-previews')
const MANIFEST_FILE = path.join(PROJECT_ROOT, 'src/data/reading-image-cache.json')
const CACHE_FILE = path.join(PROJECT_ROOT, 'node_modules/.cache/reading-image-cache.json')
const READING_DATA = path.join(PROJECT_ROOT, 'src/data/reading.json')

const STALE_DAYS = 7
const CONCURRENCY = 1
const REQUEST_DELAY = 2000
// Give up on a URL after this many fetches that didn't produce a complete entry
const MAX_ATTEMPTS = 3
// Narrower images are favicons or logos standing in for an og:image; the
// listing falls back to its favicon tile rather than stretching them.
const MIN_IMAGE_WIDTH = 300

const args = process.argv.slice(2)
const FORCE_REFRESH = args.includes('--force')
const FORCE_NO_CACHE = FORCE_REFRESH && args.includes('--force-really-no-cache')
const REFRESH_STALE = args.includes('--refresh-stale')
const limitIdx = args.indexOf('--limit')
const onlyIdx = args.indexOf('--only')
const ONLY_URL = onlyIdx !== -1 ? args[onlyIdx + 1] : null
// --limit 0 is a dry run: report what needs work without fetching anything
const URL_LIMIT = limitIdx !== -1 ? Math.max(0, parseInt(args[limitIdx + 1], 10) || 0) : null

// ── Instapaper API (for deleting 404'd bookmarks) ──────────────────────────

const {
  INSTAPAPER_CONSUMER_KEY,
  INSTAPAPER_CONSUMER_SECRET,
  INSTAPAPER_USERNAME,
  INSTAPAPER_PASSWORD,
  MEDIUM_COOKIE,
  MEDIUM_MIRROR = 'https://freedium-mirror.cfd',
} = process.env

const instapaperEnabled = !!(INSTAPAPER_CONSUMER_KEY && INSTAPAPER_CONSUMER_SECRET && INSTAPAPER_USERNAME)

let instapaperToken = null

function getOAuth() {
  return OAuth({
    consumer: {
      key: INSTAPAPER_CONSUMER_KEY,
      secret: INSTAPAPER_CONSUMER_SECRET,
    },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString, key) {
      return crypto.createHmac('sha1', key).update(baseString).digest('base64')
    },
  })
}

async function instapaperAuth() {
  if (!instapaperEnabled) return false
  const oauthClient = getOAuth()
  const url = 'https://www.instapaper.com/api/1/oauth/access_token'
  const requestData = { url, method: 'POST', data: { x_auth_username: INSTAPAPER_USERNAME, x_auth_password: INSTAPAPER_PASSWORD || '', x_auth_mode: 'client_auth' } }
  const headers = oauthClient.toHeader(oauthClient.authorize(requestData, null))
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(requestData.data).toString() })
  if (!res.ok) return false
  const parsed = new URLSearchParams(await res.text())
  instapaperToken = { key: parsed.get('oauth_token'), secret: parsed.get('oauth_token_secret') }
  return !!instapaperToken.key
}

async function instapaperDelete(bookmarkId) {
  if (!instapaperToken) return false
  const oauthClient = getOAuth()
  const url = 'https://www.instapaper.com/api/1/bookmarks/delete'
  const params = { bookmark_id: bookmarkId.toString() }
  const requestData = { url, method: 'POST', data: params }
  const headers = oauthClient.toHeader(oauthClient.authorize(requestData, instapaperToken))
  const res = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params).toString() })
  return res.ok
}

function isMediumUrl(url) {
  try {
    const hostname = new URL(url).hostname
    return hostname === 'medium.com' || hostname.endsWith('.medium.com')
      || hostname === 'betterprogramming.pub' || hostname === 'levelup.gitconnected.com'
      || hostname === 'blog.devgenius.io' || hostname === 'towardsdatascience.com'
      || hostname === 'faun.pub' || hostname === 'learningdaily.dev'
  } catch {
    return false
  }
}

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
 * Resolve an og:image / twitter:image value against the page URL (handles
 * absolute, protocol-relative, root-relative and plain relative paths) and
 * upgrade it to https. Returns '' for anything unusable (data: URIs etc).
 */
function resolveImageUrl(image, pageUrl) {
  if (!image) return ''
  try {
    const resolved = new URL(image.trim(), pageUrl)
    if (resolved.protocol === 'http:') resolved.protocol = 'https:'
    return resolved.protocol === 'https:' ? resolved.href : ''
  } catch {
    return ''
  }
}

const MAX_RETRIES = 5

async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)
    if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
      if (attempt === retries) return response
      const retryAfter = response.headers.get('retry-after')
      const baseWait = 2000 * 2 ** attempt // 2s, 4s, 8s, 16s, 32s
      const waitMs = retryAfter ? Math.max(parseInt(retryAfter, 10) * 1000, baseWait) || baseWait : baseWait
      const cappedMs = Math.min(waitMs, 30000)
      console.warn(`  Rate limited (${response.status}), retrying in ${(cappedMs / 1000).toFixed(0)}s...`)
      await delay(cappedMs)
      continue
    }
    return response
  }
}

/**
 * Fetch page and parse Open Graph metadata
 */
async function fetchOGMetadata(url) {
  try {
    const { parseHTML } = await import('linkedom')

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
    }

    // Medium uses Cloudflare JS challenges - skip retries, single attempt only
    const medium = isMediumUrl(url)
    if (MEDIUM_COOKIE && medium) {
      headers['Cookie'] = MEDIUM_COOKIE
    }

    const response = await fetchWithRetry(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    }, medium ? 0 : MAX_RETRIES)

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        return { notFound: true }
      }
      if (response.status === 403) {
        return { forbidden: true }
      }
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

    const image = resolveImageUrl(
      getMeta('og:image:secure_url') ||
      getMeta('og:image:url') ||
      getMeta('og:image') ||
      getMeta('twitter:image') ||
      getMeta('twitter:image:src'),
      url
    )

    const imageAlt = getMeta('og:image:alt') || ''

    return { title: title.trim(), description: description.trim(), image, imageAlt }
  } catch (error) {
    console.warn(`  Warning: Failed to fetch OG data for ${url}: ${error.message}`)
    return null
  }
}

// ── Headless Chrome for Cloudflare-protected sites (Medium) ─────────────────

let browser = null
let browserUnavailable = null

async function getBrowser() {
  if (browser) return browser
  // Fail fast after the first launch failure rather than once per URL
  if (browserUnavailable) throw browserUnavailable

  const launchArgs = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  try {
    // Puppeteer's own Chrome, or PUPPETEER_EXECUTABLE_PATH when set
    browser = await puppeteer.launch(launchArgs)
  } catch (bundledError) {
    try {
      // Fall back to the system Google Chrome install
      browser = await puppeteer.launch({ ...launchArgs, channel: 'chrome' })
      console.log('    Using system Google Chrome for browser fetches')
    } catch {
      browserUnavailable = new Error(
        `No Chrome available for browser fetches (${bundledError.message.split('\n')[0]}). ` +
        'Install Google Chrome, run `npx puppeteer browsers install chrome`, or set PUPPETEER_EXECUTABLE_PATH.'
      )
      throw browserUnavailable
    }
  }
  return browser
}

async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}

async function fetchOGWithBrowser(url) {
  try {
    const b = await getBrowser()
    const page = await b.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
    await page.setViewport({ width: 1280, height: 800 })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 })

    // Wait for Cloudflare challenge to resolve - poll until title changes
    await page.waitForFunction(
      () => !document.title.includes('Just a moment'),
      { timeout: 30000 }
    ).catch(() => {})

    const ogData = await page.evaluate(() => {
      const getMeta = (property) => {
        const el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`)
        return el?.getAttribute('content') || ''
      }
      return {
        title: getMeta('og:title') || document.title || '',
        description: getMeta('og:description') || getMeta('description') || '',
        image: getMeta('og:image:secure_url') || getMeta('og:image:url') || getMeta('og:image') ||
          getMeta('twitter:image') || getMeta('twitter:image:src') || '',
        imageAlt: getMeta('og:image:alt') || '',
      }
    })

    await page.close()

    // If we still got the challenge page, bail
    if (ogData.title.includes('Just a moment')) {
      console.warn(`  Warning: Cloudflare challenge did not resolve for ${url}`)
      return null
    }

    // Normalise image URL
    ogData.image = resolveImageUrl(ogData.image, url)

    ogData.title = ogData.title.trim()
    ogData.description = ogData.description.trim()

    console.log(`    Browser fetch OK: "${ogData.title.substring(0, 50)}..."`)
    if (ogData.image) {
      console.log(`    Browser found OG image: ${ogData.image.substring(0, 80)}...`)
    } else {
      console.log(`    Browser found no OG image`)
    }
    return ogData
  } catch (error) {
    console.warn(`  Warning: Browser fetch failed for ${url}: ${error.message}`)
    return null
  }
}

/**
 * Medium answers some posts with a hard Cloudflare block ("Attention
 * Required") that headless Chrome can't pass either. A read-only Medium
 * mirror still renders the post: take its title, subtitle and the cover
 * image's Medium id, and point the download at Medium's own image CDN.
 */
async function fetchOGViaMediumMirror(url) {
  try {
    const { parseHTML } = await import('linkedom')
    const mirrorUrl = `${MEDIUM_MIRROR.replace(/\/$/, '')}/${url}`
    const response = await fetchWithRetry(mirrorUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      // The mirror renders on demand from Medium and can take over a minute
      signal: AbortSignal.timeout(90000),
    }, 1)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const { document } = parseHTML(await response.text())
    const title = (document.querySelector('title')?.textContent || '')
      .replace(/\s+-\s+Freedium\s*$/i, '')
      .trim()
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || ''

    // The cover is marked as such; otherwise the first inline post image
    const cover = document.querySelector('img[alt="Post cover image"]') || document.querySelector('img.prose-image')
    const imageId = cover?.getAttribute('src')?.match(/\/img\/medium\/\d+\/(.+)$/)?.[1]
    const image = imageId ? `https://miro.medium.com/v2/resize:fit:1200/${imageId}` : ''

    if (!title && !image) throw new Error('No post found on the mirror')
    console.log(`    Medium mirror OK: "${title.substring(0, 50)}"${image ? ' (cover found)' : ' (no cover)'}`)
    return { title, description, image, imageAlt: '' }
  } catch (error) {
    console.warn(`  Warning: Medium mirror fetch failed for ${url}: ${error.message}`)
    return null
  }
}

/**
 * Download image via headless Chrome (bypasses Cloudflare on image CDN)
 */
async function downloadImageWithBrowser(imageUrl, localPath) {
  try {
    const b = await getBrowser()
    const page = await b.newPage()

    const response = await page.goto(imageUrl, { waitUntil: 'networkidle2', timeout: 30000 })
    if (!response || !response.ok()) {
      await page.close()
      throw new Error(`HTTP ${response?.status() || 'unknown'}`)
    }

    const buffer = await response.buffer()
    await page.close()
    const jpeg = await bufferToJpeg(buffer)
    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, jpeg)

    return { success: true, size: jpeg.length }
  } catch (error) {
    console.warn(`  Warning: Browser image download failed: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * Re-encode any decoded image buffer to JPEG so files saved with a .jpg
 * extension actually contain JPEG bytes. Cloudflare Image Transformations
 * inspect the file signature, so PNG/WebP/AVIF/SVG bytes inside a .jpg
 * filename break downstream transforms.
 */
async function bufferToJpeg(buffer) {
  // Sniff the bytes rather than trusting Content-Type: some CDNs serve real
  // images as application/octet-stream, others serve HTML block pages.
  let metadata
  try {
    metadata = await sharp(buffer, { failOn: 'none' }).metadata()
  } catch {
    throw new Error('Not an image')
  }
  if (!metadata.width) throw new Error('Not an image')
  if (metadata.width < MIN_IMAGE_WIDTH) {
    throw new Error(`Too small (${metadata.width}px wide, need ${MIN_IMAGE_WIDTH}px)`)
  }

  return sharp(buffer, { failOn: 'none' })
    .rotate()
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
}

/**
 * Download image to local filesystem
 */
async function downloadImage(imageUrl, localPath) {
  try {
    const response = await fetchWithRetry(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // An HTML response is a block or login page; anything else is sniffed
    // by bufferToJpeg, which rejects non-images and undersized ones.
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('text/html')) {
      throw new Error(`Not an image: ${contentType}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    const jpeg = await bufferToJpeg(buffer)

    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, jpeg)

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

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/** An entry is complete once it has a title, a description and a local image. */
function isComplete(entry) {
  return !!(entry?.localImage && entry.title && entry.description)
}

/**
 * Whether a URL should be fetched under the active mode. Shared by the
 * --limit selection and the main loop so the two can never disagree.
 */
async function needsWork(url, entry) {
  if (FORCE_NO_CACHE || !entry) return true

  const imageOnDisk = entry.localImage
    ? await fileExists(path.join(OUTPUT_DIR, `${getImageFilename(url)}.jpg`))
    : false

  // A cached image that has gone missing from disk is always re-fetched
  if (entry.localImage && !imageOnDisk) return true

  if (FORCE_REFRESH) {
    if (isComplete(entry)) return false
    // Stop retrying URLs that keep failing (403s, no image, too small)
    return (entry.attempts ?? 0) < MAX_ATTEMPTS
  }

  if (REFRESH_STALE) return isStale(entry)

  return false
}

async function main() {
  console.log('Reading List Image Cache\n')

  if (FORCE_NO_CACHE) {
    console.log('Mode: Force (ignoring all cache, re-downloading everything)\n')
  } else if (FORCE_REFRESH) {
    console.log('Mode: Force refresh (re-fetching entries with missing data, skipping complete ones)\n')
  } else if (REFRESH_STALE) {
    console.log(`Mode: Refresh stale (re-downloading images older than ${STALE_DAYS} days)\n`)
  } else {
    console.log('Mode: Incremental (downloading new images only)\n')
  }
  if (ONLY_URL) {
    console.log(`Only: ${ONLY_URL}\n`)
  } else if (URL_LIMIT !== null) {
    console.log(URL_LIMIT === 0 ? 'Limit: 0 (dry run, nothing will be fetched)\n' : `Limit: the next ${URL_LIMIT} URLs that need work\n`)
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

  // Extract unique URLs (reading.json is sorted newest first)
  const allUrls = [...new Set(readingData.map(item => item.url))]
  console.log(`Found ${allUrls.length} unique URLs in reading list`)

  const cache = await loadCache()
  const manifest = await loadManifest()

  // Work out what needs fetching up front (newest first), so --limit picks
  // the next N URLs that need work rather than the first N overall.
  const pending = []
  for (const url of allUrls) {
    if (await needsWork(url, cache.entries[url])) pending.push(url)
  }
  const givenUp = allUrls.filter(url => {
    const entry = cache.entries[url]
    return entry && !isComplete(entry) && (entry.attempts ?? 0) >= MAX_ATTEMPTS
  }).length
  console.log(`${pending.length} need work, ${allUrls.length - pending.length} up to date${givenUp ? ` (${givenUp} given up after ${MAX_ATTEMPTS} attempts)` : ''}`)

  if (ONLY_URL && !allUrls.includes(ONLY_URL)) {
    console.warn(`--only: ${ONLY_URL} is not in reading.json`)
    return
  }
  const urls = ONLY_URL ? [ONLY_URL] : URL_LIMIT !== null ? pending.slice(0, URL_LIMIT) : pending
  console.log(URL_LIMIT !== null ? `Processing ${urls.length} of them\n` : '')
  if (URL_LIMIT === 0 && !ONLY_URL) {
    pending.slice(0, 10).forEach(url => console.log(`  next: ${url}`))
    return
  }

  // Authenticate with Instapaper for 404 cleanup
  let instapaperReady = false
  if (instapaperEnabled) {
    instapaperReady = await instapaperAuth()
    if (instapaperReady) console.log('Instapaper authenticated (will remove 404d bookmarks)\n')
  }

  // Build URL → bookmark_id lookup
  const urlToBookmarkId = new Map()
  for (const item of readingData) {
    urlToBookmarkId.set(item.url, item.bookmark_id)
  }

  const removedUrls = new Set()

  let downloaded = 0
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

      // Every URL here already passed needsWork(); attempts carry over so a
      // persistently failing URL is eventually given up on.
      const attempts = FORCE_NO_CACHE ? 1 : (cacheEntry?.attempts ?? 0) + 1

      console.log(`  [${processed}/${urls.length}] ${url}`)

      await delay(REQUEST_DELAY)

      let ogData = await fetchOGMetadata(url)

      // Handle 404/410 - remove dead bookmarks
      if (ogData?.notFound) {
        console.log(`    404 - removing dead bookmark`)
        const bookmarkId = urlToBookmarkId.get(url)
        if (instapaperReady && bookmarkId) {
          const deleted = await instapaperDelete(bookmarkId)
          console.log(deleted ? `    Deleted from Instapaper (${bookmarkId})` : `    Failed to delete from Instapaper`)
        }
        removedUrls.add(url)
        delete manifest[url]
        delete cache.entries[url]
        // Clean up local image if it exists
        try { await fs.unlink(localPath) } catch {}
        failed++
        return
      }

      let usedBrowserFallback = false
      if (ogData?.forbidden || (!ogData && isMediumUrl(url))) {
        // 403 or Cloudflare JS challenge - retry with headless Chrome
        console.log(`    ${ogData?.forbidden ? '403 Forbidden' : 'Cloudflare blocked'} - retrying with headless Chrome...`)
        ogData = await fetchOGWithBrowser(url)
        usedBrowserFallback = true
      }

      // Medium hard-blocks some posts even in headless Chrome; the mirror
      // still exposes the cover image id (and fills in a missing title).
      if (isMediumUrl(url) && !ogData?.image) {
        console.log(`    No image yet - trying the Medium mirror...`)
        const mirrored = await fetchOGViaMediumMirror(url)
        if (mirrored) {
          ogData = {
            title: ogData?.title || mirrored.title,
            description: ogData?.description || mirrored.description,
            image: mirrored.image,
            imageAlt: ogData?.imageAlt || '',
          }
        }
      }

      if (!ogData) {
        failed++
        manifest[url] = {
          localImage: null,
          originalImage: null,
          imageType: null,
          title: '',
          description: '',
          fetchedAt: new Date().toISOString(),
          attempts,
          lastError: usedBrowserFallback ? 'Blocked (403 / challenge) and browser fetch failed' : 'Page fetch failed',
        }
        cache.entries[url] = manifest[url]
        return
      }

      let imageError = ogData.image ? null : 'No og:image or twitter:image'
      if (ogData.image) {
        let result = await downloadImage(ogData.image, localPath)

        // If regular download failed and we know this site blocks requests, try via browser
        if (!result.success && (usedBrowserFallback || isMediumUrl(url))) {
          console.log(`    Image download blocked - retrying with headless Chrome...`)
          result = await downloadImageWithBrowser(ogData.image, localPath)
        }

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
          // Missing title/description still counts as an attempt under --force
          if (!isComplete(manifest[url])) manifest[url].attempts = attempts
          cache.entries[url] = manifest[url]
          return
        }
        imageError = result.error || 'Image download failed'
        console.log(`    No usable image: ${imageError}`)
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
        attempts,
        lastError: imageError,
      }
      cache.entries[url] = manifest[url]
    }))

    // Save after each batch so progress survives cancellation/re-runs
    await saveCache(cache)
    await saveManifest(manifest)
  }

  await closeBrowser()

  // Remove 404'd URLs from reading.json
  if (removedUrls.size > 0) {
    const cleaned = readingData.filter(item => !removedUrls.has(item.url))
    await fs.writeFile(READING_DATA, JSON.stringify(cleaned, null, 2))
    console.log(`\nRemoved ${removedUrls.size} dead bookmark(s) from reading.json`)
  }

  console.log('\nResults:')
  console.log(`  Downloaded: ${downloaded} (${formatBytes(totalBytes)})`)
  console.log(`  Up to date: ${allUrls.length - pending.length}`)
  if (noImage > 0) console.log(`  No OG image: ${noImage}`)
  if (removedUrls.size > 0) console.log(`  Removed (404): ${removedUrls.size}`)
  if (failed > 0) console.log(`  Failed: ${failed}`)
  console.log(`\nManifest: ${MANIFEST_FILE}`)
  console.log(`Images: ${OUTPUT_DIR}`)
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
