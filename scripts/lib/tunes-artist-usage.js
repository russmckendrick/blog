import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Who has already appeared in a weekly artist portrait, keyed by week date. Without this the
// art director casts from play rank alone, and the same handful of heavily played artists
// turn up again and again - Tears for Fears and Pink Floyd each fronted five portraits in
// 2026 before this guardrail existed.
//
// The file is COMMITTED for the same reason as .tunes-image-history.json: the weekly GitHub
// Action runs on a fresh checkout, so a gitignored cache would be empty on every run.
// Unlike that append-only history this is a map keyed by week, so regenerating a week
// replaces its entry rather than stacking duplicates - reruns stay idempotent.
const USAGE_PATH = path.join(__dirname, '..', '.tunes-artist-usage.json')
const DEFAULT_REUSE_WEEKS = 6
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

// Match artists across the spelling differences between a filename ("Tears-for-Fears.jpg"),
// a humanised label ("Tears for Fears") and a Last.fm name ("Tears For Fears").
export function artistKey(name) {
  return String(name || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/\.(jpe?g|png|webp)$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

// "Tears-for-Fears.jpg" -> "Tears for Fears". Filenames are the only artist identity the
// generator carries through to the cast, so display names are derived from them.
export function displayNameFor(nameOrPath) {
  const base = path.basename(String(nameOrPath || ''))
  return base.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim()
}

export async function loadArtistUsage(usagePath = USAGE_PATH) {
  try {
    const raw = await fs.readFile(usagePath, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      version: 1,
      weeks: parsed?.weeks && typeof parsed.weeks === 'object' ? parsed.weeks : {}
    }
  } catch {
    return { version: 1, weeks: {} }
  }
}

export async function saveArtistUsage(usage, usagePath = USAGE_PATH) {
  // Sort by week so the committed file diffs cleanly no matter what order weeks were
  // generated or backfilled in.
  const weeks = {}
  for (const week of Object.keys(usage.weeks || {}).sort()) {
    weeks[week] = usage.weeks[week]
  }
  const payload = { version: 1, weeks }
  await fs.mkdir(path.dirname(usagePath), { recursive: true })
  await fs.writeFile(usagePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
  return payload
}

// Record the cast that actually made it into a week's portrait. Keyed by week, so a
// regenerated week overwrites its previous cast instead of leaving a stale one behind.
export async function recordArtistUsage(weekDate, artistNames, usagePath = USAGE_PATH) {
  if (!weekDate) return null
  const usage = await loadArtistUsage(usagePath)
  const names = []
  const seen = new Set()
  for (const name of artistNames || []) {
    const display = displayNameFor(name)
    const key = artistKey(display)
    if (!key || seen.has(key)) continue
    seen.add(key)
    names.push(display)
  }
  usage.weeks[weekDate] = names
  return saveArtistUsage(usage, usagePath)
}

// Every artist cast in the `weeks` weekly slots immediately before `weekDate`. The window is
// date-based rather than "the last N recorded weeks" so a gap in the archive does not quietly
// reach further back in time than the rule says.
//
// Returns a Map of artistKey -> { name, week, weeksAgo }, so callers can both block an artist
// and, when they have to relax the rule, prefer whoever was used longest ago.
export async function recentlyUsedArtists(weekDate, weeks = DEFAULT_REUSE_WEEKS, usagePath = USAGE_PATH) {
  const used = new Map()
  if (!weekDate || !Number.isFinite(weeks) || weeks <= 0) return used

  const target = new Date(weekDate).getTime()
  if (!Number.isFinite(target)) return used

  const earliest = target - weeks * MS_PER_WEEK
  const usage = await loadArtistUsage(usagePath)

  for (const [week, names] of Object.entries(usage.weeks || {})) {
    const when = new Date(week).getTime()
    if (!Number.isFinite(when)) continue
    // Strictly before the target week: a week never blocks itself on regeneration.
    if (when >= target || when < earliest) continue

    const weeksAgo = Math.round((target - when) / MS_PER_WEEK)
    for (const name of names || []) {
      const key = artistKey(name)
      if (!key) continue
      const existing = used.get(key)
      // Keep the most recent appearance; that is the one the relax order should punish most.
      if (!existing || when > new Date(existing.week).getTime()) {
        used.set(key, { name: displayNameFor(name), week, weeksAgo })
      }
    }
  }

  return used
}

// Apply the reuse rule to a play-ranked list of artist photo paths.
//
// Blocked artists are dropped, then - because a thin week can leave nothing to cast - the
// pool is topped back up from the blocked set, least recently used first, until it reaches
// `minimum`. The caller gets both the resulting order and an explanation of what happened,
// so the run can say out loud that it had to relax the rule.
export function applyArtistReuseRule({ imagePaths, recentlyUsed, minimum = 1 }) {
  const allowed = []
  const blocked = []

  for (const imagePath of imagePaths) {
    const key = artistKey(path.basename(imagePath))
    const hit = recentlyUsed.get(key)
    if (hit) blocked.push({ path: imagePath, name: displayNameFor(imagePath), ...hit })
    else allowed.push(imagePath)
  }

  // Least recently used first; ties keep play rank, which is the order they arrived in.
  const relaxOrder = [...blocked].sort((a, b) => a.week.localeCompare(b.week))
  const relaxed = []
  while (allowed.length + relaxed.length < minimum && relaxOrder.length > 0) {
    relaxed.push(relaxOrder.shift())
  }

  return {
    // Relaxed artists go last: the art director still sees fresh faces first.
    imagePaths: [...allowed, ...relaxed.map(item => item.path)],
    blocked,
    relaxed,
    stillBlocked: relaxOrder
  }
}

export { DEFAULT_REUSE_WEEKS, USAGE_PATH }
