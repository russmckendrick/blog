import { promises as fs } from 'fs'
import path from 'path'

export function emptyTunesPostContext() {
  return {
    title: '',
    summary: '',
    topArtists: [],
    topAlbums: []
  }
}

function finitePlayCount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeTunesPostContext(context = {}) {
  const topArtists = (Array.isArray(context.topArtists) ? context.topArtists : [])
    .map(item => {
      if (Array.isArray(item)) {
        return {
          artist: String(item[0] || '').trim(),
          plays: finitePlayCount(item[1])
        }
      }
      return {
        artist: String(item?.artist || item?.name || '').trim(),
        plays: finitePlayCount(item?.plays)
      }
    })
    .filter(item => item.artist)

  const topAlbums = (Array.isArray(context.topAlbums) ? context.topAlbums : [])
    .map(item => {
      if (Array.isArray(item)) {
        const identity = Array.isArray(item[0]) ? item[0] : []
        return {
          artist: String(identity[0] || '').trim(),
          album: String(identity[1] || '').trim(),
          plays: finitePlayCount(item[1])
        }
      }
      return {
        artist: String(item?.artist || '').trim(),
        album: String(item?.album || item?.title || '').trim(),
        plays: finitePlayCount(item?.plays)
      }
    })
    .filter(item => item.album)

  return {
    title: String(context.title || '').trim(),
    summary: String(context.summary || context.description || '').trim(),
    topArtists,
    topAlbums
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
  if (!heading) return []
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

export function parseTunesPostContext(content) {
  const topArtistHeading = content.match(/^## Top Artists.*$/m)?.[0] || ''
  const topAlbumHeading = content.match(/^## Top Albums.*$/m)?.[0] || ''

  const topArtists = sectionLines(content, topArtistHeading)
    .map(parseListItem)
    .filter(Boolean)
    .map(item => {
      const match = item.match(/^(.*?)\s+\((\d+)\s+plays?\)$/i)
      if (!match) return null
      return {
        artist: parseMarkdownLinkText(match[1]),
        plays: Number(match[2])
      }
    })
    .filter(Boolean)

  const topAlbums = sectionLines(content, topAlbumHeading)
    .map(parseListItem)
    .filter(Boolean)
    .map(item => {
      const playsMatch = item.match(/\((\d+)\s+plays?\)\s*$/i)
      const body = item.replace(/\s+\(\d+\s+plays?\)$/i, '')
      const byIndex = body.toLowerCase().lastIndexOf(' by ')
      if (byIndex === -1) return null
      return {
        album: parseMarkdownLinkText(body.slice(0, byIndex)),
        artist: parseMarkdownLinkText(body.slice(byIndex + 4)),
        plays: playsMatch ? Number(playsMatch[1]) : null
      }
    })
    .filter(Boolean)

  return normalizeTunesPostContext({
    title: parseFrontmatterValue(content, 'title'),
    summary: parseFrontmatterValue(content, 'description'),
    topArtists,
    topAlbums
  })
}

export async function findTunesPostPath(rootDir, dateStr) {
  const flatPath = path.join(rootDir, 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week.mdx`)
  const indexPath = path.join(rootDir, 'src', 'content', 'tunes', `${dateStr}-listened-to-this-week`, 'index.mdx')

  for (const postPath of [flatPath, indexPath]) {
    try {
      await fs.access(postPath)
      return postPath
    } catch {
      // Try the next supported Tunes post layout.
    }
  }
  return null
}

export async function readTunesPostContext(rootDir, dateStr) {
  const postPath = await findTunesPostPath(rootDir, dateStr)
  if (!postPath) return emptyTunesPostContext()
  return parseTunesPostContext(await fs.readFile(postPath, 'utf-8'))
}

export function extractTunesDate(value) {
  return String(value || '').match(/(\d{4}-\d{2}-\d{2})-listened-to-this-week/)?.[1] || ''
}

export function formatTunesPostContext(context = {}) {
  const normalized = normalizeTunesPostContext(context)
  const parts = []

  if (normalized.title) parts.push(`Post title: ${normalized.title}`)
  if (normalized.summary) parts.push(`Post summary: ${normalized.summary}`)

  if (normalized.topArtists.length > 0) {
    const artists = normalized.topArtists
      .map(item => item.plays == null ? item.artist : `${item.artist} (${item.plays} plays)`)
      .join('; ')
    parts.push(`Top artists, in listening-rank order: ${artists}`)
  }

  if (normalized.topAlbums.length > 0) {
    const albums = normalized.topAlbums
      .map(item => {
        const identity = item.artist ? `${item.album} by ${item.artist}` : item.album
        return item.plays == null ? identity : `${identity} (${item.plays} plays)`
      })
      .join('; ')
    parts.push(`Top albums, in listening-rank order: ${albums}`)
  }

  return parts.join('\n')
}
