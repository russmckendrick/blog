import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rolling record of what the weekly images actually were - creative direction, concept,
// prompts - so the art director can be told "do not repeat these" and past prompts stay
// auditable. The file
// is COMMITTED (not gitignored) on purpose: the weekly GitHub Action runs on a fresh
// checkout, so a gitignored cache would be empty every run; the weekly commit carries the
// update along with the post. Only the weekly generator appends (the regenerate harness is
// opt-in via --record), and entries are capped per type, so the file stays small and
// conflict-free.
//
// Entries are ordered and trimmed by their own `date`, never by file position: backfills and
// repair runs append older weeks after newer ones, and a positional window silently served the
// art director a stale do-not-repeat list while evicting genuinely recent weeks.
const HISTORY_PATH = path.join(__dirname, '..', '.tunes-image-history.json')
const MAX_ENTRIES_PER_TYPE = 26

// Sort key for an entry. Undated entries sort oldest so a malformed record can never displace
// a real week from the window.
function dateKey(entry) {
  const value = entry?.date
  return typeof value === 'string' && value ? value : ''
}

// Oldest first, ties broken by original file order so same-week entries stay stable.
function byDateAscending(entries) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const left = dateKey(a.entry)
      const right = dateKey(b.entry)
      if (left !== right) return left < right ? -1 : 1
      return a.index - b.index
    })
    .map(item => item.entry)
}

// One entry per type+date: re-running a week (a regeneration recorded with --record) replaces
// that week rather than stacking duplicates that eat the window.
function dedupeByTypeAndDate(entries) {
  const kept = new Map()
  const undated = []
  for (const entry of entries) {
    const date = dateKey(entry)
    if (!date) {
      undated.push(entry)
      continue
    }
    kept.set(`${entry?.type || 'unknown'}::${date}`, entry)
  }
  return [...undated, ...kept.values()]
}

export { byDateAscending, dedupeByTypeAndDate, MAX_ENTRIES_PER_TYPE }

export async function loadHistory(historyPath = HISTORY_PATH) {
  try {
    const raw = await fs.readFile(historyPath, 'utf-8')
    const parsed = JSON.parse(raw)
    return {
      version: 1,
      entries: Array.isArray(parsed?.entries) ? parsed.entries : []
    }
  } catch {
    return { version: 1, entries: [] }
  }
}

// Append one entry and trim to the newest MAX_ENTRIES_PER_TYPE per image type.
export async function appendHistory(entry, historyPath = HISTORY_PATH) {
  const history = await loadHistory(historyPath)
  const deduped = dedupeByTypeAndDate([...history.entries, entry])

  const byType = new Map()
  for (const item of deduped) {
    const type = item?.type || 'unknown'
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type).push(item)
  }

  // Keep the newest MAX_ENTRIES_PER_TYPE of each type by date, then write the whole file back
  // in date order so the record stays readable and the next load starts from a sane state.
  const keep = new Set()
  for (const group of byType.values()) {
    for (const item of byDateAscending(group).slice(-MAX_ENTRIES_PER_TYPE)) keep.add(item)
  }
  history.entries = byDateAscending(deduped.filter(item => keep.has(item)))

  await fs.writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`, 'utf-8')
  return history
}

// The newest `count` concept one-liners for an image type, most recent first - fed to the
// art director as a do-not-repeat list. Zero means "feed nothing" (slice(-0) would return
// everything, the exact opposite).
export async function recentConcepts(type, count = 8, historyPath = HISTORY_PATH) {
  if (!Number.isFinite(count) || count <= 0) return []
  const history = await loadHistory(historyPath)
  const matching = dedupeByTypeAndDate(
    history.entries.filter(entry => entry?.type === type && entry?.concept)
  )
  return byDateAscending(matching)
    .slice(-count)
    .reverse()
    .map(entry => String(entry.concept))
}

// Write the run's full metadata next to the generated PNG (<name>.json). This replaces the
// old debug-only stdout as the way to see exactly what prompt produced an image. Harmless
// beside the assets: nothing imports it, and the generators' image readers filter by image
// extension.
export async function writeSidecar(outputPath, payload) {
  const ext = path.extname(outputPath)
  const sidecarPath = `${ext ? outputPath.slice(0, -ext.length) : outputPath}.json`
  await fs.mkdir(path.dirname(sidecarPath), { recursive: true })
  await fs.writeFile(sidecarPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
  return sidecarPath
}
