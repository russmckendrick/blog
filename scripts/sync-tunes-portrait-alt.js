#!/usr/bin/env node
import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { displayNameFor } from './lib/tunes-artist-usage.js'
import { escapeQuotes } from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// Bring each weekly post's artist-portrait alt text back in line with who is actually in the
// picture, reading the cast from the week's portrait sidecar.
//
// Two things put these out of step. Portraits generated before the renderer set an alt at all
// have none, and posts written before the artist reuse rule name the week's top six artists -
// which the rule can make flatly wrong, since a benched artist is exactly the one who is not
// in the portrait. Regenerating a portrait also changes its cast, so run this after any
// regeneration sweep.
//
// Only the alt attribute is touched; src, placement, and every other attribute are left alone.
const PORTRAIT_IMG = /<Img\s+src="(\/assets\/([^"/]+)\/tunes-artists-[^"]+\.png)"([^>]*?)\/>/g

function buildAlt(castNames, fallbackNames) {
  if (castNames.length > 0) {
    return escapeQuotes(`Group portrait of this week's artists: ${castNames.join(', ')}`)
  }
  if (fallbackNames.length > 0) {
    return escapeQuotes(`Group portrait of this week's top artists: ${fallbackNames.join(', ')}`)
  }
  return ''
}

// The top six artists, in play-rank order, as a fallback for a week with no usable sidecar.
function topArtistsFrom(body) {
  const lines = body.split('\n')
  const start = lines.findIndex(line => /^## Top Artists \(Week \d+\)$/.test(line))
  if (start === -1) return []

  const names = []
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i]
    if (line.startsWith('- ')) {
      const linked = line.match(/^- \[([^\]]+)\]/)
      names.push(linked ? linked[1] : line.replace(/^- /, '').replace(/\s*\(\d+ plays\)\s*$/, ''))
    } else if (names.length > 0) {
      break
    }
  }
  return names.slice(0, 6)
}

async function castFor(weekFolder) {
  const sidecarPath = path.join(PROJECT_ROOT, 'src', 'assets', weekFolder, `tunes-artists-${weekFolder}.json`)
  try {
    const sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf-8'))
    const names = []
    const seen = new Set()
    for (const input of sidecar.inputs || []) {
      const display = displayNameFor(input)
      if (!display || seen.has(display)) continue
      seen.add(display)
      names.push(display)
    }
    return names
  } catch {
    return []
  }
}

function parseArgs(args) {
  const options = { dryRun: false, help: false, from: null, to: null }
  for (const arg of args) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--from=')) options.from = arg.slice('--from='.length)
    else if (arg.startsWith('--to=')) options.to = arg.slice('--to='.length)
  }
  return options
}

function showHelp() {
  console.log(`
Sync Tunes Portrait Alt Text

Rewrites the alt text on each weekly post's artist group portrait so it names the artists
actually cast, read from that week's tunes-artists-*.json sidecar. Run it after regenerating
portraits - a new cast means the old alt text describes the wrong people.

Usage:
  node scripts/sync-tunes-portrait-alt.js [--dry-run] [--from=YYYY-MM-DD] [--to=YYYY-MM-DD]

Options:
  --dry-run          Report what would change without writing
  --from=<date>      Only weeks on or after this date
  --to=<date>        Only weeks on or before this date
  --help, -h         Show this help
`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }

  const tunesDir = path.join(PROJECT_ROOT, 'src', 'content', 'tunes')
  const entries = await fs.readdir(tunesDir, { withFileTypes: true })
  const posts = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      posts.push({ slug: entry.name, file: path.join(tunesDir, entry.name, 'index.mdx') })
    } else if (entry.name.endsWith('.mdx')) {
      posts.push({ slug: entry.name.replace(/\.mdx$/, ''), file: path.join(tunesDir, entry.name) })
    }
  }

  let changed = 0
  let checked = 0
  let missingCast = 0

  for (const post of posts.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const week = post.slug.slice(0, 10)
    if (options.from && week < options.from) continue
    if (options.to && week > options.to) continue

    let body
    try {
      body = await fs.readFile(post.file, 'utf-8')
    } catch {
      continue
    }
    if (!body.includes('tunes-artists-')) continue
    checked += 1

    const fallback = topArtistsFrom(body)
    let updated = body
    let postChanged = false

    // Replace only the alt attribute inside each portrait <Img>, leaving the rest verbatim.
    const matches = [...body.matchAll(PORTRAIT_IMG)]
    for (const match of matches) {
      const [full, , weekFolder, rest] = match
      const cast = await castFor(weekFolder)
      if (cast.length === 0) missingCast += 1

      const alt = buildAlt(cast, fallback)
      if (!alt) continue

      const withoutAlt = rest.replace(/\s+alt="[^"]*"/, '')
      const replacement = `<Img src="${match[1]}" alt="${alt}"${withoutAlt}/>`
      if (replacement === full) continue

      updated = updated.replace(full, replacement)
      postChanged = true

      const before = (rest.match(/alt="([^"]*)"/) || [])[1]
      console.log(`${options.dryRun ? '·' : '✓'} ${post.slug}`)
      console.log(`    was: ${before === undefined ? '(no alt)' : before}`)
      console.log(`    now: ${alt}`)
    }

    if (postChanged) {
      changed += 1
      if (!options.dryRun) await fs.writeFile(post.file, updated)
    }
  }

  console.log('')
  console.log(`Checked ${checked} post(s) with a portrait; ${changed} needed updating`)
  if (missingCast > 0) {
    console.log(`${missingCast} portrait(s) had no readable sidecar cast and fell back to the week's top artists`)
  }
  if (options.dryRun) console.log('Dry run - nothing written')
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
