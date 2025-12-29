import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { LastFMClient } from './lib/lastfm-client.js'
import { CollectionManager } from './lib/collection-manager.js'
import { ContentGenerator } from './lib/content-generator.js'
import { ImageHandler } from './lib/image-handler.js'
import { BlogPostRenderer } from './lib/blog-post-renderer.js'
import { ConfigLoader } from './lib/config-loader.js'
import { normalizeText, lookupArtistData, lookupAlbumData, isVariousArtists } from './lib/text-utils.js'
import { createFALCollage } from './fal-collage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const weekStartArg = args.find(arg => arg.startsWith('--week_start='))
    const debugMode = args.includes('--debug')

    // Calculate week dates
    const weekStart = weekStartArg
      ? new Date(weekStartArg.split('=')[1])
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    console.log(`Generating blog post for week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`)

    if (debugMode) {
      console.log('Running in debug mode - only processing one album')
    }

    // Load configuration
    const configLoader = new ConfigLoader()
    await configLoader.load()
    const numberOfItems = configLoader.getNumberOfItems()
    const coverRange = configLoader.getCoverImageRange()

    // Initialize clients
    const lastfm = new LastFMClient(
      process.env.LASTFM_USER,
      process.env.LASTFM_API_KEY
    )
    const collectionManager = new CollectionManager(process.env.COLLECTION_URL)
    const contentGenerator = new ContentGenerator(configLoader)
    const imageHandler = new ImageHandler()
    const renderer = new BlogPostRenderer()

    // Setup folder structure
    const dateStr = weekEnd.toISOString().split('T')[0]
    const weekNumber = getWeekNumber(weekStart)
    const postPath = path.join(process.cwd(), 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week.mdx`)
    const albumsFolder = path.join(process.cwd(), 'public', 'assets', `${dateStr}-listened-to-this-week`, 'albums')
    const artistsFolder = path.join(process.cwd(), 'public', 'assets', `${dateStr}-listened-to-this-week`, 'artists')

    await fs.mkdir(albumsFolder, { recursive: true })
    await fs.mkdir(artistsFolder, { recursive: true })

    // Fetch data
    console.log('Fetching Last.fm data...')
    const startTimestamp = Math.floor(weekStart.getTime() / 1000)
    const endTimestamp = Math.floor(weekEnd.getTime() / 1000)

    const [artistData, albumData, collectionInfo] = await Promise.all([
      lastfm.getWeeklyArtistChart(startTimestamp, endTimestamp),
      lastfm.getWeeklyAlbumChart(startTimestamp, endTimestamp),
      collectionManager.getCollectionData()
    ])

    // Process data
    console.log('Processing artist and album data...')
    let topArtists = processArtistData(artistData, collectionInfo.originalCases, debugMode ? 1 : numberOfItems)
    const topAlbums = processAlbumData(albumData, collectionInfo.originalCases, debugMode ? 1 : numberOfItems)

    // Filter out "Various Artists" from the top artists list
    const beforeFilter = topArtists.length
    topArtists = topArtists.filter(([artist]) => !isVariousArtists(artist))
    if (beforeFilter > topArtists.length) {
      console.log(`Filtered out ${beforeFilter - topArtists.length} "Various Artists" entries`)
    }

    // Print links for verification
    printLinks(collectionInfo.info, topArtists, topAlbums)

    // Wait 5 seconds for verification
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Generate content
    console.log('Generating blog post content...')
    const [title, summary] = await contentGenerator.generateTitleAndSummary(
      dateStr,
      weekNumber,
      topArtists,
      topAlbums
    )

    console.log('Researching albums...')
    const blogSections = await contentGenerator.researchAlbums(topAlbums, collectionInfo.info, dateStr)

    // Download images
    console.log('Downloading images...')
    await imageHandler.downloadArtistImages(topArtists, collectionInfo.info, artistsFolder)
    await imageHandler.downloadAlbumImages(topAlbums, collectionInfo.info, albumsFolder)

    // Generate collage cover
    console.log('Generating cover collage...')
    const srcAssetsFolder = path.join(process.cwd(), 'src', 'assets', `${dateStr}-listened-to-this-week`)
    await fs.mkdir(srcAssetsFolder, { recursive: true })

    const albumFiles = await fs.readdir(albumsFolder)
    const albumImagePaths = albumFiles
      .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
      .map(file => path.join(albumsFolder, file))

    const coverOutputPath = path.join(srcAssetsFolder, `tunes-cover-${dateStr}-listened-to-this-week.png`)

    // Use FAL.ai collage with smart prompt generation
    console.log('Generating AI-powered collage with smart prompt...')
    const dateSeed = new Date(dateStr).getTime()
    await createFALCollage(albumImagePaths, coverOutputPath, {
      seed: dateSeed,
      width: 1400,
      height: 800,
      strategy: 'balanced',
      debug: debugMode
    })

    console.log(`✅ Cover collage generated: ${coverOutputPath}`)

    // Render blog post
    console.log('Rendering blog post...')
    const randomNumber = String(
      Math.floor(Math.random() * (coverRange.max - coverRange.min + 1)) + coverRange.min
    ).padStart(3, '0')

    await renderer.render({
      postPath,
      dateStr,
      weekNumber,
      topArtists,
      topAlbums,
      collectionInfo: collectionInfo.info,
      title,
      summary,
      blogSections,
      randomNumber,
      albumsFolder,
      artistsFolder
    })

    console.log(`✅ Successfully generated blog post for week ${weekNumber}`)
    console.log(`📁 Post location: ${postPath}`)

  } catch (error) {
    console.error('Error generating blog post:', error)
    process.exit(1)
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function processArtistData(artistData, originalCases, limit) {
  const artists = {}
  const originalEntries = {}

  for (const artist of artistData.weeklyartistchart.artist) {
    const artistName = artist.name
    const key = normalizeText(artistName)
    artists[key] = (artists[key] || 0) + parseInt(artist.playcount)
    originalEntries[key] = artistName
  }

  return Object.entries(artists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => [originalEntries[key] || key, count])
}

function processAlbumData(albumData, originalCases, limit) {
  const albums = {}
  const originalEntries = {}

  // First pass: Collect all entries
  for (const album of albumData.weeklyalbumchart.album) {
    const artist = album.artist['#text']
    const albumName = album.name
    const key = `${normalizeText(artist)}|||${normalizeText(albumName)}`
    albums[key] = (albums[key] || 0) + parseInt(album.playcount)
    originalEntries[key] = [artist, albumName]
  }

  // Second pass: Group by normalized album name to find split albums
  const albumsByName = {}
  for (const [key, count] of Object.entries(albums)) {
    const [artistKey, albumKey] = key.split('|||')
    if (!albumsByName[albumKey]) {
      albumsByName[albumKey] = []
    }
    albumsByName[albumKey].push({
      key,
      artistKey,
      count,
      originalArtist: originalEntries[key][0],
      originalAlbum: originalEntries[key][1]
    })
  }

  // Common titles that shouldn't be merged (e.g. "Greatest Hits" by different artists)
  const commonTitles = [
    'greatest hits',
    'greatest hits ii',
    'greatest hits vol. 1',
    'greatest hits vol. 2',
    'the best of',
    'best of',
    'live',
    'unplugged',
    'essential',
    'gold',
    'platinum collection',
    'anthology',
    'collection',
    'definitive collection'
  ]

  const mergedAlbums = {}
  const mergedOriginalEntries = {}

  // Process groups and merge if necessary
  for (const [albumName, entries] of Object.entries(albumsByName)) {
    let shouldMerge = false
    let dominantArtist = null

    // Only consider merging if there are multiple entries for the same album name
    if (entries.length > 1 && !commonTitles.includes(albumName)) {
      const totalPlays = entries.reduce((sum, entry) => sum + entry.count, 0)

      // Find if there's a dominant artist (> 70% of plays)
      const sortedEntries = [...entries].sort((a, b) => b.count - a.count)
      const topEntry = sortedEntries[0]

      if (topEntry.count / totalPlays > 0.7) {
        shouldMerge = true
        dominantArtist = topEntry
        console.log(`Merging split album "${topEntry.originalAlbum}": attributing ${totalPlays} plays to ${topEntry.originalArtist} (Dominance: ${Math.round((topEntry.count / totalPlays) * 100)}%)`)
      }
    }

    if (shouldMerge && dominantArtist) {
      // Merge all entries into the dominant artist
      const key = dominantArtist.key
      const totalPlays = entries.reduce((sum, entry) => sum + entry.count, 0)

      mergedAlbums[key] = totalPlays
      mergedOriginalEntries[key] = [dominantArtist.originalArtist, dominantArtist.originalAlbum]
    } else {
      // Keep entries separate
      for (const entry of entries) {
        mergedAlbums[entry.key] = entry.count
        mergedOriginalEntries[entry.key] = [entry.originalArtist, entry.originalAlbum]
      }
    }
  }

  return Object.entries(mergedAlbums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => [mergedOriginalEntries[key] || key.split('|||'), count])
}

function printLinks(collectionInfo, topArtists, topAlbums) {
  console.log('\n=== Artist Links ===')
  for (const [artist] of topArtists) {
    const artistData = lookupArtistData(artist, collectionInfo)
    if (artistData) {
      console.log(`${artist}: ${artistData.link || 'No link available'}`)
    } else {
      console.log(`${artist}: No data found`)
    }
  }

  console.log('\n=== Album Links ===')
  for (const [[artist, album]] of topAlbums) {
    const albumData = lookupAlbumData(artist, album, collectionInfo)
    if (albumData) {
      console.log(`${album} by ${artist}: ${albumData.link || 'No link available'}`)
    } else {
      console.log(`${album} by ${artist}: No data found`)
    }
  }
  console.log('')
}

main()
