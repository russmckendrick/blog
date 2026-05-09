#!/usr/bin/env node
// Builds src/data/tunes-index.json - a sorted index of every album/artist
// featured in the weekly tunes posts, parsed from each post's "Top Albums"
// section. Powers the programmatic SEO browse pages at /tunes/artist/* and
// /tunes/album/*.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const TUNES_DIR = path.join(PROJECT_ROOT, 'src/content/tunes')
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'src/data/tunes-index.json')

function slugifyFallback(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’'`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function createPostSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '')
}

// Strip the russ.fm trailing numeric id (e.g. "the-holy-bible-20-6380440" -> "the-holy-bible-20").
function cleanRussFmSlug(slug) {
  return slug.replace(/-\d+$/, '')
}

// Extract slug from a russ.fm URL like /album/foo-bar-12345/ or /artist/foo-bar/.
function slugFromRussFmUrl(url, kind) {
  const match = url.match(new RegExp(`/${kind}s?/([^/?#]+)`))
  if (!match) return null
  return cleanRussFmSlug(match[1])
}

// Strip markdown link syntax. Returns { text, url }.
function parseMarkdownLink(input) {
  const trimmed = input.trim()
  const linkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/)
  if (linkMatch) return { text: linkMatch[1].trim(), url: linkMatch[2].trim() }
  return { text: trimmed, url: null }
}

// Walk the body looking for a "## Top Albums" section.
function extractTopAlbumsSection(body) {
  const lines = body.split('\n')
  let inSection = false
  const collected = []
  for (const line of lines) {
    if (/^##\s+Top\s+Albums/i.test(line)) {
      inSection = true
      continue
    }
    if (inSection && /^##\s+/.test(line)) break
    // Some posts close the section with a JSX callout instead of another heading.
    if (inSection && /^\s*<[A-Za-z]/.test(line)) break
    if (inSection) collected.push(line)
  }
  return collected.join('\n')
}

// Parse one list item like "- [Album](url) by [Artist](url) (5 plays)".
function parseAlbumLine(line) {
  // Must look like a markdown list item (`- `, `* `, or `N. `).
  if (!/^\s*(?:[-*]|\d+\.)\s+\S/.test(line)) return null
  const stripped = line.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim()
  if (!stripped) return null
  // Skip JSX/HTML lines or stray prose that snuck into the list.
  if (/^[<\\#]/.test(stripped)) return null

  // Drop trailing "(N plays)" if present.
  const noPlays = stripped.replace(/\s*\(\d+\s+plays?\)\s*$/i, '').trim()

  // Split on the LAST " by " - album titles may contain "by".
  const lastByIndex = noPlays.toLowerCase().lastIndexOf(' by ')
  if (lastByIndex < 1) return null

  const albumPart = noPlays.slice(0, lastByIndex).trim()
  const artistPart = noPlays.slice(lastByIndex + 4).trim()
  if (!albumPart || !artistPart) return null

  const album = parseMarkdownLink(albumPart)
  const artist = parseMarkdownLink(artistPart)

  // Strip any decorative chars from text.
  const cleanText = (s) => s.replace(/^["'`*_]+|["'`*_]+$/g, '').trim()

  return {
    album: cleanText(album.text),
    albumUrl: album.url,
    artist: cleanText(artist.text),
    artistUrl: artist.url
  }
}

function processPost(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const parsed = matter(raw)
  const data = parsed.data || {}

  if (data.draft === true) return null

  const title = data.title || path.basename(filePath, path.extname(filePath))
  const pubDate = data.date || data.pubDate
  if (!pubDate) return null

  const dateObj = new Date(pubDate)
  if (Number.isNaN(dateObj.getTime())) return null

  const year = dateObj.getFullYear().toString()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const postSlug = createPostSlug(title)
  const postUrl = `/${year}/${month}/${day}/${postSlug}/`

  const section = extractTopAlbumsSection(parsed.content)
  if (!section.trim()) return null

  const items = section
    .split('\n')
    .map((line) => parseAlbumLine(line))
    .filter(Boolean)

  if (items.length === 0) return null

  return {
    postTitle: title,
    postUrl,
    postDate: dateObj.toISOString(),
    items
  }
}

function buildIndex() {
  if (!fs.existsSync(TUNES_DIR)) {
    console.warn(`[tunes-index] Tunes directory not found at ${TUNES_DIR}`)
    return
  }

  const files = fg.sync('**/*.{md,mdx}', { cwd: TUNES_DIR, absolute: true }).sort()

  const albums = new Map()
  const artists = new Map()
  const posts = []

  for (const file of files) {
    let post
    try {
      post = processPost(file)
    } catch (err) {
      console.warn(`[tunes-index] Failed to parse ${path.relative(PROJECT_ROOT, file)}: ${err.message}`)
      continue
    }
    if (!post) continue

    posts.push({ title: post.postTitle, url: post.postUrl, date: post.postDate, count: post.items.length })

    for (const item of post.items) {
      const artistSlug = item.artistUrl
        ? slugFromRussFmUrl(item.artistUrl, 'artist') || slugifyFallback(item.artist)
        : slugifyFallback(item.artist)
      const albumSlug = item.albumUrl
        ? slugFromRussFmUrl(item.albumUrl, 'album') || slugifyFallback(`${item.artist}-${item.album}`)
        : slugifyFallback(`${item.artist}-${item.album}`)

      if (!artistSlug || !albumSlug) continue

      const albumKey = albumSlug
      if (!albums.has(albumKey)) {
        albums.set(albumKey, {
          slug: albumKey,
          name: item.album,
          artist: item.artist,
          artistSlug,
          albumUrl: item.albumUrl || null,
          artistUrl: item.artistUrl || null,
          posts: []
        })
      }
      const albumEntry = albums.get(albumKey)
      // Take the longest seen album/artist name as canonical (tends to be the fully-formed one).
      if (item.album.length > albumEntry.name.length) albumEntry.name = item.album
      if (item.artist.length > albumEntry.artist.length) albumEntry.artist = item.artist

      if (!albumEntry.posts.find((p) => p.url === post.postUrl)) {
        albumEntry.posts.push({ title: post.postTitle, url: post.postUrl, date: post.postDate })
      }

      if (!artists.has(artistSlug)) {
        artists.set(artistSlug, {
          slug: artistSlug,
          name: item.artist,
          artistUrl: item.artistUrl || null,
          albums: new Set(),
          posts: new Map()
        })
      }
      const artistEntry = artists.get(artistSlug)
      if (item.artist.length > artistEntry.name.length) artistEntry.name = item.artist
      artistEntry.albums.add(albumKey)
      artistEntry.posts.set(post.postUrl, { title: post.postTitle, url: post.postUrl, date: post.postDate })
    }
  }

  const byArtist = Array.from(artists.values())
    .map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      artistUrl: entry.artistUrl,
      albumCount: entry.albums.size,
      postCount: entry.posts.size,
      albums: Array.from(entry.albums).sort(),
      posts: Array.from(entry.posts.values()).sort((a, b) => b.date.localeCompare(a.date))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

  const byAlbum = Array.from(albums.values())
    .map((entry) => ({
      ...entry,
      posts: entry.posts.sort((a, b) => b.date.localeCompare(a.date))
    }))
    .sort((a, b) => {
      const artistCmp = a.artist.localeCompare(b.artist, 'en', { sensitivity: 'base' })
      if (artistCmp !== 0) return artistCmp
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    })

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      posts: posts.length,
      artists: byArtist.length,
      albums: byAlbum.length
    },
    artists: byArtist,
    albums: byAlbum
  }
}

const index = buildIndex()
if (!index) {
  process.exit(0)
}

const outputDir = path.dirname(OUTPUT_FILE)
fs.mkdirSync(outputDir, { recursive: true })
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2) + '\n')

console.log(
  `[tunes-index] Wrote ${path.relative(PROJECT_ROOT, OUTPUT_FILE)} - ` +
  `${index.totals.artists} artists, ${index.totals.albums} albums across ${index.totals.posts} posts.`
)
