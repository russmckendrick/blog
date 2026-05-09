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
import { normalizeForFilename } from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const TUNES_DIR = path.join(PROJECT_ROOT, 'src/content/tunes')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')
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

function createAssetSlug(filePath) {
  const relativePath = path.relative(TUNES_DIR, filePath)
  const parsed = path.parse(relativePath)
  const assetSlug = parsed.name === 'index'
    ? parsed.dir
    : path.join(parsed.dir, parsed.name)

  return assetSlug.split(path.sep).filter(Boolean).join('/')
}

function findTuneImage(assetSlug, kind, name) {
  if (!assetSlug || !name) return null

  const directoryPath = path.join(PUBLIC_DIR, 'assets', assetSlug, kind)
  const filename = `${normalizeForFilename(name)}.jpg`

  try {
    const files = fs.readdirSync(directoryPath)
    const exactMatch = files.find((file) => file === filename)
    if (exactMatch) return `/assets/${assetSlug}/${kind}/${exactMatch}`

    const target = normalizeForFilename(name).toLowerCase()
    const match = files.find((file) => {
      if (!/\.(jpe?g|png|webp)$/i.test(file)) return false
      const basename = path.basename(file, path.extname(file))
      return normalizeForFilename(basename).toLowerCase() === target
    })

    return match ? `/assets/${assetSlug}/${kind}/${match}` : null
  } catch {
    return null
  }
}

function mergeAlbumEntries(target, source) {
  if (source.name.length > target.name.length) target.name = source.name
  if (source.artist.length > target.artist.length) target.artist = source.artist
  if (!target.albumUrl && source.albumUrl) {
    target.albumUrl = source.albumUrl
    target.slug = source.slug
  }
  if (!target.artistUrl && source.artistUrl) target.artistUrl = source.artistUrl
  if (!target.image && source.image) target.image = source.image

  for (const post of source.posts) {
    if (!target.posts.find((existing) => existing.url === post.url)) {
      target.posts.push(post)
    }
  }
}

// Strip the russ.fm trailing numeric id (e.g. "the-holy-bible-20-6380440" -> "the-holy-bible-20").
function cleanRussFmSlug(slug) {
  return slug.replace(/-\d+$/, '')
}

// Extract slug from a russ.fm URL like /album/foo-bar-12345/ or /artist/foo-bar/.
function slugFromRussFmUrl(url, kind) {
  const match = url.match(new RegExp(`/${kind}s?/([^/?#]+)`))
  if (!match) return null
  return kind === 'album' ? cleanRussFmSlug(match[1]) : match[1]
}

// Strip markdown link syntax. Returns { text, url }.
function parseMarkdownLink(input) {
  const trimmed = input.trim()
  const linkMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/)
  if (linkMatch) return { text: linkMatch[1].trim(), url: linkMatch[2].trim() }
  return { text: trimmed, url: null }
}

function findBySeparators(input) {
  let bracketDepth = 0
  let parenDepth = 0
  const separatorIndexes = []

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (char === '[') bracketDepth += 1
    if (char === ']' && bracketDepth > 0) bracketDepth -= 1
    if (char === '(') parenDepth += 1
    if (char === ')' && parenDepth > 0) parenDepth -= 1

    if (bracketDepth === 0 && parenDepth === 0 && input.slice(i, i + 4).toLowerCase() === ' by ') {
      separatorIndexes.push(i)
    }
  }

  return separatorIndexes
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
  const linkedWholeLine = parseMarkdownLink(noPlays)

  if (linkedWholeLine.url) {
    const linkedByIndex = linkedWholeLine.text.toLowerCase().lastIndexOf(' by ')
    if (linkedByIndex > 0) {
      return {
        album: linkedWholeLine.text.slice(0, linkedByIndex).trim(),
        albumUrl: linkedWholeLine.url,
        artist: linkedWholeLine.text.slice(linkedByIndex + 4).trim(),
        artistUrl: null
      }
    }
  }

  const separators = findBySeparators(noPlays)
  // Prefer the delimiter after a linked album; otherwise split on the last
  // separator so plain album titles can contain "by".
  const lastByIndex = /^\[[^\]]+\]\([^)]+\)/.test(noPlays)
    ? separators[0]
    : separators[separators.length - 1]
  if (typeof lastByIndex !== 'number' || lastByIndex < 1) return null

  const albumPart = noPlays.slice(0, lastByIndex).trim()
  const artistPart = noPlays.slice(lastByIndex + 4).trim()
  if (!albumPart || !artistPart) return null

  const album = parseMarkdownLink(albumPart)
  const artist = parseMarkdownLink(artistPart)

  // Strip any decorative chars from text.
  const cleanText = (s) => s.replace(/^["'`*_]+|["'`*_]+$/g, '').trim()
  if (/(https?:\/\/|\]\()/.test(album.text) || /(https?:\/\/|\]\()/.test(artist.text)) {
    return null
  }

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
  const assetSlug = createAssetSlug(filePath)

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
    assetSlug,
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
  const albumAliases = new Map()
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
      const albumImage = findTuneImage(post.assetSlug, 'albums', item.album)
      const artistImage = findTuneImage(post.assetSlug, 'artists', item.artist)
      const preferredArtistSlug = item.artistUrl
        ? slugFromRussFmUrl(item.artistUrl, 'artist') || slugifyFallback(item.artist)
        : slugifyFallback(item.artist)
      const artistKey = slugifyFallback(item.artist)
      const albumSlugFromUrl = item.albumUrl ? slugFromRussFmUrl(item.albumUrl, 'album') : null
      const preferredAlbumSlug = albumSlugFromUrl
        ? albumSlugFromUrl
        : slugifyFallback(`${item.artist}-${item.album}`)
      const albumIdentity = slugifyFallback(item.album)

      if (!artistKey || !preferredArtistSlug || !preferredAlbumSlug || !albumIdentity) continue

      const albumKeys = [
        albumSlugFromUrl ? `${artistKey}|||url:${albumSlugFromUrl}` : null,
        `${artistKey}|||name:${albumIdentity}`
      ].filter(Boolean)
      const albumKey = albumKeys
        .map((key) => albumAliases.get(key) || (albums.has(key) ? key : null))
        .find(Boolean) || albumKeys[0]

      for (const key of albumKeys) albumAliases.set(key, albumKey)

      if (!albums.has(albumKey)) {
        albums.set(albumKey, {
          slug: preferredAlbumSlug,
          name: item.album,
          artist: item.artist,
          artistKey,
          artistSlug: preferredArtistSlug,
          albumUrl: item.albumUrl || null,
          artistUrl: item.artistUrl || null,
          image: albumImage,
          posts: []
        })
      }
      const albumEntry = albums.get(albumKey)
      // Take the longest seen album/artist name as canonical (tends to be the fully-formed one).
      if (item.album.length > albumEntry.name.length) albumEntry.name = item.album
      if (item.artist.length > albumEntry.artist.length) albumEntry.artist = item.artist
      if (!albumEntry.albumUrl && item.albumUrl) {
        albumEntry.albumUrl = item.albumUrl
        albumEntry.slug = preferredAlbumSlug
      }
      if (!albumEntry.artistUrl && item.artistUrl) albumEntry.artistUrl = item.artistUrl
      if (!albumEntry.image && albumImage) albumEntry.image = albumImage

      if (!albumEntry.posts.find((p) => p.url === post.postUrl)) {
        albumEntry.posts.push({ title: post.postTitle, url: post.postUrl, date: post.postDate })
      }

      if (!artists.has(artistKey)) {
        artists.set(artistKey, {
          slug: preferredArtistSlug,
          name: item.artist,
          artistUrl: item.artistUrl || null,
          image: artistImage,
          albums: new Set(),
          posts: new Map()
        })
      }
      const artistEntry = artists.get(artistKey)
      if (item.artist.length > artistEntry.name.length) artistEntry.name = item.artist
      if (!artistEntry.artistUrl && item.artistUrl) {
        artistEntry.artistUrl = item.artistUrl
        artistEntry.slug = preferredArtistSlug
      }
      if (!artistEntry.image && artistImage) artistEntry.image = artistImage
      artistEntry.albums.add(albumKey)
      artistEntry.posts.set(post.postUrl, { title: post.postTitle, url: post.postUrl, date: post.postDate })
    }
  }

  const mergedAlbumKeys = new Map()
  const albumRedirects = new Map()
  for (const [albumKey, entry] of albums.entries()) {
    const mergeKey = `${entry.artistKey}|||display:${slugifyFallback(entry.name)}`
    const existingKey = mergedAlbumKeys.get(mergeKey)

    if (!existingKey) {
      mergedAlbumKeys.set(mergeKey, albumKey)
      continue
    }

    const target = albums.get(existingKey)
    mergeAlbumEntries(target, entry)
    albumRedirects.set(albumKey, existingKey)
    albums.delete(albumKey)
  }

  for (const artistEntry of artists.values()) {
    artistEntry.albums = new Set(
      Array.from(artistEntry.albums).map((albumKey) => albumRedirects.get(albumKey) || albumKey)
    )
  }

  const albumEntries = Array.from(albums.values())
  const artistEntries = Array.from(artists.values())
  const usedArtistSlugs = new Set()
  for (const entry of artistEntries) {
    const fallbackSlug = slugifyFallback(entry.name)
    let slug = entry.slug || fallbackSlug
    if (usedArtistSlugs.has(slug)) slug = fallbackSlug

    const baseSlug = slug
    let suffix = 2
    while (usedArtistSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    entry.slug = slug
    usedArtistSlugs.add(slug)
  }

  const usedAlbumSlugs = new Set()
  for (const entry of albumEntries) {
    const artistEntry = artists.get(entry.artistKey)
    if (artistEntry) entry.artistSlug = artistEntry.slug

    const fallbackSlug = slugifyFallback(`${entry.artist}-${entry.name}`)
    let slug = entry.slug || fallbackSlug
    if (usedAlbumSlugs.has(slug)) slug = fallbackSlug

    const baseSlug = slug
    let suffix = 2
    while (usedAlbumSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    entry.slug = slug
    usedAlbumSlugs.add(slug)
  }

  const byArtist = artistEntries
    .map((entry) => ({
      slug: entry.slug,
      name: entry.name,
      artistUrl: entry.artistUrl,
      image: entry.image,
      albumCount: entry.albums.size,
      postCount: entry.posts.size,
      albums: Array.from(entry.albums)
        .map((albumKey) => albums.get(albumKey)?.slug)
        .filter(Boolean)
        .sort(),
      posts: Array.from(entry.posts.values()).sort((a, b) => b.date.localeCompare(a.date))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))

  const byAlbum = albumEntries
    .map(({ artistKey, ...entry }) => ({
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
