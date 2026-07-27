import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Rolling record of what the weekly images actually were - lane, concept, prompts - so the
// art director can be told "do not repeat these" and past prompts stay auditable. The file
// is COMMITTED (not gitignored) on purpose: the weekly GitHub Action runs on a fresh
// checkout, so a gitignored cache would be empty every run; the weekly commit carries the
// update along with the post. Only the weekly generator appends (the regenerate harness is
// opt-in via --record), and entries are capped per type, so the file stays small and
// conflict-free.
const HISTORY_PATH = path.join(__dirname, '..', '.tunes-image-history.json')
const MAX_ENTRIES_PER_TYPE = 26

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
  history.entries.push(entry)

  const byType = new Map()
  for (const item of history.entries) {
    const type = item?.type || 'unknown'
    if (!byType.has(type)) byType.set(type, [])
    byType.get(type).push(item)
  }

  const trimmed = []
  for (const item of history.entries) {
    const group = byType.get(item?.type || 'unknown')
    if (group.indexOf(item) >= group.length - MAX_ENTRIES_PER_TYPE) trimmed.push(item)
  }
  history.entries = trimmed

  await fs.writeFile(historyPath, `${JSON.stringify(history, null, 2)}\n`, 'utf-8')
  return history
}

// The newest `count` concept one-liners for an image type, most recent first - fed to the
// art director as a do-not-repeat list. Zero means "feed nothing" (slice(-0) would return
// everything, the exact opposite).
export async function recentConcepts(type, count = 8, historyPath = HISTORY_PATH) {
  if (!Number.isFinite(count) || count <= 0) return []
  const history = await loadHistory(historyPath)
  return history.entries
    .filter(entry => entry?.type === type && entry?.concept)
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
