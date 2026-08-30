import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { LastFMClient } from './lib/lastfm-client.js'
import { CollectionManager } from './lib/collection-manager.js'
import { ContentGenerator } from './lib/content-generator.js'
import { ImageHandler } from './lib/image-handler.js'
import { BlogPostRenderer } from './lib/blog-post-renderer.js'
import { ConfigLoader } from './lib/config-loader.js'
import { normalizeText, lookupArtistData, lookupAlbumData, isVariousArtists, normalizeForFilename } from './lib/text-utils.js'
import { createFALTunesCover } from './fal-tunes-cover.js'
import { createFALArtistPortrait } from './fal-tunes-artists.js'
import { spawnSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const weekStartArg = args.find(arg => arg.startsWith('--week_start='))
    const debugMode = args.includes('--debug')
    const testingMode = args.includes('--testing')
    const takeArg = args.find(arg => arg.startsWith('--take='))
    const takeCount = takeArg ? parseInt(takeArg.split('=')[1], 10) : null
    const coverHintArg = args.find(arg => arg.startsWith('--cover-hint='))
    const coverHint = coverHintArg ? coverHintArg.slice('--cover-hint='.length) : ''
    const artistHintArg = args.find(arg => arg.startsWith('--artist-hint='))
    const artistHint = artistHintArg ? artistHintArg.slice('--artist-hint='.length) : ''

    // Calculate week dates
    const weekStart = weekStartArg
      ? new Date(weekStartArg.split('=')[1])
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    console.log(`Generating blog post for week: ${weekStart.toISOString().split('T')[0]} to ${weekEnd.toISOString().split('T')[0]}`)

    if (debugMode) {
      console.log('Running in debug mode - only processing one album')
    }
    if (testingMode) {
      console.log('Running in testing mode - output redirected to output/ folder')
    }
    if (takeCount) {
      console.log(`Taking ${takeCount} items`)
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
    const baseDir = testingMode
      ? path.join(process.cwd(), 'output', `${dateStr}-listened-to-this-week`)
      : process.cwd()
    const postPath = testingMode
      ? path.join(baseDir, `${dateStr}-listened-to-this-week.mdx`)
      : path.join(baseDir, 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week.mdx`)
    const albumsFolder = testingMode
      ? path.join(baseDir, 'albums')
      : path.join(baseDir, 'public', 'assets', `${dateStr}-listened-to-this-week`, 'albums')
    const artistsFolder = testingMode
      ? path.join(baseDir, 'artists')
      : path.join(baseDir, 'public', 'assets', `${dateStr}-listened-to-this-week`, 'artists')

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
    const itemCount = takeCount || (debugMode ? 1 : numberOfItems)
    // Albums first: folding a compilation tells us which artist plays came only from that
    // compilation, so the artist chart can discount them.
    const { topAlbums, compilationArtistPlays } = processAlbumData(albumData, collectionInfo.info, itemCount)
    let topArtists = processArtistData(artistData, compilationArtistPlays, itemCount)

    // Keep "Various Artists" out of the *artists* list only. It is a release credit, not a
    // performer: there is nobody to photograph for the group portrait and no artist image to
    // download. Compilations still flow through topAlbums, so they get a full written section,
    // their sleeve, their russ.fm album link, and a place in the header cover's source pool.
    // Do not "fix" this by removing the filter.
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

    // Generate the cover scene assets.
    console.log('Generating cover image...')
    const srcAssetsFolder = testingMode
      ? baseDir
      : path.join(process.cwd(), 'src', 'assets', `${dateStr}-listened-to-this-week`)
    await fs.mkdir(srcAssetsFolder, { recursive: true })

    const albumFiles = await fs.readdir(albumsFolder)
    const albumImagePathByFile = new Map(
      albumFiles
        .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
        .map(file => [file, path.join(albumsFolder, file)])
    )
    const rankedAlbumImagePaths = topAlbums
      .map(([[, album]]) => albumImagePathByFile.get(`${normalizeForFilename(album)}.jpg`))
      .filter(Boolean)
    const remainingAlbumImagePaths = [...albumImagePathByFile.values()]
      .filter(imagePath => !rankedAlbumImagePaths.includes(imagePath))
      .sort((a, b) => a.localeCompare(b))
    const albumImagePaths = [...rankedAlbumImagePaths, ...remainingAlbumImagePaths]

    const coverOutputPath = path.join(srcAssetsFolder, `tunes-cover-${dateStr}-listened-to-this-week.png`)

    // Summarise the selected album covers, then let the AI art director choose a complete
    // creative direction from those visual observations alone.
    console.log('Generating AI cover scene...')
    const dateSeed = new Date(dateStr).getTime()
    await createFALTunesCover(albumImagePaths, coverOutputPath, {
      seed: dateSeed,
      width: 1400,
      height: 800,
      hint: coverHint,
      recordHistory: !testingMode,
      dateLabel: dateStr,
      debug: debugMode
    })

    console.log(`✅ Cover image generated: ${coverOutputPath}`)

    // Generate the artist group portrait (body image). Best-effort: a failure here must not
    // break the post, so on error we carry on with no portrait and the placeholder collapses.
    console.log('Generating artist group portrait...')
    const artistFiles = await fs.readdir(artistsFolder)
    const artistImagePathByFile = new Map(
      artistFiles
        .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
        .map(file => [file, path.join(artistsFolder, file)])
    )
    const rankedArtistImagePaths = topArtists
      .map(([artist]) => artistImagePathByFile.get(`${normalizeForFilename(artist)}.jpg`))
      .filter(Boolean)
    const remainingArtistImagePaths = [...artistImagePathByFile.values()]
      .filter(imagePath => !rankedArtistImagePaths.includes(imagePath))
      .sort((a, b) => a.localeCompare(b))
    const artistImagePaths = [...rankedArtistImagePaths, ...remainingArtistImagePaths]

    // The portrait is a body image referenced by a /assets/... public path, so it lives in
    // public/assets/{week}/ alongside the album/artist galleries (not src/assets).
    const portraitOutputDir = testingMode
      ? baseDir
      : path.join(process.cwd(), 'public', 'assets', `${dateStr}-listened-to-this-week`)
    const portraitOutputPath = path.join(portraitOutputDir, `tunes-artists-${dateStr}-listened-to-this-week.png`)

    let artistPortrait = null
    if (artistImagePaths.length > 0) {
      try {
        await createFALArtistPortrait(artistImagePaths, portraitOutputPath, {
          seed: dateSeed,
          width: 1400,
          height: 800,
          backend: configLoader.getArtistPortraitBackend(),
          inputs: configLoader.getArtistPortraitInputs(),
          candidates: configLoader.getArtistPortraitCandidates(),
          hint: artistHint,
          recordHistory: !testingMode,
          dateLabel: dateStr,
          debug: debugMode
        })
        artistPortrait = `/assets/${dateStr}-listened-to-this-week/tunes-artists-${dateStr}-listened-to-this-week.png`
        console.log(`✅ Artist portrait generated: ${portraitOutputPath}`)
      } catch (error) {
        console.warn(`⚠ Artist portrait generation failed, continuing without it: ${error.message}`)
      }
    } else {
      console.warn('⚠ No artist images available; skipping artist portrait')
    }

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
      artistsFolder,
      artistPortrait
    })

    console.log(`✅ Successfully generated blog post for week ${weekNumber}`)
    console.log(`📁 Post location: ${postPath}`)

    // Refresh the sorted album/artist index that powers the /tunes/artist/* and
    // /tunes/album/* programmatic SEO pages.
    const indexerScript = path.join(__dirname, 'build-tunes-index.js')
    const result = spawnSync(process.execPath, [indexerScript], { stdio: 'inherit' })
    if (result.status !== 0) {
      console.warn('⚠️  build-tunes-index.js exited with a non-zero status; index may be stale.')
    }

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

function processArtistData(artistData, compilationArtistPlays, limit) {
  const artists = {}
  const originalEntries = {}

  for (const artist of artistData.weeklyartistchart.artist) {
    const artistName = artist.name
    const key = normalizeText(artistName)
    artists[key] = (artists[key] || 0) + parseInt(artist.playcount)
    originalEntries[key] = artistName
  }

  // A compilation's track artists each show up in the weekly artist chart, usually with a
  // single play. Those plays belong to the compilation's section, not to a top-artist slot, so
  // discount them - an artist played on their own account keeps that part of their count and
  // stays in the list. Only artists left with nothing are dropped.
  if (compilationArtistPlays) {
    for (const [key, plays] of compilationArtistPlays) {
      if (artists[key] === undefined) continue
      artists[key] -= plays
      if (artists[key] <= 0) delete artists[key]
    }
  }

  return Object.entries(artists)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => [originalEntries[key] || key, count])
}

function processAlbumData(albumData, collectionInfo, limit) {
  const albums = {}
  const originalEntries = {}
  // Normalised artist name -> plays folded into a compilation, for processArtistData
  const compilationArtistPlays = new Map()

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

    // --- Compilation folding ---
    // Last.fm reports a compilation two different ways depending on how the tracks were
    // tagged: sometimes one row credited "Various Artists", but often one row per track
    // artist, all sharing the album name with a single play each (14 rows for "Empire
    // Records - The Soundtrack"). The dominance test below can never merge that shape - no
    // artist holds 70% of one play each - so without this the week would get a separate
    // written section per track. Fold them into one "Various Artists" entry.
    //
    // Only entries whose own artist does NOT own an album of that name are folded, so a real
    // artist's record is never mis-credited to a compilation that happens to share its title.
    let remainingEntries = entries
    if (collectionInfo && !commonTitles.includes(albumName) && lookupAlbumData('Various', albumName, collectionInfo)) {
      const isCompilationEntry = entry =>
        isVariousArtists(entry.originalArtist) ||
        !lookupAlbumData(entry.originalArtist, albumName, collectionInfo)

      const compilationEntries = entries.filter(isCompilationEntry)

      if (compilationEntries.length > 0) {
        const totalPlays = compilationEntries.reduce((sum, entry) => sum + entry.count, 0)
        const [{ originalAlbum }] = [...compilationEntries].sort((a, b) => b.count - a.count)
        const key = `${normalizeText('Various Artists')}|||${albumName}`

        mergedAlbums[key] = (mergedAlbums[key] || 0) + totalPlays
        mergedOriginalEntries[key] = ['Various Artists', originalAlbum]

        // Record what each real artist contributed so the artist chart can discount it.
        // "Various Artists" rows have no real artist behind them and are filtered from the
        // artist list anyway, so they are not recorded.
        for (const entry of compilationEntries) {
          if (isVariousArtists(entry.originalArtist)) continue
          const artistKey = normalizeText(entry.originalArtist)
          compilationArtistPlays.set(artistKey, (compilationArtistPlays.get(artistKey) || 0) + entry.count)
        }

        if (compilationEntries.length > 1) {
          console.log(`Folded ${compilationEntries.length} track-artist entries for compilation "${originalAlbum}" into one section (${totalPlays} plays)`)
        }

        remainingEntries = entries.filter(entry => !compilationEntries.includes(entry))
        if (remainingEntries.length === 0) continue
      }
    }

    const entriesToProcess = remainingEntries

    // Only consider merging if there are multiple entries for the same album name
    if (entriesToProcess.length > 1 && !commonTitles.includes(albumName)) {
      const totalPlays = entriesToProcess.reduce((sum, entry) => sum + entry.count, 0)

      // Find if there's a dominant artist (> 70% of plays)
      const sortedEntries = [...entriesToProcess].sort((a, b) => b.count - a.count)
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
      const totalPlays = entriesToProcess.reduce((sum, entry) => sum + entry.count, 0)

      mergedAlbums[key] = totalPlays
      mergedOriginalEntries[key] = [dominantArtist.originalArtist, dominantArtist.originalAlbum]
    } else {
      // Keep entries separate
      for (const entry of entriesToProcess) {
        mergedAlbums[entry.key] = entry.count
        mergedOriginalEntries[entry.key] = [entry.originalArtist, entry.originalAlbum]
      }
    }
  }

  const topAlbums = Object.entries(mergedAlbums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, count]) => [mergedOriginalEntries[key] || key.split('|||'), count])

  return { topAlbums, compilationArtistPlays }
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

export { processAlbumData, processArtistData }

// Only run when invoked directly, so the pure chart-processing helpers above can be imported
// by tests without kicking off a real generation run.
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
