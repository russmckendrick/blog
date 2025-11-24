import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { CollectionManager } from './lib/collection-manager.js'
import { ImageHandler } from './lib/image-handler.js'
import { escapeQuotes } from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Migration Script: Convert existing tunes posts to integrated image/link format
 *
 * This script:
 * 1. Removes LightGallery components (artist and album galleries)
 * 2. Integrates album images after H2 headers
 * 3. Integrates artist images after middle H3 headers
 * 4. Adds russ.fm links at the end of each album section
 * 5. Adds horizontal rule before Top Artists section
 */

const TUNES_DIR = path.join(process.cwd(), 'src', 'content', 'tunes')
const DRY_RUN = process.argv.includes('--dry-run')

// Check for file path argument (skip node executable and script name)
const args = process.argv.slice(2)
const fileArg = args.find(arg => !arg.startsWith('--'))
const SINGLE_FILE = fileArg ? path.resolve(fileArg) : null

// Initialize collection manager
const COLLECTION_URL = process.env.COLLECTION_URL || 'https://www.russ.fm'
const collectionManager = new CollectionManager(COLLECTION_URL)
let collectionInfo = null

async function main() {
  try {
    console.log('🎵 Tunes Migration Script')
    console.log('='.repeat(50))
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will modify files)'}`)
    if (SINGLE_FILE) {
      console.log(`Target: Single file - ${path.basename(SINGLE_FILE)}`)
    } else {
      console.log(`Target: All files in ${TUNES_DIR}`)
    }
    console.log('='.repeat(50))
    console.log('')

    // Load collection data
    console.log('Loading collection data...')
    collectionInfo = await collectionManager.getCollectionData()
    console.log(`Loaded ${Object.keys(collectionInfo.info).length} collection items\n`)

    let filesToProcess = []

    if (SINGLE_FILE) {
      // Process single file
      if (!await fileExists(SINGLE_FILE)) {
        console.error(`❌ File not found: ${SINGLE_FILE}`)
        process.exit(1)
      }
      if (!SINGLE_FILE.endsWith('.mdx')) {
        console.error(`❌ File must be an MDX file: ${SINGLE_FILE}`)
        process.exit(1)
      }
      filesToProcess = [{ path: SINGLE_FILE, name: path.basename(SINGLE_FILE) }]
    } else {
      // Process all files in directory
      const files = await fs.readdir(TUNES_DIR)
      const mdxFiles = files.filter(f => f.endsWith('.mdx'))
      filesToProcess = mdxFiles.map(f => ({ path: path.join(TUNES_DIR, f), name: f }))
    }

    console.log(`Found ${filesToProcess.length} MDX file(s) to process\n`)

    let processedCount = 0
    let skippedCount = 0

    for (const file of filesToProcess) {
      console.log(`Processing: ${file.name}`)

      try {
        const content = await fs.readFile(file.path, 'utf-8')
        const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/)

        if (!dateMatch) {
          console.log(`  ⚠️  Skipped: Could not extract date from filename`)
          skippedCount++
          continue
        }

        const dateStr = dateMatch[1]
        const newContent = await migratePost(content, dateStr, file.name, file.path)

        if (newContent === content) {
          console.log(`  ✓ No changes needed`)
          skippedCount++
        } else {
          if (!DRY_RUN) {
            await fs.writeFile(file.path, newContent)
            console.log(`  ✅ Migrated successfully`)
          } else {
            console.log(`  ✓ Would migrate (dry run)`)
          }
          processedCount++
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
        skippedCount++
      }

      console.log('')
    }

    console.log('='.repeat(50))
    console.log('Migration Summary:')
    console.log(`  Processed: ${processedCount}`)
    console.log(`  Skipped: ${skippedCount}`)
    console.log(`  Total: ${filesToProcess.length}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function migratePost(content, dateStr, filename, filePath) {
  // Step 1: Extract artist and album images from LightGallery components
  const artistImages = extractImagesFromGallery(content, 'artists')
  const albumImages = extractImagesFromGallery(content, 'albums')

  console.log(`  Found ${artistImages.length} artist images and ${albumImages.length} album images in galleries`)

  // Step 2: Remove LightGallery components
  content = removeLightGalleries(content)

  // Step 3: Extract Top Albums links to get artist/album mapping
  const albumMapping = extractAlbumMapping(content)

  // Step 4: Process each album section
  content = await integrateImagesIntoSections(content, dateStr, artistImages, albumImages, albumMapping, filePath)

  // Step 5: Update Top Albums links
  content = await updateTopAlbumsLinks(content, albumMapping)

  // Step 6: Add horizontal rule before Top Artists
  content = addHorizontalRuleBeforeTopArtists(content)

  return content
}

function extractImagesFromGallery(content, type) {
  const images = []

  // Match LightGallery components with multiline support
  const galleryRegex = /<LightGallery[\s\S]*?\/>/g
  const matches = [...content.matchAll(galleryRegex)]

  for (const match of matches) {
    const galleryContent = match[0]

    // Extract all image sources from this gallery
    const imgRegex = /\{\s*src:\s*"([^"]+)"\s*\}/g
    const imgMatches = [...galleryContent.matchAll(imgRegex)]

    for (const imgMatch of imgMatches) {
      const src = imgMatch[1]
      // Only add if it matches the type (artists or albums)
      if (src.includes(`/${type}/`)) {
        const filename = path.basename(src)
        images.push({ src, filename })
      }
    }
  }

  return images
}

function removeLightGalleries(content) {
  // Remove LightGallery components - handle both single-line and multi-line
  let cleaned = content.replace(
    /<LightGallery\s+layout=\{\{[^}]*imgs:\s*\[[^\]]*\][^}]*\}\}[^>]*options=\{\{[^}]*\}\}[^>]*\/>/gs,
    ''
  )

  // Also try simpler pattern
  cleaned = cleaned.replace(
    /<LightGallery[\s\S]*?\/>/g,
    ''
  )

  // Clean up extra blank lines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

function extractAlbumMapping(content) {
  const mapping = []

  // Extract from "## Top Albums" section
  const topAlbumsMatch = content.match(/## Top Albums[^#]*/s)
  if (!topAlbumsMatch) return mapping

  const topAlbumsSection = topAlbumsMatch[0]

  // Split into lines and process each
  const lines = topAlbumsSection.split('\n')

  for (const line of lines) {
    if (!line.trim().startsWith('- ')) continue

    // Pattern 1: Both album and artist linked: - [Album](link) by [Artist](link)
    let match = line.match(/^- \[([^\]]+)\]\([^)]+\) by \[([^\]]+)\]\([^)]+\)/)
    if (match) {
      mapping.push({ album: match[1], artist: match[2] })
      continue
    }

    // Pattern 2: Only artist linked: - Album Name by [Artist](link)
    match = line.match(/^- (.+?) by \[([^\]]+)\]\([^)]+\)/)
    if (match) {
      mapping.push({ album: match[1].trim(), artist: match[2] })
      continue
    }

    // Pattern 3: Only album linked: - [Album](link) by Artist Name
    match = line.match(/^- \[([^\]]+)\]\([^)]+\) by (.+)$/)
    if (match) {
      mapping.push({ album: match[1], artist: match[2].trim() })
      continue
    }
  }

  return mapping
}

async function integrateImagesIntoSections(content, dateStr, artistImages, albumImages, albumMapping, filePath) {
  // First pass: identify all H3 positions within each album section
  const sections = identifyAlbumSections(content)

  const lines = content.split('\n')
  const newLines = []
  let sectionIndex = 0
  let currentSection = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip any existing russ.fm links (we'll add them back in the right place)
    if (line.trim().startsWith('- View ') && line.includes('russ.fm')) {
      continue
    }

    // Check if we're at a new H2 album section
    if (line.startsWith('## ') && !line.includes('Top Artists') && !line.includes('Top Albums')) {
      // Before starting new section, add links for previous section
      if (currentSection && sectionIndex > 0 && !hasRussFmLinks(newLines, currentSection.album, currentSection.artist)) {
        await addRussFmLinks(newLines, currentSection.album, currentSection.artist, content, dateStr, filePath)
      }

      currentSection = sections.find(s => s.h2Line === i)
      sectionIndex++

      newLines.push(line)

      // Add album image if not exists and we have current section
      if (currentSection && !checkImageExists(lines, i, 3)) {
        const albumImage = await findOrFetchAlbumImage(albumImages, currentSection.album, currentSection.artist, dateStr, filePath)
        if (albumImage) {
          const altText = escapeQuotes(`${currentSection.album} by ${currentSection.artist}`)
          newLines.push('')
          newLines.push(`<Img src="${albumImage}" alt="${altText}" />`)
          newLines.push('')
        }
      }
      continue
    }

    // Check if we're at Top Artists or Top Albums - add links for last section before this
    if ((line.includes('## Top Artists') || line.includes('## Top Albums')) && currentSection) {
      if (!hasRussFmLinks(newLines, currentSection.album, currentSection.artist)) {
        await addRussFmLinks(newLines, currentSection.album, currentSection.artist, content, dateStr, filePath)
      }
      currentSection = null // Clear current section
    }

    // Add line
    newLines.push(line)

    // Check if we should add artist image after this line
    if (currentSection && currentSection.middleH3Line && i === currentSection.middleH3Line) {
      // Check if image doesn't already exist nearby
      if (!checkImageExists(lines, i, 5)) {
        const artistImage = await findOrFetchArtistImage(artistImages, currentSection.artist, dateStr, filePath)
        if (artistImage) {
          const altText = escapeQuotes(currentSection.artist)
          newLines.push('')
          newLines.push(`<Img src="${artistImage}" alt="${altText}" />`)
          newLines.push('')
        }
      }
    }
  }

  return newLines.join('\n')
}

function identifyAlbumSections(content) {
  const lines = content.split('\n')
  const sections = []
  let currentSection = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect H2 header
    if (line.startsWith('## ') && !line.includes('Top Artists') && !line.includes('Top Albums')) {
      // Save previous section (calculate middle H3 first)
      if (currentSection) {
        if (currentSection.h3Lines.length > 0) {
          const middleIndex = Math.floor(currentSection.h3Lines.length / 2)
          currentSection.middleH3Line = currentSection.h3Lines[middleIndex]
        }
        sections.push(currentSection)
      }

      // Extract album and artist (strip emojis from artist name for matching)
      const albumMatch = line.match(/## (.+?) by (.+?)$/)

      let artist = null
      let album = null
      if (albumMatch) {
        album = albumMatch[1].trim()
        // Remove emojis, variation selectors, and extra spaces from artist for matching
        artist = albumMatch[2]
          .trim()
          .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\uFE00-\uFE0F\u200D]/gu, '')
          .trim()

        currentSection = {
          h2Line: i,
          album: album,
          artist: artist,
          h3Lines: [],
          middleH3Line: null
        }
      } else {
        // Skip sections that don't match "Album by Artist" pattern
        currentSection = null
      }
    }

    // Collect H3 headers
    if (currentSection && line.startsWith('### ')) {
      currentSection.h3Lines.push(i)
    }

    // Detect end of section
    if (currentSection && (line.includes('## Top Artists') || line.includes('## Top Albums'))) {
      // Calculate middle H3 position
      if (currentSection.h3Lines.length > 0) {
        const middleIndex = Math.floor(currentSection.h3Lines.length / 2)
        currentSection.middleH3Line = currentSection.h3Lines[middleIndex]
      }
      sections.push(currentSection)
      currentSection = null
    }
  }

  // Save last section
  if (currentSection) {
    if (currentSection.h3Lines.length > 0) {
      const middleIndex = Math.floor(currentSection.h3Lines.length / 2)
      currentSection.middleH3Line = currentSection.h3Lines[middleIndex]
    }
    sections.push(currentSection)
  }

  return sections
}

function checkImageExists(lines, currentIndex, lookAhead) {
  for (let i = currentIndex + 1; i < Math.min(currentIndex + lookAhead, lines.length); i++) {
    if (lines[i] && lines[i].includes('<Img src=')) {
      return true
    }
  }
  return false
}

function hasRussFmLinks(lines, album, artist) {
  // Check last 10 lines for russ.fm links
  const checkLines = lines.slice(-10).join('\n')
  const hasAlbumLink = checkLines.includes(`View ${album} on [russ.fm]`)
  const hasArtistLink = checkLines.includes(`View ${artist} on [russ.fm]`)
  return hasAlbumLink || hasArtistLink
}

function findImageForAlbum(albumImages, albumName, dateStr) {
  const normalized = normalizeForFilename(albumName)

  for (const img of albumImages) {
    if (img.filename.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(img.filename.replace('.jpg', '').toLowerCase())) {
      return img.src
    }
  }

  // Fallback: construct expected path
  return `/assets/${dateStr}-listened-to-this-week/albums/${normalized}.jpg`
}

function findImageForArtist(artistImages, artistName, dateStr) {
  const normalized = normalizeForFilename(artistName)

  for (const img of artistImages) {
    if (img.filename.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(img.filename.replace('.jpg', '').toLowerCase())) {
      return img.src
    }
  }

  // Fallback: construct expected path
  return `/assets/${dateStr}-listened-to-this-week/artists/${normalized}.jpg`
}

async function findOrFetchAlbumImage(albumImages, albumName, artistName, dateStr, filePath) {
  // First try to find in extracted gallery images
  const normalized = normalizeForFilename(albumName)

  for (const img of albumImages) {
    if (img.filename.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(img.filename.replace('.jpg', '').toLowerCase())) {
      return img.src
    }
  }

  // Check if image file exists on disk
  const assetsPath = path.join(process.cwd(), 'public', 'assets', `${dateStr}-listened-to-this-week`, 'albums')
  const filename = `${normalized}.jpg`
  const localPath = path.join(assetsPath, filename)

  let fileExists = false
  try {
    await fs.access(localPath)
    fileExists = true
  } catch {
    fileExists = false
  }

  // If file doesn't exist, try to download from collection
  if (!fileExists) {
    const albumData = lookupAlbumData(artistName, albumName, collectionInfo.info)
    if (albumData?.album_image) {
      const imageHandler = new ImageHandler()

      if (!DRY_RUN) {
        await fs.mkdir(assetsPath, { recursive: true })

        try {
          console.log(`    📥 Downloading album image from: ${albumData.album_image}`)
          await imageHandler.downloadImage(albumData.album_image, assetsPath, normalized)
          console.log(`    ✅ Successfully downloaded: ${filename}`)
        } catch (error) {
          console.log(`    ⚠️  Failed to download album image: ${error.message}`)
        }
      } else {
        console.log(`    📥 Would download album image: ${normalized}.jpg`)
      }
    }
  }

  return `/assets/${dateStr}-listened-to-this-week/albums/${normalized}.jpg`
}

async function findOrFetchArtistImage(artistImages, artistName, dateStr, filePath) {
  // First try to find in extracted gallery images
  const normalized = normalizeForFilename(artistName)

  for (const img of artistImages) {
    if (img.filename.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(img.filename.replace('.jpg', '').toLowerCase())) {
      return img.src
    }
  }

  // Check if image file exists on disk
  const assetsPath = path.join(process.cwd(), 'public', 'assets', `${dateStr}-listened-to-this-week`, 'artists')
  const filename = `${normalized}.jpg`
  const localPath = path.join(assetsPath, filename)

  let fileExists = false
  try {
    await fs.access(localPath)
    fileExists = true
  } catch {
    fileExists = false
  }

  // If file doesn't exist, try to download from collection
  if (!fileExists) {
    const artistData = lookupArtistData(artistName, collectionInfo.info)
    if (artistData?.artist_image) {
      const imageHandler = new ImageHandler()

      if (!DRY_RUN) {
        await fs.mkdir(assetsPath, { recursive: true })

        try {
          await imageHandler.downloadImage(artistData.artist_image, assetsPath, normalized)
          console.log(`    📥 Downloaded artist image: ${filename}`)
        } catch (error) {
          console.log(`    ⚠️  Failed to download artist image: ${error.message}`)
        }
      } else {
        console.log(`    📥 Would download artist image: ${normalized}.jpg`)
      }
    }
  }

  return `/assets/${dateStr}-listened-to-this-week/artists/${normalized}.jpg`
}

function normalizeText(text) {
  if (!text) return ''
  return text.normalize('NFKD').toLowerCase().trim()
}

/**
 * Normalize text for filenames - convert special characters to ASCII equivalents
 */
function normalizeForFilename(text) {
  if (!text) return ''

  // First normalize unicode characters
  let normalized = text.normalize('NFD')

  // Replace special Icelandic and other characters with ASCII equivalents
  const charMap = {
    'á': 'a', 'Á': 'A',
    'ð': 'd', 'Ð': 'D',
    'é': 'e', 'É': 'E',
    'í': 'i', 'Í': 'I',
    'ó': 'o', 'Ó': 'O',
    'ú': 'u', 'Ú': 'U',
    'ý': 'y', 'Ý': 'Y',
    'þ': 'th', 'Þ': 'Th',
    'æ': 'ae', 'Æ': 'Ae',
    'ö': 'o', 'Ö': 'O',
    'ø': 'o', 'Ø': 'O',
    'å': 'a', 'Å': 'A',
    'ü': 'u', 'Ü': 'U',
    'ä': 'a', 'Ä': 'A',
    'ë': 'e', 'Ë': 'E',
    'ï': 'i', 'Ï': 'I',
  }

  // Replace each special character
  for (const [special, replacement] of Object.entries(charMap)) {
    normalized = normalized.replace(new RegExp(special, 'g'), replacement)
  }

  // Remove any remaining diacritics
  normalized = normalized.replace(/[\u0300-\u036f]/g, '')

  // Replace spaces and special chars with hyphens
  normalized = normalized.replace(/\s+/g, '-')
                       .replace(/[\/\\]/g, '-')
                       .replace(/[']/g, '')
                       .replace(/[^\w-]/g, '-')
                       .replace(/-+/g, '-')
                       .replace(/^-|-$/g, '')

  return normalized
}

function lookupArtistData(artist, collectionInfo) {
  const normalizedArtist = normalizeText(artist)
  for (const [key, data] of Object.entries(collectionInfo)) {
    if (typeof key === 'string' && normalizeText(key) === normalizedArtist) {
      return {
        artist_link: data.artist_link,
        artist_image: data.artist_image
      }
    }
  }
  return null
}

function lookupAlbumData(artist, album, collectionInfo) {
  const normalizedArtist = normalizeText(artist)
  const normalizedAlbum = normalizeText(album)
  for (const [key, data] of Object.entries(collectionInfo)) {
    if (key.includes('|||')) {
      const [keyArtist, keyAlbum] = key.split('|||')
      if (normalizeText(keyArtist) === normalizedArtist && normalizeText(keyAlbum) === normalizedAlbum) {
        return {
          album_link: data.album_link,
          album_image: data.album_image
        }
      }
    }
  }
  return null
}

async function addRussFmLinks(lines, album, artist, content, dateStr, filePath) {
  // First try to extract actual links from content
  let albumLink = null
  let artistLink = null

  const albumLinkMatch = content.match(new RegExp(`\\[${escapeRegex(album)}\\]\\(([^)]+)\\)`, 'i'))
  const artistLinkMatch = content.match(new RegExp(`\\[${escapeRegex(artist)}\\]\\(([^)]+)\\)`, 'i'))

  if (albumLinkMatch && albumLinkMatch[1].includes('russ.fm')) {
    albumLink = albumLinkMatch[1]
  }
  if (artistLinkMatch && artistLinkMatch[1].includes('russ.fm')) {
    artistLink = artistLinkMatch[1]
  }

  // If links not found in content, try collection
  if (!albumLink) {
    const albumData = lookupAlbumData(artist, album, collectionInfo.info)
    if (albumData?.album_link) {
      albumLink = albumData.album_link
    }
  }
  if (!artistLink) {
    const artistData = lookupArtistData(artist, collectionInfo.info)
    if (artistData?.artist_link) {
      artistLink = artistData.artist_link
    }
  }

  // Only add if we found at least one link
  if (albumLink || artistLink) {
    lines.push('')
    if (albumLink) {
      lines.push(`- View ${album} on [russ.fm](${albumLink})`)
    }
    if (artistLink) {
      lines.push(`- View ${artist} on [russ.fm](${artistLink})`)
    }
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function updateTopAlbumsLinks(content, albumMapping) {
  const lines = content.split('\n')
  const newLines = []
  let inTopAlbums = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect Top Albums section
    if (line.includes('## Top Albums')) {
      inTopAlbums = true
      newLines.push(line)
      continue
    }

    // Exit Top Albums section
    if (inTopAlbums && line.startsWith('## ')) {
      inTopAlbums = false
      newLines.push(line)
      continue
    }

    // Process album list items in Top Albums section
    if (inTopAlbums && line.trim().startsWith('- ')) {
      // Match pattern: - [Album](link) by [Artist](link)  OR  - Album by [Artist](link)
      const linkedMatch = line.match(/^- \[([^\]]+)\]\([^)]+\) by \[([^\]]+)\]\([^)]+\)/)
      const unlinkedMatch = line.match(/^- ([^[]+?) by \[([^\]]+)\]\([^)]+\)/)

      if (linkedMatch || unlinkedMatch) {
        const albumName = linkedMatch ? linkedMatch[1] : unlinkedMatch[1].trim()
        const artistName = linkedMatch ? linkedMatch[2] : unlinkedMatch[2]

        // Look up album link from collection
        const albumData = lookupAlbumData(artistName, albumName, collectionInfo.info)
        const artistData = lookupArtistData(artistName, collectionInfo.info)

        // Reconstruct the line with proper links
        const albumLink = albumData?.album_link || null
        const artistLink = artistData?.artist_link || null

        if (albumLink && artistLink) {
          newLines.push(`- [${albumName}](${albumLink}) by [${artistName}](${artistLink})`)
        } else if (albumLink) {
          // Extract artist link from original line
          const artistLinkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (artistLinkMatch && artistLinkMatch[1] === artistName) {
            newLines.push(`- [${albumName}](${albumLink}) by [${artistName}](${artistLinkMatch[2]})`)
          } else {
            newLines.push(line) // Keep original if can't parse
          }
        } else {
          newLines.push(line) // Keep original if no album link found
        }
      } else {
        newLines.push(line)
      }
    } else {
      newLines.push(line)
    }
  }

  return newLines.join('\n')
}

function addHorizontalRuleBeforeTopArtists(content) {
  return content.replace(
    /\n(## Top Artists \(Week \d+\))/,
    '\n\n---\n\n$1'
  )
}

// Run the migration
main()
