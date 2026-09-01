#!/usr/bin/env node
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { ConfigLoader } from './lib/config-loader.js'
import { artistKey, loadArtistUsage, recentlyUsedArtists } from './lib/tunes-artist-usage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Audit the committed artist-usage record against the reuse rule. A violation means some
// week's portrait features an artist who had already appeared within the window - either the
// portrait predates the rule, or it was regenerated out of date order, which gives a week a
// stale view of the six before it.
async function resolveReuseWeeks(override) {
  if (Number.isFinite(override) && override >= 0) return override
  try {
    const config = new ConfigLoader()
    await config.load()
    return config.getArtistReuseWeeks()
  } catch {
    return 6
  }
}

function parseArgs(args) {
  const options = { weeks: null, from: null, help: false }
  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--weeks=')) options.weeks = Number(arg.slice('--weeks='.length))
    else if (arg.startsWith('--from=')) options.from = arg.slice('--from='.length)
  }
  return options
}

function showHelp() {
  console.log(`
Check Tunes Artist Reuse

Audits scripts/.tunes-artist-usage.json against the artist reuse rule and reports any week
whose cast repeats an artist used within the window. Exits 1 when violations are found.

Usage:
  node scripts/check-tunes-artist-reuse.js [--weeks=6] [--from=YYYY-MM-DD]

Options:
  --weeks=<n>       Window to audit against (default: settings.artist_portrait_reuse_weeks)
  --from=<date>     Only audit weeks on or after this date
  --help, -h        Show this help
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help) {
    showHelp()
    return
  }

  const reuseWeeks = await resolveReuseWeeks(args.weeks)
  const usage = await loadArtistUsage()
  const weeks = Object.keys(usage.weeks)
    .filter(week => !args.from || week >= args.from)
    .sort()

  let violations = 0
  let castSlots = 0

  for (const week of weeks) {
    const recent = await recentlyUsedArtists(week, reuseWeeks)
    const cast = usage.weeks[week] || []
    castSlots += cast.length

    const repeats = cast
      .map(name => ({ name, hit: recent.get(artistKey(name)) }))
      .filter(item => item.hit)

    if (repeats.length > 0) {
      violations += repeats.length
      const detail = repeats
        .map(item => `${item.name} (last ${item.hit.week}, ${item.hit.weeksAgo}w ago)`)
        .join('; ')
      console.log(`✗ ${week}  ${detail}`)
    }
  }

  console.log('')
  console.log(`Audited ${weeks.length} week(s), ${castSlots} cast slot(s) against a ${reuseWeeks}-week window`)

  if (violations === 0) {
    console.log('✓ No artist repeats inside the window')
    return
  }

  // Relaxed casts on thin weeks are legitimate: the generator warns and records them in the
  // portrait sidecar's reuseRelaxed field, so check there before treating one as a bug.
  console.log(`✗ ${violations} repeat(s) inside the window - check each week's sidecar reuseRelaxed field before treating these as failures`)
  process.exitCode = 1
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
