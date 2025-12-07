import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { LastFMYearClient } from './lib/lastfm-year-client.js'
import { YearStatsCalculator } from './lib/year-stats-calculator.js'
import { CollectionManager } from './lib/collection-manager.js'
import { ContentGenerator } from './lib/content-generator.js'
import { ImageHandler } from './lib/image-handler.js'
import { ConfigLoader } from './lib/config-loader.js'
import { normalizeText, normalizeForFilename, lookupArtistData, lookupAlbumData, isVariousArtists, escapeQuotes } from './lib/text-utils.js'
import { createStripCollage } from './strip-collage.js'
import { generateWrappedCover } from './wrapped-cover-generator.js'
import { generateGenreBarChart, generateMonthlyChart, saveSvgChart } from './lib/svg-chart-generator.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration
const CONFIG = {
  featuredAlbums: 5,         // Number of albums to get AI-generated deep dives
  topArtistsToShow: 25,      // Top artists in the list
  topAlbumsToShow: 50,       // Top albums in the list
  hiddenGemsToShow: 6,       // Hidden gems to highlight
  newDiscoveriesToShow: 10   // New releases from the year
}

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2)
    const yearArg = args.find(arg => arg.startsWith('--year='))
    const debugMode = args.includes('--debug')
    const skipResearch = args.includes('--skip-research')
    const useCache = args.includes('--use-cache')

    // Default to current year if not specified
    const year = yearArg ? parseInt(yearArg.split('=')[1]) : new Date().getFullYear()

    console.log(`\n🎵 Generating ${year} Year in Music Wrapped`)
    console.log('='.repeat(50))

    if (debugMode) {
      console.log('Running in debug mode - limited processing')
    }

    // Initialize clients
    console.log('\n📡 Initializing clients...')
    const lastfm = new LastFMYearClient(
      process.env.LASTFM_USER,
      process.env.LASTFM_API_KEY
    )
    const collectionManager = new CollectionManager(process.env.COLLECTION_URL)

    // Load configuration for content generation
    const configLoader = new ConfigLoader()
    await configLoader.load()
    const contentGenerator = new ContentGenerator(configLoader)
    const imageHandler = new ImageHandler()

    // Setup folder structure
    const postSlug = `${year}-year-in-music`
    const postPath = path.join(process.cwd(), 'src', 'content', 'tunes', `${postSlug}.mdx`)
    const albumsFolder = path.join(process.cwd(), 'public', 'assets', postSlug, 'albums')
    const artistsFolder = path.join(process.cwd(), 'public', 'assets', postSlug, 'artists')
    const chartsFolder = path.join(process.cwd(), 'public', 'assets', postSlug, 'charts')
    const srcAssetsFolder = path.join(process.cwd(), 'src', 'assets', postSlug)

    await fs.mkdir(albumsFolder, { recursive: true })
    await fs.mkdir(artistsFolder, { recursive: true })
    await fs.mkdir(chartsFolder, { recursive: true })
    await fs.mkdir(srcAssetsFolder, { recursive: true })

    // Check for cached data
    const cacheFile = path.join(__dirname, `.year-wrapped-cache-${year}.json`)
    let wrappedData

    if (useCache) {
      try {
        const cached = await fs.readFile(cacheFile, 'utf-8')
        wrappedData = JSON.parse(cached)
        console.log('\n📦 Using cached Last.fm data')
      } catch {
        console.log('\n⚠️  No cache found, fetching fresh data')
        wrappedData = null
      }
    }

    if (!wrappedData) {
      // Fetch year-end data from Last.fm
      console.log('\n📊 Fetching Last.fm data for', year)
      console.log('This may take a few minutes as we aggregate weekly charts...')
      wrappedData = await lastfm.getYearWrappedData(year)

      // Cache the data for potential re-runs
      await fs.writeFile(cacheFile, JSON.stringify(wrappedData, null, 2))
      console.log(`\n💾 Cached data to ${cacheFile}`)
    }

    // Fetch collection data
    console.log('\n📚 Fetching collection metadata...')
    const collectionInfo = await collectionManager.getCollectionData()

    // Calculate insights
    console.log('\n🔮 Calculating wrapped insights...')
    const statsCalculator = new YearStatsCalculator(wrappedData, collectionInfo.info)
    const insights = statsCalculator.getAllInsights(collectionInfo.info)

    // Print summary
    printSummary(insights)

    // Process top artists and albums
    const topArtists = wrappedData.topArtists
      .filter(a => !isVariousArtists(a.name))
      .slice(0, CONFIG.topArtistsToShow)
      .map(a => [a.name, a.playcount])

    const topAlbums = wrappedData.topAlbums
      .filter(a => !isVariousArtists(a.artist))
      .slice(0, CONFIG.topAlbumsToShow)
      .map(a => [[a.artist, a.album], a.playcount])

    // Featured albums for deep dives
    const featuredAlbums = topAlbums.slice(0, debugMode ? 1 : CONFIG.featuredAlbums)

    // Print links for verification
    printLinks(collectionInfo.info, topArtists.slice(0, 10), featuredAlbums)

    // Wait for verification
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Download images
    console.log('\n🖼️  Downloading images...')
    await imageHandler.downloadArtistImages(topArtists.slice(0, 20), collectionInfo.info, artistsFolder)
    await imageHandler.downloadAlbumImages(featuredAlbums, collectionInfo.info, albumsFolder)

    // Download hidden gems album images
    const hiddenGems = insights.hiddenGems || []
    if (hiddenGems.length > 0) {
      console.log('Downloading hidden gems album images...')
      const hiddenGemsAlbums = hiddenGems.map(gem => [[gem.artist, gem.album], gem.playcount])
      await imageHandler.downloadAlbumImages(hiddenGemsAlbums, collectionInfo.info, albumsFolder)
    }

    // Download new discoveries album images
    const newDiscoveries = insights.newDiscoveries || []
    if (newDiscoveries.length > 0) {
      console.log('Downloading new discoveries album images...')
      const newDiscoveriesAlbums = newDiscoveries.map(album => [[album.artist, album.album], album.playcount])
      await imageHandler.downloadAlbumImages(newDiscoveriesAlbums, collectionInfo.info, albumsFolder)
    }

    // Generate AI content for featured albums (unless skipped)
    let blogSections = ''
    if (!skipResearch) {
      console.log('\n✍️  Generating AI content for featured albums...')
      blogSections = await generateFeaturedAlbumSections(
        featuredAlbums,
        collectionInfo.info,
        contentGenerator,
        postSlug
      )
    } else {
      console.log('\n⏭️  Skipping AI research (--skip-research flag)')
      blogSections = generateSimpleFeaturedSections(featuredAlbums, collectionInfo.info, postSlug)
    }

    // Generate cover
    console.log('\n🎨 Generating AI cover...')
    const coverOutputPath = path.join(srcAssetsFolder, `wrapped-cover-${year}.png`)

    // Get top 6 artist and album image paths
    const artistFiles = await fs.readdir(artistsFolder)
    const artistImagePaths = artistFiles
      .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
      .slice(0, 6)
      .map(file => path.join(artistsFolder, file))

    const albumFiles = await fs.readdir(albumsFolder)
    const albumImagePaths = albumFiles
      .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
      .slice(0, 6)
      .map(file => path.join(albumsFolder, file))

    if (artistImagePaths.length >= 5 && albumImagePaths.length >= 5 && process.env.FAL_KEY) {
      // Use AI-generated cover
      try {
        await generateWrappedCover(artistImagePaths, albumImagePaths, coverOutputPath, {
          year,
          debug: debugMode
        })
        console.log(`✅ AI cover generated: ${coverOutputPath}`)
      } catch (error) {
        console.error(`  ⚠️ AI cover generation failed: ${error.message}`)
        console.log('  Falling back to strip collage...')
        const dateSeed = new Date(year, 0, 1).getTime()
        await createStripCollage(albumImagePaths, coverOutputPath, {
          seed: dateSeed,
          width: 1400,
          height: 800
        })
        console.log(`✅ Fallback cover generated: ${coverOutputPath}`)
      }
    } else {
      // Fallback to strip collage if not enough images or no FAL_KEY
      if (!process.env.FAL_KEY) {
        console.log('  No FAL_KEY found, using strip collage...')
      } else {
        console.log('  Not enough images for AI cover, using strip collage...')
      }
      const allAlbumFiles = await fs.readdir(albumsFolder)
      const allAlbumPaths = allAlbumFiles
        .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
        .map(file => path.join(albumsFolder, file))

      if (allAlbumPaths.length > 0) {
        const dateSeed = new Date(year, 0, 1).getTime()
        await createStripCollage(allAlbumPaths, coverOutputPath, {
          seed: dateSeed,
          width: 1400,
          height: 800
        })
        console.log(`✅ Cover collage generated: ${coverOutputPath}`)
      } else {
        console.log('⚠️  No album images found for collage')
      }
    }

    // Generate title and intro
    console.log('\n📝 Generating title and introduction...')
    const title = `My ${year} Year in Music`
    const description = `A comprehensive look back at my ${year} listening journey - ${insights.basicStats.totalScrobbles.toLocaleString()} scrobbles, ${insights.basicStats.uniqueArtists} artists, and countless musical moments.`

    // Render the blog post
    console.log('\n📄 Rendering blog post...')
    await renderWrappedPost({
      postPath,
      year,
      title,
      description,
      insights,
      topArtists,
      topAlbums,
      featuredAlbums,
      blogSections,
      collectionInfo: collectionInfo.info,
      postSlug,
      chartsFolder
    })

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Successfully generated ${year} Year in Music Wrapped!`)
    console.log(`📁 Post location: ${postPath}`)
    console.log(`🖼️  Assets: public/assets/${postSlug}/`)

  } catch (error) {
    console.error('\n❌ Error generating year wrapped:', error)
    process.exit(1)
  }
}

function printSummary(insights) {
  console.log('\n' + '='.repeat(50))
  console.log(`📊 ${insights.year} WRAPPED SUMMARY`)
  console.log('='.repeat(50))
  console.log(`\n🎵 Total Scrobbles: ${insights.basicStats.totalScrobbles.toLocaleString()}`)
  console.log(`⏱️  Estimated Hours: ${insights.basicStats.estimatedHours.toLocaleString()}`)
  console.log(`🎤 Unique Artists: ${insights.basicStats.uniqueArtists}`)
  console.log(`💿 Unique Albums: ${insights.basicStats.uniqueAlbums}`)
  console.log(`📅 Average per day: ${insights.basicStats.avgPerDay}`)

  if (insights.artistOfTheYear) {
    console.log(`\n🏆 Artist of the Year: ${insights.artistOfTheYear.name} (${insights.artistOfTheYear.playcount.toLocaleString()} plays)`)
  }
  if (insights.albumOfTheYear) {
    console.log(`🥇 Album of the Year: "${insights.albumOfTheYear.album}" by ${insights.albumOfTheYear.artist}`)
  }
  if (insights.basicStats.peakMonth) {
    console.log(`📈 Peak Month: ${insights.basicStats.peakMonth.month} (${insights.basicStats.peakMonth.totalPlays.toLocaleString()} plays)`)
  }
  console.log('')
}

function printLinks(collectionInfo, topArtists, topAlbums) {
  console.log('\n=== Top Artist Links ===')
  for (const [artist] of topArtists.slice(0, 5)) {
    const artistData = lookupArtistData(artist, collectionInfo)
    console.log(`${artist}: ${artistData?.link || 'No link'}`)
  }

  console.log('\n=== Featured Album Links ===')
  for (const [[artist, album]] of topAlbums.slice(0, 5)) {
    const albumData = lookupAlbumData(artist, album, collectionInfo)
    console.log(`${album} by ${artist}: ${albumData?.link || 'No link'}`)
  }
}

async function generateFeaturedAlbumSections(featuredAlbums, collectionInfo, contentGenerator, postSlug) {
  const sections = []

  for (const [[artist, album], playcount] of featuredAlbums) {
    console.log(`  Researching: ${album} by ${artist}...`)
    try {
      const albumData = lookupAlbumData(artist, album, collectionInfo)
      const artistData = lookupArtistData(artist, collectionInfo)

      const collectionContext = {
        genres: albumData?.genres || [],
        release_year: albumData?.release_year || null,
        biography: artistData?.biography || null
      }

      const section = await contentGenerator.researchAlbum(artist, album, collectionContext)
      const enrichedSection = addImagesAndLinksToSection(section, artist, album, collectionInfo, postSlug, playcount)
      sections.push(enrichedSection)
    } catch (error) {
      console.error(`  Error researching ${album}: ${error.message}`)
      const fallback = generateFallbackSection(artist, album, playcount)
      const enrichedFallback = addImagesAndLinksToSection(fallback, artist, album, collectionInfo, postSlug, playcount)
      sections.push(enrichedFallback)
    }
  }

  return sections.join('\n\n')
}

function generateSimpleFeaturedSections(featuredAlbums, collectionInfo, postSlug) {
  const sections = []

  for (const [[artist, album], playcount] of featuredAlbums) {
    const section = generateFallbackSection(artist, album, playcount)
    const enriched = addImagesAndLinksToSection(section, artist, album, collectionInfo, postSlug, playcount)
    sections.push(enriched)
  }

  return sections.join('\n\n')
}

function generateFallbackSection(artist, album, playcount) {
  return `## ${album} by ${artist} 🎵

### A Year-End Highlight 🎸

With **${playcount.toLocaleString()} plays** this year, "${album}" by ${artist} earned its place as one of my most-listened albums. This record showcases the artist's distinctive sound and continues to resonate with each listen.

### Why It Matters 🌟

The impact of this work demonstrates why it became a staple in my rotation throughout the year. Its staying power speaks to the quality of the music and its ability to connect.`
}

function addImagesAndLinksToSection(section, artist, album, collectionInfo, postSlug, playcount) {
  const albumData = lookupAlbumData(artist, album, collectionInfo)
  const artistData = lookupArtistData(artist, collectionInfo)

  const lines = section.split('\n')
  const enrichedLines = []
  let headerFound = false

  for (const line of lines) {
    enrichedLines.push(line)

    if (!headerFound && line.startsWith('## ')) {
      headerFound = true

      // Add play count badge
      enrichedLines.push('')
      enrichedLines.push(`> **${playcount.toLocaleString()} plays** in this year`)
      enrichedLines.push('')

      // Add LightGallery
      const galleryImages = []

      if (albumData?.image) {
        const albumImagePath = `/assets/${postSlug}/albums/${normalizeForFilename(album)}.jpg`
        const altText = escapeQuotes(`${album} by ${artist}`)
        galleryImages.push(`{ src: "${albumImagePath}", alt: "${altText}" }`)
      }

      if (artistData?.image) {
        const artistImagePath = `/assets/${postSlug}/artists/${normalizeForFilename(artist)}.jpg`
        const altText = escapeQuotes(artist)
        galleryImages.push(`{ src: "${artistImagePath}", alt: "${altText}" }`)
      }

      if (galleryImages.length > 0) {
        enrichedLines.push('<LightGallery')
        enrichedLines.push('    layout={{')
        enrichedLines.push('        imgs: [')
        for (let j = 0; j < galleryImages.length; j++) {
          enrichedLines.push(`            ${galleryImages[j]}${j < galleryImages.length - 1 ? ',' : ''}`)
        }
        enrichedLines.push('        ]')
        enrichedLines.push('    }}')
        enrichedLines.push('/>')
        enrichedLines.push('')
      }
    }
  }

  // Add russ.fm links
  const links = []
  if (albumData?.link) {
    links.push(`- View ${album} on [russ.fm](${albumData.link})`)
  }
  if (artistData?.link) {
    links.push(`- View ${artist} on [russ.fm](${artistData.link})`)
  }

  if (links.length > 0) {
    enrichedLines.push('')
    enrichedLines.push(...links)
  }

  return enrichedLines.join('\n')
}

/**
 * Generate and save all SVG charts to files
 */
async function generateAndSaveCharts(insights, chartsFolder, postSlug) {
  const { listeningPatterns, listeningAge, genreBreakdown } = insights
  const chartPaths = {}

  // Monthly chart
  const monthlyData = listeningPatterns.monthlyBreakdown.map(m => ({
    month: m.month,
    plays: m.plays,
    isAboveAverage: m.isAboveAverage
  }))
  const monthlySvg = generateMonthlyChart(monthlyData, { width: 700, height: 220 })
  const monthlyPath = await saveSvgChart(monthlySvg, 'monthly-activity.svg', chartsFolder)
  chartPaths.monthly = monthlyPath
  console.log(`    ✓ Monthly activity chart: ${monthlyPath}`)

  // Genre bar chart (only if data available)
  if (genreBreakdown.length > 0) {
    const genreData = genreBreakdown.map(g => ({
      genre: g.genre,
      plays: g.plays,
      percentage: g.percentage
    }))
    const genreSvg = generateGenreBarChart(genreData, { width: 600 })
    const genrePath = await saveSvgChart(genreSvg, 'genre-breakdown.svg', chartsFolder)
    chartPaths.genre = genrePath
    console.log(`    ✓ Genre breakdown chart: ${genrePath}`)
  }

  return chartPaths
}

async function renderWrappedPost({
  postPath,
  year,
  title,
  description,
  insights,
  topArtists,
  topAlbums,
  featuredAlbums,
  blogSections,
  collectionInfo,
  postSlug,
  chartsFolder
}) {
  // Load template
  const templatePath = path.join(__dirname, 'year-wrapped-template.mdx')
  let template = await fs.readFile(templatePath, 'utf-8')

  // Generate and save SVG charts
  console.log('  📊 Generating SVG charts...')
  const chartPaths = await generateAndSaveCharts(insights, chartsFolder, postSlug)

  // Generate intro section
  const introSection = generateIntroSection(insights)

  // Generate artist of the year section
  const artistOfTheYearSection = generateArtistOfTheYearSection(insights, collectionInfo, postSlug)

  // Generate album of the year section
  const albumOfTheYearSection = generateAlbumOfTheYearSection(insights, collectionInfo, postSlug)

  // Generate top 25 artists section
  const top25ArtistsSection = generateTopArtistsSection(topArtists.slice(0, 25), collectionInfo)

  // Generate top 50 albums section
  const top50AlbumsSection = generateTopAlbumsSection(topAlbums.slice(0, 50), collectionInfo)

  // Generate monthly breakdown
  const monthlyBreakdownSection = generateMonthlyBreakdownSection(insights, chartPaths.monthly)

  // Generate genre breakdown
  const genreBreakdownSection = generateGenreBreakdownSection(insights, chartPaths.genre)

  // Generate hidden gems section
  const hiddenGemsSection = generateHiddenGemsSection(insights, collectionInfo, postSlug)

  // Generate new discoveries section
  const newDiscoveriesSection = generateNewDiscoveriesSection(insights, collectionInfo, postSlug)

  // Peak month text
  const peakMonthText = insights.basicStats.peakMonth
    ? `My peak listening month was **${insights.basicStats.peakMonth.month}** with ${insights.basicStats.peakMonth.totalPlays.toLocaleString()} scrobbles.`
    : ''

  // Replace all template variables
  const content = template
    .replace(/\{\{title\}\}/g, title)
    .replace(/\{\{description\}\}/g, description)
    .replace(/\{\{pubDate\}\}/g, `${year}-12-31`)
    .replace(/\{\{year\}\}/g, year.toString())
    .replace(/\{\{totalScrobbles\}\}/g, insights.basicStats.totalScrobbles.toLocaleString())
    .replace(/\{\{estimatedHours\}\}/g, insights.basicStats.estimatedHours.toLocaleString())
    .replace(/\{\{uniqueArtists\}\}/g, insights.basicStats.uniqueArtists.toString())
    .replace(/\{\{uniqueAlbums\}\}/g, insights.basicStats.uniqueAlbums.toString())
    .replace(/\{\{estimatedDays\}\}/g, insights.basicStats.estimatedDays.toString())
    .replace(/\{\{avgPerDay\}\}/g, insights.basicStats.avgPerDay.toString())
    .replace(/\{\{peakMonthText\}\}/g, peakMonthText)
    .replace(/\{\{introSection\}\}/g, introSection)
    .replace(/\{\{artistOfTheYearSection\}\}/g, artistOfTheYearSection)
    .replace(/\{\{albumOfTheYearSection\}\}/g, albumOfTheYearSection)
    .replace(/\{\{top25ArtistsSection\}\}/g, top25ArtistsSection)
    .replace(/\{\{top50AlbumsSection\}\}/g, top50AlbumsSection)
    .replace(/\{\{monthlyBreakdownSection\}\}/g, monthlyBreakdownSection)
    .replace(/\{\{genreBreakdownSection\}\}/g, genreBreakdownSection)
    .replace(/\{\{hiddenGemsSection\}\}/g, hiddenGemsSection)
    .replace(/\{\{newDiscoveriesSection\}\}/g, newDiscoveriesSection)
    .replace(/\{\{albumSections\}\}/g, blogSections)

  await fs.writeFile(postPath, content)
  console.log(`  ✓ Blog post written to: ${postPath}`)
}

function generateIntroSection(insights) {
  const { basicStats, artistOfTheYear, listeningAge } = insights

  let intro = `What a year for music! In ${insights.year}, I scrobbled **${basicStats.totalScrobbles.toLocaleString()} tracks** across **${basicStats.uniqueArtists} different artists** and **${basicStats.uniqueAlbums} albums**. That's roughly **${basicStats.estimatedHours.toLocaleString()} hours** of music - or about **${basicStats.estimatedDays} days** of non-stop listening.`

  // Add average album age if available
  if (listeningAge?.avgYear) {
    const avgAge = insights.year - listeningAge.avgYear
    intro += ` On average, the albums I listened to are **${avgAge} years old**.`
  }

  intro += `\n\n${artistOfTheYear ? artistOfTheYear.description : ''}`

  intro += `\n\nLets dive into the numbers and see what made ${insights.year} special.`

  return intro
}

function generateArtistOfTheYearSection(insights, collectionInfo, postSlug) {
  const artist = insights.artistOfTheYear
  if (!artist) return 'No artist data available.'

  const artistData = lookupArtistData(artist.name, collectionInfo)

  let section = `### ${artist.name}

With **${artist.playcount.toLocaleString()} plays** (${artist.percentageOfTotal}% of my total listening), ${artist.name} dominated my ${insights.year}.`

  if (artist.dominantMonths.length > 0) {
    section += ` They were my top artist in ${artist.dominantMonths.join(', ')}.`
  }

  if (artistData?.image) {
    section += `

<LightGallery
    layout={{
        imgs: [
            { src: "/assets/${postSlug}/artists/${normalizeForFilename(artist.name)}.jpg", alt: "${escapeQuotes(artist.name)}" }
        ]
    }}
/>`
  }

  if (artistData?.link) {
    section += `

- View ${artist.name} on [russ.fm](${artistData.link})`
  }

  return section
}

function generateAlbumOfTheYearSection(insights, collectionInfo, postSlug) {
  const album = insights.albumOfTheYear
  if (!album) return 'No album data available.'

  const albumData = lookupAlbumData(album.artist, album.album, collectionInfo)
  const artistData = lookupArtistData(album.artist, collectionInfo)

  let section = `### "${album.album}" by ${album.artist}

This album earned the top spot with **${album.playcount.toLocaleString()} plays** (${album.percentageOfTotal}% of my listening).`

  if (album.dominantMonths.length > 0) {
    section += ` It was my most-played album in ${album.dominantMonths.join(', ')}.`
  }

  const galleryImages = []
  if (albumData?.image) {
    galleryImages.push(`{ src: "/assets/${postSlug}/albums/${normalizeForFilename(album.album)}.jpg", alt: "${escapeQuotes(`${album.album} by ${album.artist}`)}" }`)
  }
  if (artistData?.image) {
    galleryImages.push(`{ src: "/assets/${postSlug}/artists/${normalizeForFilename(album.artist)}.jpg", alt: "${escapeQuotes(album.artist)}" }`)
  }

  if (galleryImages.length > 0) {
    section += `

<LightGallery
    layout={{
        imgs: [
            ${galleryImages.join(',\n            ')}
        ]
    }}
/>`
  }

  const links = []
  if (albumData?.link) links.push(`- View ${album.album} on [russ.fm](${albumData.link})`)
  if (artistData?.link) links.push(`- View ${album.artist} on [russ.fm](${artistData.link})`)

  if (links.length > 0) {
    section += `\n\n${links.join('\n')}`
  }

  return section
}

function generateTopArtistsSection(topArtists, collectionInfo) {
  const formatArtist = ([artist, count], index) => {
    const artistData = lookupArtistData(artist, collectionInfo)
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`

    if (artistData?.link) {
      return `- ${medal} [${artist}](${artistData.link}) — ${count.toLocaleString()} plays`
    }
    return `- ${medal} ${artist} — ${count.toLocaleString()} plays`
  }

  // Show first 10, rest in expandable section
  const first10 = topArtists.slice(0, 10).map(formatArtist).join('\n')
  const rest = topArtists.slice(10)

  if (rest.length === 0) {
    return first10
  }

  const restFormatted = rest.map((item, idx) => formatArtist(item, idx + 10)).join('\n')

  return `${first10}

<details>
<summary>View artists 11-${topArtists.length}</summary>

${restFormatted}

</details>`
}

function generateTopAlbumsSection(topAlbums, collectionInfo) {
  const formatAlbum = ([[artist, album], count], index) => {
    const albumData = lookupAlbumData(artist, album, collectionInfo)
    const artistData = lookupArtistData(artist, collectionInfo)
    const rank = index + 1
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`

    let albumPart = album
    let artistPart = artist

    if (albumData?.link) albumPart = `[${album}](${albumData.link})`
    if (artistData?.link) artistPart = `[${artist}](${artistData.link})`

    return `- ${medal} ${albumPart} by ${artistPart} — ${count.toLocaleString()} plays`
  }

  // Show first 10, rest in expandable section
  const first10 = topAlbums.slice(0, 10).map(formatAlbum).join('\n')
  const rest = topAlbums.slice(10)

  if (rest.length === 0) {
    return first10
  }

  const restFormatted = rest.map((item, idx) => formatAlbum(item, idx + 10)).join('\n')

  return `${first10}

<details>
<summary>View albums 11-${topAlbums.length}</summary>

${restFormatted}

</details>`
}

function generateMonthlyBreakdownSection(insights, chartPath) {
  const { listeningPatterns } = insights
  const months = listeningPatterns.monthlyBreakdown

  let section = ''

  // Reference the saved SVG chart file
  if (chartPath) {
    section += `![Monthly listening activity chart](${chartPath})\n\n`
  }

  section += `**Most active month:** ${listeningPatterns.mostActiveMonth.month} (${listeningPatterns.mostActiveMonth.totalPlays.toLocaleString()} plays)\n\n`
  section += `**Quietest month:** ${listeningPatterns.leastActiveMonth.month} (${listeningPatterns.leastActiveMonth.totalPlays.toLocaleString()} plays)\n\n`
  section += `**Best quarter:** ${listeningPatterns.topQuarter.name} (${listeningPatterns.topQuarter.plays.toLocaleString()} plays)`

  // Include table for accessibility
  section += '\n\n<details>\n<summary>View monthly data as table</summary>\n\n'
  section += '| Month | Plays | Above Average |\n'
  section += '|-------|------:|:-------------:|\n'
  for (const month of months) {
    const indicator = month.isAboveAverage ? '✓' : ''
    section += `| ${month.month} | ${month.plays.toLocaleString()} | ${indicator} |\n`
  }
  section += '\n</details>'

  return section
}

function generateGenreBreakdownSection(insights, chartPath) {
  const genres = insights.genreBreakdown

  if (genres.length === 0) {
    return 'Genre data not available for this years listening.'
  }

  let section = 'My top genres based on album metadata from my collection:\n\n'

  // Reference the saved SVG chart file
  if (chartPath) {
    section += `![Genre breakdown bar chart](${chartPath})\n\n`
  }

  // Also include a text list for accessibility
  section += '<details>\n<summary>View as text list</summary>\n\n'
  for (const genre of genres) {
    section += `- **${genre.rank}. ${genre.genre}** — ${genre.plays.toLocaleString()} plays (${genre.percentage}%)\n`
  }
  section += '\n</details>'

  return section
}

function generateHiddenGemsSection(insights, collectionInfo, postSlug) {
  const gems = insights.hiddenGems

  if (gems.length === 0) {
    return 'No hidden gems identified this year.'
  }

  let section = ''

  // Build LightGallery for hidden gems album covers
  const galleryImages = []
  for (const gem of gems) {
    const albumData = lookupAlbumData(gem.artist, gem.album, collectionInfo)
    if (albumData?.image) {
      const albumImagePath = `/assets/${postSlug}/albums/${normalizeForFilename(gem.album)}.jpg`
      const altText = escapeQuotes(`${gem.album} by ${gem.artist}`)
      galleryImages.push(`{ src: "${albumImagePath}", alt: "${altText}" }`)
    }
  }

  if (galleryImages.length > 0) {
    section += '<LightGallery\n'
    section += '    layout={{\n'
    section += '        imgs: [\n'
    for (let j = 0; j < galleryImages.length; j++) {
      section += `            ${galleryImages[j]}${j < galleryImages.length - 1 ? ',' : ''}\n`
    }
    section += '        ]\n'
    section += '    }}\n'
    section += '/>\n\n'
  }

  // Add text list (without play counts)
  for (const gem of gems) {
    const albumData = lookupAlbumData(gem.artist, gem.album, collectionInfo)
    const artistData = lookupArtistData(gem.artist, collectionInfo)

    let albumPart = `"${gem.album}"`
    let artistPart = gem.artist

    if (albumData?.link) albumPart = `["${gem.album}"](${albumData.link})`
    if (artistData?.link) artistPart = `[${gem.artist}](${artistData.link})`

    section += `- ${albumPart} by ${artistPart}\n`
  }

  return section
}

function generateNewDiscoveriesSection(insights, collectionInfo, postSlug) {
  const discoveries = insights.newDiscoveries

  if (discoveries.length === 0) {
    return `No albums released in ${insights.year} made it into my top 100 this year.`
  }

  let section = `These albums were released in ${insights.year} and made their way into my rotation:\n\n`

  // Build LightGallery for new discoveries album covers
  const galleryImages = []
  for (const album of discoveries) {
    const albumData = lookupAlbumData(album.artist, album.album, collectionInfo)
    if (albumData?.image) {
      const albumImagePath = `/assets/${postSlug}/albums/${normalizeForFilename(album.album)}.jpg`
      const altText = escapeQuotes(`${album.album} by ${album.artist}`)
      galleryImages.push(`{ src: "${albumImagePath}", alt: "${altText}" }`)
    }
  }

  if (galleryImages.length > 0) {
    section += '<LightGallery\n'
    section += '    layout={{\n'
    section += '        imgs: [\n'
    for (let j = 0; j < galleryImages.length; j++) {
      section += `            ${galleryImages[j]}${j < galleryImages.length - 1 ? ',' : ''}\n`
    }
    section += '        ]\n'
    section += '    }}\n'
    section += '/>\n\n'
  }

  // Add text list (without play counts)
  for (const album of discoveries) {
    const albumData = lookupAlbumData(album.artist, album.album, collectionInfo)
    const artistData = lookupArtistData(album.artist, collectionInfo)

    let albumPart = `"${album.album}"`
    let artistPart = album.artist

    if (albumData?.link) albumPart = `["${album.album}"](${albumData.link})`
    if (artistData?.link) artistPart = `[${album.artist}](${artistData.link})`

    section += `- ${albumPart} by ${artistPart}\n`
  }

  return section
}

main()
