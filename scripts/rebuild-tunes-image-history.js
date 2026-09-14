#!/usr/bin/env node
import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  byDateAscending,
  dedupeByTypeAndDate,
  MAX_ENTRIES_PER_TYPE
} from './lib/tunes-image-history.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const HISTORY_PATH = path.join(__dirname, '.tunes-image-history.json')

// Rebuild scripts/.tunes-image-history.json from the per-week sidecars, which are the archive's
// own record of what each image actually was. This is the repair path: the weekly generator
// keeps the file current, but a backfill appending older weeks after newer ones leaves the
// do-not-repeat window reading from the wrong end of the file.
async function collectFromSidecars() {
  const assetsDir = path.join(PROJECT_ROOT, 'src', 'assets')
  const dirEntries = await fs.readdir(assetsDir, { withFileTypes: true })
  const folders = dirEntries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('-listened-to-this-week'))
    .map(entry => entry.name)
    .sort()

  const collected = []
  let scanned = 0

  for (const folder of folders) {
    for (const prefix of ['tunes-cover', 'tunes-artists']) {
      const sidecarPath = path.join(assetsDir, folder, `${prefix}-${folder}.json`)
      let sidecar
      try {
        sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf-8'))
      } catch {
        continue
      }
      scanned += 1
      // The sidecar and the history entry are the same run record, so it carries across whole.
      // Older sidecars predate the date field; fall back to the folder name.
      collected.push({ ...sidecar, date: sidecar.date || folder.slice(0, 10) })
    }
  }

  return { collected, scanned }
}

function trimPerType(entries) {
  const byType = new Map()
  for (const entry of entries) {
    const type = entry?.type || 'unknown'
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type).push(entry)
  }

  const keep = new Set()
  for (const group of byType.values()) {
    for (const entry of byDateAscending(group).slice(-MAX_ENTRIES_PER_TYPE)) keep.add(entry)
  }

  return byDateAscending(entries.filter(entry => keep.has(entry)))
}

function parseArgs(args) {
  return {
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h')
  }
}

function showHelp() {
  console.log(`
Rebuild Tunes Image History

Rebuilds scripts/.tunes-image-history.json - the committed rolling record of weekly cover and
portrait concepts, fed to the art director as a do-not-repeat list - from the per-week
tunes-cover-*.json and tunes-artists-*.json sidecars in src/assets/. The generator maintains
this file automatically; run this only to repair drift, such as a backfill that appended older
weeks after newer ones.

Entries are written in date order and capped at ${MAX_ENTRIES_PER_TYPE} per type.

Usage:
  node scripts/rebuild-tunes-image-history.js [--dry-run]

Options:
  --dry-run     Print what would be written without touching the file
  --help, -h    Show this help
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    showHelp()
    return
  }

  const { collected, scanned } = await collectFromSidecars()
  const entries = trimPerType(dedupeByTypeAndDate(collected))

  const counts = entries.reduce((totals, entry) => {
    const type = entry?.type || 'unknown'
    totals[type] = (totals[type] || 0) + 1
    return totals
  }, {})

  console.log(`Scanned ${scanned} sidecar(s) across ${new Set(collected.map(e => e.date)).size} week(s)`)
  console.log(`Keeping ${entries.length} entr(ies): ${Object.entries(counts).map(([t, n]) => `${n} ${t}`).join(', ')}`)

  for (const type of Object.keys(counts).sort()) {
    const ofType = entries.filter(entry => (entry?.type || 'unknown') === type)
    const first = ofType[0]?.date
    const last = ofType[ofType.length - 1]?.date
    console.log(`  ${type}: ${first} -> ${last}`)
  }

  if (args.dryRun) {
    console.log('\nDry run - nothing written')
    return
  }

  await fs.writeFile(HISTORY_PATH, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`, 'utf-8')
  console.log(`\nWrote ${path.relative(PROJECT_ROOT, HISTORY_PATH)}`)
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
