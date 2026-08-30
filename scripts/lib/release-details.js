import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const MAX_TRACKS = 40
const MAX_TRACKLIST_CHARS = 2000
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/**
 * Fetches the per-release JSON behind `json_detailed_release` in collection.json.
 *
 * The flat collection file has no tracklist; the detailed file does, and for compilations
 * every track carries its own performer. That is the only place we can learn who actually
 * appears on a "Various" release, so the writer gets it as prompt context.
 *
 * Best-effort throughout: a failed fetch returns null and the caller falls back to the
 * fields already in collection.json.
 */
export class ReleaseDetails {
  constructor(cacheDir = 'scripts/.release-cache') {
    this.cacheDir = cacheDir
    this.enabled = process.env.ENABLE_RELEASE_CACHE !== 'false'
    this.memo = new Map()
    this.initialized = false
  }

  async init() {
    if (this.initialized || !this.enabled) return
    this.initialized = true

    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await fs.writeFile(path.join(this.cacheDir, '.gitignore'), '*\n!.gitignore\n')
    } catch (error) {
      console.warn(`Failed to initialize release cache: ${error.message}`)
      this.enabled = false
    }
  }

  getCachePath(detailUrl) {
    const key = crypto.createHash('md5').update(detailUrl).digest('hex')
    return path.join(this.cacheDir, `${key}.json`)
  }

  async fetch(detailUrl) {
    if (!detailUrl) return null
    if (this.memo.has(detailUrl)) return this.memo.get(detailUrl)

    await this.init()

    const cached = await this.readCache(detailUrl)
    if (cached) {
      this.memo.set(detailUrl, cached)
      return cached
    }

    try {
      const response = await axios.get(detailUrl, { timeout: 20000 })
      const detail = response.data
      this.memo.set(detailUrl, detail)
      await this.writeCache(detailUrl, detail)
      return detail
    } catch (error) {
      console.warn(`    ⚠ Could not fetch release details: ${error.message}`)
      this.memo.set(detailUrl, null)
      return null
    }
  }

  async readCache(detailUrl) {
    if (!this.enabled) return null

    try {
      const cachePath = this.getCachePath(detailUrl)
      const stats = await fs.stat(cachePath).catch(() => null)
      if (!stats) return null

      if (Date.now() - stats.mtimeMs > CACHE_MAX_AGE_MS) {
        await fs.unlink(cachePath).catch(() => {})
        return null
      }

      return JSON.parse(await fs.readFile(cachePath, 'utf-8'))
    } catch {
      return null
    }
  }

  async writeCache(detailUrl, detail) {
    if (!this.enabled || !detail) return

    try {
      await fs.writeFile(this.getCachePath(detailUrl), JSON.stringify(detail))
    } catch (error) {
      console.warn(`Failed to cache release details: ${error.message}`)
    }
  }
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return []
  const seen = new Set()
  const out = []
  for (const value of values) {
    const trimmed = typeof value === 'string' ? value.trim() : ''
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(trimmed)
  }
  return out
}

/**
 * Render one tracklist line. Compilations carry a performer per track; single-artist
 * releases have an empty `artists` array, so the performer is simply left off.
 */
function formatTrack(track) {
  const position = (track.position || '').trim()
  const title = (track.title || '').trim()
  if (!title) return null

  const performers = uniqueStrings((track.artists || []).map(entry => entry?.name))
  const duration = (track.duration || '').trim()

  let line = position ? `${position}. ` : '- '
  if (performers.length > 0) line += `${performers.join(' & ')} - `
  line += title
  if (duration) line += ` (${duration})`
  return line
}

function formatTracklist(tracklist) {
  if (!Array.isArray(tracklist) || tracklist.length === 0) return []

  const lines = []
  let chars = 0
  let used = 0

  for (const track of tracklist) {
    if (used >= MAX_TRACKS || chars >= MAX_TRACKLIST_CHARS) break
    const line = formatTrack(track)
    if (!line) continue
    lines.push(line)
    chars += line.length + 1
    used += 1
  }

  const omitted = tracklist.length - used
  if (omitted > 0) lines.push(`...and ${omitted} more track${omitted === 1 ? '' : 's'}`)

  return lines
}

/**
 * Build the "Release Details" prompt block from the collection entry plus, when available,
 * the fetched detailed release JSON. Returns '' when there is nothing worth sending -
 * ConfigLoader.interpolate leaves unknown placeholders literal, so callers must always
 * pass a string.
 */
export function formatReleaseDetails(albumData, detail = null) {
  if (!albumData && !detail) return ''

  const data = albumData || {}
  const lines = []

  const push = (label, value) => {
    if (Array.isArray(value)) {
      const unique = uniqueStrings(value)
      if (unique.length > 0) lines.push(`- ${label}: ${unique.join(', ')}`)
      return
    }
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      lines.push(`- ${label}: ${String(value).trim()}`)
    }
  }

  push('Release', data.release_name)
  push('Credited artist', data.release_artist)
  push('Labels', [...(detail?.labels || []), ...(data.labels || [])])
  push('Country', detail?.country || data.country)
  push('Released', detail?.released || detail?.year || data.release_year)
  push('Formats', [data.format_primary, ...(detail?.formats || []), ...(data.formats || [])])
  push('Genres', [...(detail?.genres || []), ...(data.genres || [])])
  push('Styles', [...(detail?.styles || []), ...(data.styles || [])])
  push('Added to my collection', data.date_added)
  push('Discogs', detail?.discogs_url)

  const trackLines = formatTracklist(detail?.tracklist)
  if (trackLines.length > 0) {
    lines.push('- Tracklist:')
    for (const line of trackLines) lines.push(`  ${line}`)
  }

  return lines.join('\n')
}
