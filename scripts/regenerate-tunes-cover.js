import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { createFALTunesCover, smallOutputPathFor } from './fal-tunes-cover.js'
import { createFALArtistPortrait } from './fal-tunes-artists.js'
import { normalizeForFilename } from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

function parseArgs(args) {
  const options = {
    week: null,
    type: null,
    lane: null,
    output: null,
    restyle: true,
    record: false,
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--artist') options.type = 'artist'
    else if (arg === '--header') options.type = 'header'
    else if (arg === '--no-restyle') options.restyle = false
    else if (arg === '--record') options.record = true
    else if (arg.startsWith('--type=')) options.type = arg.slice('--type='.length)
    else if (arg.startsWith('--week=')) options.week = arg.slice('--week='.length)
    else if (arg.startsWith('--lane=')) options.lane = arg.slice('--lane='.length)
    // --style is the historical alias for --lane.
    else if (arg.startsWith('--style=')) options.lane = arg.slice('--style='.length)
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length)
    else throw new Error(`Unknown option: ${arg}`)
  }

  if (options.type && !['header', 'artist'].includes(options.type)) {
    throw new Error(`Invalid --type "${options.type}". Use "header" or "artist".`)
  }

  return options
}

async function getRecentWeeks(limit = 10) {
  const assetsDir = path.join(rootDir, 'public', 'assets')
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
  --week=<date>       Week date, e.g. 2026-04-20 (interactive picker if omitted)
  --lane=<id>         Header only: force a creative-direction lane instead of the
                      week's rotation (--style is an alias). See
                      \`node scripts/fal-tunes-cover.js --list-lanes\` for ids.
  --no-restyle        Header only: skip the lane's optional restyle stage
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
  node scripts/regenerate-tunes-cover.js --type=header --week=2026-04-20 --lane=risograph --debug
  node scripts/regenerate-tunes-cover.js --week=2026-04-20 --output=/tmp/tunes-test.png
`)
}

async function findPostPath(dateStr) {
  const flatPath = path.join(rootDir, 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week.mdx`)
  const indexPath = path.join(rootDir, 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week`, 'index.mdx')

  try {
    await fs.access(flatPath)
    return flatPath
  } catch {
    try {
      await fs.access(indexPath)
      return indexPath
    } catch {
      return null
    }
  }
}

function parseFrontmatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*["']?(.+?)["']?\\s*$`, 'm'))
  return match?.[1] || ''
}

function parseMarkdownLinkText(value) {
  const trimmed = value.trim()
  const match = trimmed.match(/^\[([^\]]+)\]\([^)]+\)$/)
  return match ? match[1] : trimmed
}

function parseListItem(line) {
  const match = line.match(/^\s*[-*]\s+(.+?)\s*$/)
  return match?.[1] || null
}

function sectionLines(content, heading) {
  const lines = content.split('\n')
  const start = lines.findIndex(line => line.trim() === heading)
  if (start === -1) return []

  const out = []
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) break
    out.push(lines[i])
  }
  return out
}

function parsePostContext(content) {
  const topArtistLines = sectionLines(content, content.match(/^## Top Artists.*$/m)?.[0] || '')
  const topAlbumLines = sectionLines(content, content.match(/^## Top Albums.*$/m)?.[0] || '')

  const topArtists = topArtistLines
    .map(parseListItem)
    .filter(Boolean)
    .map(item => {
      const match = item.match(/^(.*?)\s+\((\d+)\s+plays?\)$/i)
      if (!match) return null
      return [parseMarkdownLinkText(match[1]), Number(match[2])]
    })
    .filter(Boolean)

  const topAlbums = topAlbumLines
    .map(parseListItem)
    .filter(Boolean)
    .map(item => {
      const body = item.replace(/\s+\(\d+\s+plays?\)$/i, '')
      const byIndex = body.toLowerCase().lastIndexOf(' by ')
      if (byIndex === -1) return null
      const album = parseMarkdownLinkText(body.slice(0, byIndex))
      const artist = parseMarkdownLinkText(body.slice(byIndex + 4))
      return [[artist, album], null]
    })
    .filter(Boolean)

  return {
    title: parseFrontmatterValue(content, 'title'),
    summary: parseFrontmatterValue(content, 'description'),
    topArtists,
    topAlbums
  }
}

async function readPostContext(dateStr) {
  const postPath = await findPostPath(dateStr)
  if (!postPath) {
    return {
      title: '',
      summary: '',
      topArtists: [],
      topAlbums: []
    }
  }

  const content = await fs.readFile(postPath, 'utf-8')
  return parsePostContext(content)
}

async function orderedAlbumImages(topAlbums, albumsFolder) {
  const files = await fs.readdir(albumsFolder)
  const imagePathByFile = new Map(
    files
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
      .map(file => [file, path.join(albumsFolder, file)])
  )

  const ranked = topAlbums
    .map(([[, album]]) => imagePathByFile.get(`${normalizeForFilename(album)}.jpg`))
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
    .map(([artist]) => imagePathByFile.get(`${normalizeForFilename(artist)}.jpg`))
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

  const weeks = await getRecentWeeks()
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
  const postContext = await readPostContext(dateStr)
  const dateSeed = new Date(dateStr).getTime()

  if (imageType === 'artist') {
    if (args.lane) {
      console.error('--lane only applies to --type=header (the artist portrait has no lanes)')
      process.exit(1)
    }
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
    lane: args.lane,
    restyle: args.restyle,
    recordHistory: args.record,
    dateLabel: dateStr,
    debug: args.debug
  })

  console.log('\nCover regenerated')
  console.log(`  Full:  ${result.outputPath}`)
  console.log(`  Small: ${result.smallOutputPath}`)
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
