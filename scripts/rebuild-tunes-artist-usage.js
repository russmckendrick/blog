#!/usr/bin/env node
import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { displayNameFor, saveArtistUsage, USAGE_PATH } from './lib/tunes-artist-usage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

// Rebuild scripts/.tunes-artist-usage.json from the per-week portrait sidecars, which are the
// archive's own record of who was actually cast. This is the repair path: the generator keeps
// the file current on every canonical run, but a hand-edit, a merge conflict, or a portrait
// regenerated to a throwaway path can leave it out of step with what is committed.
async function collectFromSidecars() {
  const assetsDir = path.join(PROJECT_ROOT, 'src', 'assets')
  const entries = await fs.readdir(assetsDir, { withFileTypes: true })
  const weeks = {}
  let scanned = 0

  const folders = entries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('-listened-to-this-week'))
    .map(entry => entry.name)
    .sort()

  for (const folder of folders) {
    const sidecarPath = path.join(assetsDir, folder, `tunes-artists-${folder}.json`)
    let sidecar
    try {
      sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf-8'))
    } catch {
      continue
    }
    scanned += 1

    const week = sidecar.date || folder.slice(0, 10)
    const names = []
    const seen = new Set()
    for (const input of sidecar.inputs || []) {
      const display = displayNameFor(input)
      if (!display || seen.has(display)) continue
      seen.add(display)
      names.push(display)
    }
    weeks[week] = names
  }

  return { weeks, scanned }
}

function parseArgs(args) {
  return {
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h')
  }
}

function showHelp() {
  console.log(`
Rebuild Tunes Artist Usage

Rebuilds scripts/.tunes-artist-usage.json - the committed record of which artists were cast
in each weekly group portrait - from the per-week tunes-artists-*.json sidecars in
src/assets/. The generator maintains this file automatically; run this only to repair drift.

Usage:
  node scripts/rebuild-tunes-artist-usage.js [--dry-run]

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

  const { weeks, scanned } = await collectFromSidecars()
  const weekCount = Object.keys(weeks).length
  const castCount = Object.values(weeks).reduce((total, names) => total + names.length, 0)

  console.log(`Scanned ${scanned} portrait sidecar(s)`)
  console.log(`Rebuilt ${weekCount} week(s), ${castCount} cast entries`)

  for (const week of Object.keys(weeks).sort()) {
    console.log(`  ${week}  ${weeks[week].join(', ') || '(no cast recorded)'}`)
  }

  if (args.dryRun) {
    console.log('\nDry run - nothing written')
    return
  }

  await saveArtistUsage({ version: 1, weeks })
  console.log(`\nWrote ${path.relative(PROJECT_ROOT, USAGE_PATH)}`)
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
