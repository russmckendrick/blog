import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { createFALTunesCover, smallOutputPathFor } from './fal-tunes-cover.js'
import { createFALArtistPortrait } from './fal-tunes-artists.js'
import { normalizeForFilename } from './lib/text-utils.js'
import { readTunesPostContext } from './lib/tunes-post-context.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
export const DEFAULT_RECENT_WEEK_LIMIT = 20

function parseArgs(args) {
  const options = {
    week: null,
    type: null,
    hint: null,
    output: null,
    record: false,
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--artist') options.type = 'artist'
    else if (arg === '--header') options.type = 'header'
    else if (arg === '--record') options.record = true
    else if (arg.startsWith('--type=')) options.type = arg.slice('--type='.length)
    else if (arg.startsWith('--week=')) options.week = arg.slice('--week='.length)
    else if (arg.startsWith('--hint=')) options.hint = arg.slice('--hint='.length)
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length)
    else throw new Error(`Unknown option: ${arg}`)
  }

  if (options.type && !['header', 'artist'].includes(options.type)) {
    throw new Error(`Invalid --type "${options.type}". Use "header" or "artist".`)
  }

  return options
}

export async function getRecentWeeks(
  limit = DEFAULT_RECENT_WEEK_LIMIT,
  assetsDir = path.join(rootDir, 'public', 'assets')
) {
  const entries = await fs.readdir(assetsDir, { withFileTypes: true })
  return entries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('-listened-to-this-week'))
    .map(entry => entry.name)
    .sort()
    .reverse()
    .slice(0, limit)
}

function extractDate(folderName) {
  return folderName.replace('-listened-to-this-week', '')
}

function ask(rl, question) {
  return new Promise(resolve => rl.question(question, resolve))
}

async function pickImageType(rl) {
  console.log('\nWhich image?\n')
  console.log('  1. Header (album cover scene)')
  console.log('  2. Artist (group portrait)')
  console.log()

  while (true) {
    const answer = await ask(rl, 'Select image type (1-2): ')
    if (answer.trim() === '1') return 'header'
    if (answer.trim() === '2') return 'artist'
    console.log('Invalid selection, try again.')
  }
}

async function pickWeek(rl, weeks) {
  console.log('\nAvailable weeks:\n')
  weeks.forEach((week, i) => {
    console.log(`  ${i + 1}. ${extractDate(week)}`)
  })
  console.log()

  while (true) {
    const answer = await ask(rl, `Select week (1-${weeks.length}): `)
    const num = parseInt(answer, 10)
    if (num >= 1 && num <= weeks.length) return weeks[num - 1]
    console.log('Invalid selection, try again.')
  }
}

function showHelp() {
  console.log(`
Regenerate Tunes Image

Regenerates an AI image for a weekly tunes post - either the album-cover header
scene or a group portrait of the week's artists. This is the manual test harness
for trying old weeks without changing MDX frontmatter.

Usage:
  node scripts/regenerate-tunes-cover.js [options]

Options:
  --type=<kind>       Image to make: "header" (album scene) or "artist" (group
                      portrait). Interactive picker if omitted.
  --header            Shorthand for --type=header
  --artist            Shorthand for --type=artist
  --week=<date>       Week date, e.g. 2026-04-20 (picker shows the most recent 20
                      weeks when omitted)
  --hint=<string>     Optional steer for the selected image's AI art director
  --record            Append the run to scripts/.tunes-image-history.json (off by
                      default here so regenerating old weeks does not pollute the
                      do-not-repeat memory)
  --output=<path>     Optional output PNG path; also writes <name>-small.png
  --debug, -d         Enable debug output
  --help, -h          Show this help message

Outputs (default):
  header  -> src/assets/<week>/tunes-cover-<week>.png      (+ -small, hero)
  artist  -> public/assets/<week>/tunes-artists-<week>.png (+ -small, body image)

Examples:
  node scripts/regenerate-tunes-cover.js --type=artist --week=2026-04-20 --debug
  node scripts/regenerate-tunes-cover.js --type=artist --week=2026-04-20 --hint="candid backstage" --debug
  node scripts/regenerate-tunes-cover.js --type=header --week=2026-04-20 --hint="lean abstract" --debug
  node scripts/regenerate-tunes-cover.js --week=2026-04-20 --output=/tmp/tunes-test.png
`)
}

async function orderedAlbumImages(topAlbums, albumsFolder) {
  const files = await fs.readdir(albumsFolder)
  const imagePathByFile = new Map(
    files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
      .map(file => [file, path.join(albumsFolder, file)])
  )

  const ranked = topAlbums
    .map(({ album }) => imagePathByFile.get(`${normalizeForFilename(album)}.jpg`))
    .filter(Boolean)

  const remaining = [...imagePathByFile.values()]
    .filter(imagePath => !ranked.includes(imagePath))
    .sort((a, b) => a.localeCompare(b))

  return [...ranked, ...remaining]
}

async function orderedArtistImages(topArtists, artistsFolder) {
  const files = await fs.readdir(artistsFolder)
  const imagePathByFile = new Map(
    files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
      .map(file => [file, path.join(artistsFolder, file)])
  )

  const ranked = topArtists
    .map(({ artist }) => imagePathByFile.get(`${normalizeForFilename(artist)}.jpg`))
    .filter(Boolean)

  const remaining = [...imagePathByFile.values()]
    .filter(imagePath => !ranked.includes(imagePath))
    .sort((a, b) => a.localeCompare(b))

  return [...ranked, ...remaining]
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    showHelp()
    return
  }

  // Keep the interactive picker concise, but let an explicit --week target any
  // archived Tunes folder rather than only the 20 entries shown by the picker.
  const weeks = await getRecentWeeks(
    args.week ? Number.MAX_SAFE_INTEGER : DEFAULT_RECENT_WEEK_LIMIT
  )
  if (weeks.length === 0) {
    console.error('No listened-to-this-week folders found in public/assets/')
    process.exit(1)
  }

  // Resolve image type and week, opening one readline session for whatever still needs asking.
  let imageType = args.type
  let selectedWeek = null

  if (args.week) {
    selectedWeek = weeks.find(week => week.includes(args.week))
    if (!selectedWeek) {
      console.error(`Week "${args.week}" not found. Available recent weeks: ${weeks.map(extractDate).join(', ')}`)
      process.exit(1)
    }
  }

  if (!imageType || !selectedWeek) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    try {
      if (!imageType) imageType = await pickImageType(rl)
      if (!selectedWeek) selectedWeek = await pickWeek(rl, weeks)
    } finally {
      rl.close()
    }
  }

  const dateStr = extractDate(selectedWeek)

  const outputDir = path.join(rootDir, 'src', 'assets', selectedWeek)
  const postContext = await readTunesPostContext(rootDir, dateStr)
  const dateSeed = new Date(dateStr).getTime()

  if (imageType === 'artist') {
    const artistsFolder = path.join(rootDir, 'public', 'assets', selectedWeek, 'artists')
    // The portrait is a body image referenced by a /assets/... public path, so it lives in
    // public/assets/{week}/ (not src/assets, where the hero cover lives).
    const portraitOutputDir = path.join(rootDir, 'public', 'assets', selectedWeek)
    const outputPath = args.output
      ? path.resolve(args.output)
      : path.join(portraitOutputDir, `tunes-artists-${selectedWeek}.png`)

    try {
      await fs.access(artistsFolder)
    } catch {
      console.error(`Artists folder not found: ${artistsFolder}`)
      process.exit(1)
    }

    const artistImages = await orderedArtistImages(postContext.topArtists, artistsFolder)
    if (artistImages.length === 0) {
      console.error(`No artist images found in ${artistsFolder}`)
      process.exit(1)
    }

    console.log(`\nRegenerating artist portrait for: ${dateStr}`)
    console.log(`Artists: ${artistImages.length} images available`)
    console.log(`Output: ${outputPath}`)
    console.log(`Small:  ${smallOutputPathFor(outputPath)}\n`)

    const result = await createFALArtistPortrait(artistImages, outputPath, {
      seed: dateSeed,
      width: 1400,
      height: 800,
      hint: args.hint,
      recordHistory: args.record,
      dateLabel: dateStr,
      debug: args.debug
    })

    console.log('\nArtist portrait regenerated')
    console.log(`  Full:  ${result.outputPath}`)
    console.log(`  Small: ${result.smallOutputPath}`)
    return
  }

  const albumsFolder = path.join(rootDir, 'public', 'assets', selectedWeek, 'albums')
  const outputPath = args.output
    ? path.resolve(args.output)
    : path.join(outputDir, `tunes-cover-${selectedWeek}.png`)

  try {
    await fs.access(albumsFolder)
  } catch {
    console.error(`Albums folder not found: ${albumsFolder}`)
    process.exit(1)
  }

  const albumImages = await orderedAlbumImages(postContext.topAlbums, albumsFolder)

  if (albumImages.length === 0) {
    console.error(`No album images found in ${albumsFolder}`)
    process.exit(1)
  }

  console.log(`\nRegenerating tunes cover scene for: ${dateStr}`)
  console.log(`Albums: ${albumImages.length} images`)
  console.log(`Output: ${outputPath}`)
  console.log(`Small:  ${smallOutputPathFor(outputPath)}\n`)

  const result = await createFALTunesCover(albumImages, outputPath, {
    seed: dateSeed,
    width: 1400,
    height: 800,
    hint: args.hint,
    recordHistory: args.record,
    dateLabel: dateStr,
    debug: args.debug
  })

  console.log('\nCover regenerated')
  console.log(`  Full:  ${result.outputPath}`)
  console.log(`  Small: ${result.smallOutputPath}`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  })
}
