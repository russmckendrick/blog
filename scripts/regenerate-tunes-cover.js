import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import readline from 'readline'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createFALCollage } from './fal-collage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = path.join(__dirname, '..')

const STYLES = [
  'studio_session',
  'bold_cinematic',
  'collage_cutout',
  'miniature_diorama',
  'retro_vinyl',
  'surreal_dreamscape',
  'pop_art',
  'painted_mural'
]

function parseArgs(args) {
  const options = { week: null, style: null, debug: false, help: false }
  for (const arg of args) {
    if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--week=')) options.week = arg.split('=')[1]
    else if (arg.startsWith('--style=')) options.style = arg.split('=')[1]
  }
  return options
}

async function getRecentWeeks(limit = 10) {
  const assetsDir = path.join(rootDir, 'public', 'assets')
  const entries = await fs.readdir(assetsDir, { withFileTypes: true })
  return entries
    .filter(e => e.isDirectory() && e.name.endsWith('-listened-to-this-week'))
    .map(e => e.name)
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

async function pickStyle(rl) {
  console.log('\nAvailable styles:\n')
  STYLES.forEach((style, i) => {
    console.log(`  ${i + 1}. ${style}`)
  })
  console.log()

  while (true) {
    const answer = await ask(rl, `Select style (1-${STYLES.length}): `)
    const num = parseInt(answer, 10)
    if (num >= 1 && num <= STYLES.length) return STYLES[num - 1]
    console.log('Invalid selection, try again.')
  }
}

function showHelp() {
  console.log(`
Regenerate Tunes Cover Image

Regenerates the AI collage cover image for a weekly tunes post.

Usage:
  node scripts/regenerate-tunes-cover.js [options]

Options:
  --week=<date>       Week date, e.g. 2026-03-30 (interactive picker if omitted)
  --style=<name>      Style profile (interactive picker if omitted)
  --debug, -d         Enable debug output
  --help, -h          Show this help message

Styles:
  ${STYLES.join(', ')}

Examples:
  node scripts/regenerate-tunes-cover.js
  node scripts/regenerate-tunes-cover.js --week=2026-03-30 --style=pop_art
  node scripts/regenerate-tunes-cover.js --week=2026-03-30 --style=retro_vinyl --debug
`)
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

  let selectedWeek
  let selectedStyle

  if (args.week && args.style) {
    selectedWeek = weeks.find(w => w.includes(args.week))
    if (!selectedWeek) {
      console.error(`Week "${args.week}" not found. Available: ${weeks.map(extractDate).join(', ')}`)
      process.exit(1)
    }
    if (!STYLES.includes(args.style)) {
      console.error(`Style "${args.style}" not found. Available: ${STYLES.join(', ')}`)
      process.exit(1)
    }
    selectedStyle = args.style
  } else {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    try {
      selectedWeek = args.week
        ? weeks.find(w => w.includes(args.week)) || (console.error(`Week "${args.week}" not found`), process.exit(1))
        : await pickWeek(rl, weeks)
      selectedStyle = args.style || await pickStyle(rl)
    } finally {
      rl.close()
    }
  }

  const dateStr = extractDate(selectedWeek)
  const albumsFolder = path.join(rootDir, 'public', 'assets', selectedWeek, 'albums')
  const outputDir = path.join(rootDir, 'src', 'assets', selectedWeek)
  const outputPath = path.join(outputDir, `tunes-cover-${selectedWeek}.png`)

  try {
    await fs.access(albumsFolder)
  } catch {
    console.error(`Albums folder not found: ${albumsFolder}`)
    process.exit(1)
  }

  const albumFiles = await fs.readdir(albumsFolder)
  const albumImages = albumFiles
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
    .map(file => path.join(albumsFolder, file))

  if (albumImages.length === 0) {
    console.error(`No album images found in ${albumsFolder}`)
    process.exit(1)
  }

  await fs.mkdir(outputDir, { recursive: true })

  console.log(`\nRegenerating cover for: ${dateStr}`)
  console.log(`Style: ${selectedStyle}`)
  console.log(`Albums: ${albumImages.length} images`)
  console.log(`Output: ${outputPath}\n`)

  const dateSeed = new Date(dateStr).getTime()
  const result = await createFALCollage(albumImages, outputPath, {
    seed: dateSeed,
    width: 1400,
    height: 800,
    style: selectedStyle,
    debug: args.debug
  })

  console.log(`\n✅ Cover regenerated!`)
  console.log(`  Original: ${result.outputPath} (${result.originalWidth}×${result.originalHeight})`)
  console.log(`  Small:    ${result.smallOutputPath} (1400×800)`)
}

main().catch(error => {
  console.error('Error:', error.message)
  process.exit(1)
})
