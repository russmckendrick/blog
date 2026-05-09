import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'
import fg from 'fast-glob'
import { CollectionManager } from './lib/collection-manager.js'
import {
  escapeQuotes,
  isVariousArtists,
  lookupAlbumData,
  lookupArtistData,
  normalizeForFilename
} from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')
const TUNES_DIR = path.join(PROJECT_ROOT, 'src', 'content', 'tunes')
const PUBLIC_ASSETS_DIR = path.join(PROJECT_ROOT, 'public', 'assets')
const COLLECTION_URL = process.env.COLLECTION_URL || 'https://www.russ.fm'
const GENERATED_START = '{/* tunes-backfill:start */}'
const GENERATED_END = '{/* tunes-backfill:end */}'
const LEGACY_GENERATED_START = '<!-- tunes-backfill:start -->'
const LEGACY_GENERATED_END = '<!-- tunes-backfill:end -->'

function printHelp() {
  console.log(`Backfill older tunes images and repair russ.fm links.

Usage:
  pnpm run backfill-tunes-images [options]

Options:
  --dry-run              Show planned changes without writing files or downloading images
  --older                Backfill image galleries/assets for no-gallery weekly posts (default)
  --all                  Backfill assets across all weekly tunes posts
  --file=<path>          Limit both link repair and image backfill to one MDX file
  --from=YYYY-MM-DD      Limit image backfill, and link repair when paired with --from/--to
  --to=YYYY-MM-DD        Limit image backfill, and link repair when paired with --from/--to
  --assets-only          Download missing assets only; do not edit MDX
  --links-only           Repair resolvable Top Artists/Top Albums links only
  --no-link-repair       Skip list link repair while still backfilling older galleries/assets
  --help                 Show this help
`)
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    older: false,
    all: false,
    assetsOnly: false,
    linksOnly: false,
    noLinkRepair: false,
    help: false,
    file: null,
    from: null,
    to: null
  }

  for (const arg of argv) {
    if (arg === '--') continue
    else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--older') options.older = true
    else if (arg === '--all') options.all = true
    else if (arg === '--assets-only') options.assetsOnly = true
    else if (arg === '--links-only') options.linksOnly = true
    else if (arg === '--no-link-repair') options.noLinkRepair = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--file=')) options.file = path.resolve(arg.slice('--file='.length))
    else if (arg.startsWith('--from=')) options.from = arg.slice('--from='.length)
    else if (arg.startsWith('--to=')) options.to = arg.slice('--to='.length)
    else if (!arg.startsWith('--') && !options.file) options.file = path.resolve(arg)
    else throw new Error(`Unknown option: ${arg}`)
  }

  if (options.assetsOnly && options.linksOnly) {
    throw new Error('Use either --assets-only or --links-only, not both')
  }

  if (options.all && options.older) {
    throw new Error('Use either --all or --older, not both')
  }

  if (!options.all && !options.older && !options.file && !options.from && !options.to) {
    options.older = true
  }

  return options
}

function isValidDateString(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function assetSlugFromFile(filePath) {
  const relativePath = path.relative(TUNES_DIR, filePath)
  const parsed = path.parse(relativePath)
  const assetSlug = parsed.name === 'index'
    ? parsed.dir
    : path.join(parsed.dir, parsed.name)

  return assetSlug.split(path.sep).filter(Boolean).join('/')
}

function postDateFromAssetSlug(assetSlug) {
  return assetSlug.match(/^(\d{4}-\d{2}-\d{2})-listened-to-this-week$/)?.[1] || null
}

async function listWeeklyPosts() {
  const files = await fg('**/*.{md,mdx}', { cwd: TUNES_DIR, absolute: true })
  return files
    .map((filePath) => {
      const assetSlug = assetSlugFromFile(filePath)
      const date = postDateFromAssetSlug(assetSlug)
      if (!date) return null
      return { filePath, assetSlug, date }
    })
    .filter(Boolean)
    .sort((a, b) => a.filePath.localeCompare(b.filePath))
}

function matchesDateRange(post, options) {
  if (options.from && post.date < options.from) return false
  if (options.to && post.date > options.to) return false
  return true
}

function selectPosts(posts, options, contentsByFile) {
  if (options.file) {
    const target = posts.find((post) => post.filePath === options.file)
    if (!target) throw new Error(`File is not a weekly tunes post: ${options.file}`)
    return [target]
  }

  const rangedPosts = posts.filter((post) => matchesDateRange(post, options))
  if (options.all || ((options.from || options.to) && !options.older)) return rangedPosts

  return rangedPosts.filter((post) => {
    const content = contentsByFile.get(post.filePath) || ''
    return !stripGeneratedBlock(content).includes('<LightGallery')
  })
}

function linkRepairPosts(posts, imagePosts, options) {
  if (options.assetsOnly || options.noLinkRepair) return []
  if (options.file) {
    const target = posts.find((post) => post.filePath === options.file)
    if (!target) throw new Error(`File is not a weekly tunes post: ${options.file}`)
    return [target]
  }
  if (options.from || options.to) return posts.filter((post) => matchesDateRange(post, options))
  return posts
}

function stripGeneratedBlock(content) {
  let nextContent = content
  const markerPairs = [
    [GENERATED_START, GENERATED_END],
    [LEGACY_GENERATED_START, LEGACY_GENERATED_END]
  ]

  for (const [start, end] of markerPairs) {
    const pattern = new RegExp(`\\n?${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g')
    nextContent = nextContent.replace(pattern, '\n')
  }

  return nextContent
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseMarkdownLink(input) {
  const trimmed = input.trim()
  const separatorIndex = trimmed.startsWith('[') && trimmed.endsWith(')')
    ? trimmed.lastIndexOf('](')
    : -1

  if (separatorIndex > 0) {
    return {
      text: unescapeMarkdownLinkText(trimmed.slice(1, separatorIndex).trim()),
      url: trimmed.slice(separatorIndex + 2, -1).trim()
    }
  }

  return { text: trimmed, url: null }
}

function formatMarkdownLink(text, url) {
  return url ? `[${escapeMarkdownLinkText(text)}](${url})` : text
}

function escapeMarkdownLinkText(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
}

function unescapeMarkdownLinkText(text) {
  return text.replace(/\\([\[\]\\])/g, '$1')
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

function parseListItem(line) {
  const match = line.match(/^(\s*(?:[-*]|\d+\.)\s+)(.+?)(\s*)$/)
  if (!match) return null
  return { prefix: match[1], body: match[2], trailingWhitespace: match[3] }
}

function parseArtistLine(line) {
  const item = parseListItem(line)
  if (!item) return null

  const playMatch = item.body.match(/^(.*?)\s*(\(\d+\s+plays?\))$/i)
  if (!playMatch) return null

  const artist = parseMarkdownLink(playMatch[1].trim())
  return {
    ...item,
    artist: artist.text,
    artistUrl: artist.url,
    playSuffix: playMatch[2],
    linked: Boolean(artist.url)
  }
}

function parseAlbumLine(line) {
  const item = parseListItem(line)
  if (!item) return null

  const playMatch = item.body.match(/^(.*?)\s*(\(\d+\s+plays?\))$/i)
  const noPlays = (playMatch ? playMatch[1] : item.body).trim()
  const separators = findBySeparators(noPlays)
  const byIndex = /^\[[^\]]+\]\([^)]+\)/.test(noPlays)
    ? separators[0]
    : separators[separators.length - 1]

  if (typeof byIndex !== 'number' || byIndex < 1) return null

  const album = parseMarkdownLink(noPlays.slice(0, byIndex).trim())
  const artist = parseMarkdownLink(noPlays.slice(byIndex + 4).trim())
  if (!album.text || !artist.text) return null

  return {
    ...item,
    album: cleanDisplayText(album.text),
    albumUrl: album.url,
    artist: cleanDisplayText(artist.text),
    artistUrl: artist.url,
    playSuffix: playMatch?.[2] || '',
    albumLinked: Boolean(album.url),
    artistLinked: Boolean(artist.url)
  }
}

function cleanDisplayText(value) {
  return value.replace(/^["'`*_]+|["'`*_]+$/g, '').trim()
}

function findSectionRange(lines, headingName) {
  const headingRegex = new RegExp(`^##\\s+${headingName}\\b`, 'i')
  const headingIndex = lines.findIndex((line) => headingRegex.test(line))
  if (headingIndex === -1) return null

  let end = lines.length
  for (let i = headingIndex + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) {
      end = i
      break
    }
  }

  return { headingIndex, start: headingIndex + 1, end }
}

function extractArtists(content) {
  const lines = content.split('\n')
  const range = findSectionRange(lines, 'Top\\s+Artists')
  if (!range) return []

  return lines
    .slice(range.start, range.end)
    .map((line) => parseArtistLine(line))
    .filter(Boolean)
}

function extractAlbums(content) {
  const lines = content.split('\n')
  const range = findSectionRange(lines, 'Top\\s+Albums')
  if (!range) return []

  return lines
    .slice(range.start, range.end)
    .map((line) => parseAlbumLine(line))
    .filter(Boolean)
}

function repairLinks(content, collectionInfo, stats) {
  const lines = content.split('\n')
  const artistRange = findSectionRange(lines, 'Top\\s+Artists')

  if (artistRange) {
    for (let i = artistRange.start; i < artistRange.end; i += 1) {
      const item = parseArtistLine(lines[i])
      if (!item || item.linked || isVariousArtists(item.artist)) continue

      const artistData = lookupArtistData(item.artist, collectionInfo)
      if (artistData?.link) {
        lines[i] = `${item.prefix}${formatMarkdownLink(item.artist, artistData.link)} ${item.playSuffix}${item.trailingWhitespace}`
        stats.artistLinks += 1
        stats.details.push(`link artist: ${item.artist} -> ${artistData.link}`)
      } else {
        stats.unresolvedArtistLinks += 1
      }
    }
  }

  const albumRange = findSectionRange(lines, 'Top\\s+Albums')
  if (albumRange) {
    for (let i = albumRange.start; i < albumRange.end; i += 1) {
      const item = parseAlbumLine(lines[i])
      if (!item) continue

      const albumData = item.albumLinked ? null : lookupAlbumData(item.artist, item.album, collectionInfo)
      const artistData = item.artistLinked || isVariousArtists(item.artist)
        ? null
        : lookupArtistData(item.artist, collectionInfo)

      const albumUrl = item.albumUrl || albumData?.link || null
      const artistUrl = item.artistUrl || artistData?.link || null

      if (!item.albumLinked && albumData?.link) stats.albumLinks += 1
      else if (!item.albumLinked) stats.unresolvedAlbumLinks += 1

      if (!item.artistLinked && !isVariousArtists(item.artist) && artistData?.link) stats.albumArtistLinks += 1
      else if (!item.artistLinked && !isVariousArtists(item.artist)) stats.unresolvedAlbumArtistLinks += 1

      if (albumUrl !== item.albumUrl || artistUrl !== item.artistUrl) {
        const playSuffix = item.playSuffix ? ` ${item.playSuffix}` : ''
        lines[i] = `${item.prefix}${formatMarkdownLink(item.album, albumUrl)} by ${formatMarkdownLink(item.artist, artistUrl)}${playSuffix}${item.trailingWhitespace}`
        if (albumData?.link) stats.details.push(`link album: ${item.album} by ${item.artist} -> ${albumData.link}`)
        if (artistData?.link) stats.details.push(`link album artist: ${item.artist} -> ${artistData.link}`)
      }
    }
  }

  return lines.join('\n')
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

function imagePath(assetSlug, kind, name) {
  const filename = `${normalizeForFilename(name)}.jpg`
  return {
    filename,
    absolute: path.join(PUBLIC_ASSETS_DIR, assetSlug, kind, filename),
    publicPath: `/assets/${assetSlug}/${kind}/${filename}`
  }
}

async function ensureImage({ url, folderName, absolute, name, dryRun, stats }) {
  if (!url) {
    stats.unresolvedImages += 1
    return false
  }

  if (await fileExists(absolute)) {
    stats.existingImages += 1
    return true
  }

  if (dryRun) {
    stats.plannedDownloads += 1
    stats.details.push(`download image: ${name} -> ${path.relative(PROJECT_ROOT, absolute)}`)
    return true
  }

  try {
    await fs.mkdir(folderName, { recursive: true })
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    await fs.writeFile(absolute, response.data)
    await fs.writeFile(`${absolute}.meta`, JSON.stringify({ Title: name }, null, 2))
    stats.downloadedImages += 1
    return true
  } catch (error) {
    stats.failedDownloads += 1
    stats.failures.push(`${name}: ${error.message}`)
    return false
  }
}

async function backfillAssets(post, content, collectionInfo, options, stats) {
  const albums = extractAlbums(content)
  const topArtists = extractArtists(content)
  const artistNames = new Set(topArtists.map((item) => item.artist))

  for (const item of albums) {
    artistNames.add(item.artist)

    const albumData = lookupAlbumData(item.artist, item.album, collectionInfo)
    const albumImage = imagePath(post.assetSlug, 'albums', item.album)
    await ensureImage({
      url: albumData?.image,
      folderName: path.dirname(albumImage.absolute),
      absolute: albumImage.absolute,
      name: item.album,
      dryRun: options.dryRun,
      stats
    })
  }

  for (const artist of artistNames) {
    if (isVariousArtists(artist)) continue

    const artistData = lookupArtistData(artist, collectionInfo)
    const artistImage = imagePath(post.assetSlug, 'artists', artist)
    await ensureImage({
      url: artistData?.image,
      folderName: path.dirname(artistImage.absolute),
      absolute: artistImage.absolute,
      name: artist,
      dryRun: options.dryRun,
      stats
    })
  }
}

function renderLightGallery(images) {
  if (images.length === 0) return ''

  const lines = [
    '<LightGallery',
    '  layout={{',
    '    imgs: ['
  ]

  images.forEach((image, index) => {
    const comma = index < images.length - 1 ? ',' : ''
    lines.push(`      { src: "${image.src}", alt: "${escapeQuotes(image.alt)}" }${comma}`)
  })

  lines.push('    ]')
  lines.push('  }}')
  lines.push('/>')
  return lines.join('\n')
}

function wrapGeneratedGallery(gallery) {
  return [
    GENERATED_START,
    '',
    gallery,
    '',
    GENERATED_END
  ].join('\n')
}

function buildAlbumGalleryImages(post, content, collectionInfo) {
  const albums = extractAlbums(content)
  const images = []
  const seen = new Set()

  for (const item of albums) {
    const albumData = lookupAlbumData(item.artist, item.album, collectionInfo)
    if (!albumData?.image) continue

    const albumImage = imagePath(post.assetSlug, 'albums', item.album)
    if (seen.has(albumImage.publicPath)) continue

    seen.add(albumImage.publicPath)
    images.push({
      src: albumImage.publicPath,
      alt: `${item.album} by ${item.artist}`
    })
  }

  return images
}

function buildArtistGalleryImages(post, content, collectionInfo) {
  const artists = []
  const seenNames = new Set()
  const seenImages = new Set()

  for (const item of extractArtists(content)) {
    const key = item.artist.toLowerCase()
    if (seenNames.has(key)) continue
    seenNames.add(key)
    artists.push(item.artist)
  }

  for (const item of extractAlbums(content)) {
    const key = item.artist.toLowerCase()
    if (seenNames.has(key)) continue
    seenNames.add(key)
    artists.push(item.artist)
  }

  const images = []
  for (const artist of artists) {
    if (isVariousArtists(artist)) continue

    const artistData = lookupArtistData(artist, collectionInfo)
    if (!artistData?.image) continue

    const artistImage = imagePath(post.assetSlug, 'artists', artist)
    if (seenImages.has(artistImage.publicPath)) continue

    seenImages.add(artistImage.publicPath)
    images.push({
      src: artistImage.publicPath,
      alt: artist
    })
  }

  return images
}

function findTopGalleryInsertIndex(lines) {
  const noteStart = lines.findIndex((line) => /^<NoteCallout\b/.test(line.trim()))
  if (noteStart !== -1) {
    const noteEnd = lines.findIndex((line, index) => index > noteStart && /^<\/NoteCallout>/.test(line.trim()))
    if (noteEnd !== -1) return noteEnd + 1
  }

  if (lines[0] === '---') {
    const frontmatterEnd = lines.findIndex((line, index) => index > 0 && line === '---')
    if (frontmatterEnd !== -1) return frontmatterEnd + 1
  }

  return 0
}

function insertLines(lines, index, block) {
  return [
    ...lines.slice(0, index),
    '',
    block,
    '',
    ...lines.slice(index)
  ]
}

function insertGeneratedGalleries(post, content, collectionInfo, stats) {
  const contentWithoutGenerated = stripGeneratedBlock(content)
  if (contentWithoutGenerated.includes('<LightGallery')) return contentWithoutGenerated

  const albumImages = buildAlbumGalleryImages(post, contentWithoutGenerated, collectionInfo)
  const artistImages = buildArtistGalleryImages(post, contentWithoutGenerated, collectionInfo)

  if (albumImages.length === 0 && artistImages.length === 0) return contentWithoutGenerated

  let nextContent = contentWithoutGenerated
  let galleryCount = 0

  if (albumImages.length > 0) {
    const albumGallery = wrapGeneratedGallery(renderLightGallery(albumImages))
    const lines = nextContent.split('\n')
    nextContent = insertLines(lines, findTopGalleryInsertIndex(lines), albumGallery).join('\n')
    galleryCount += 1
    stats.details.push(`generate album gallery: ${albumImages.length} images`)
  }

  if (artistImages.length > 0) {
    const artistGallery = wrapGeneratedGallery(renderLightGallery(artistImages))
    nextContent = `${nextContent.trimEnd()}\n\n${artistGallery}\n`
    galleryCount += 1
    stats.details.push(`generate artist gallery: ${artistImages.length} images`)
  }

  stats.generatedGalleries += galleryCount
  return nextContent.replace(/\n{4,}/g, '\n\n\n')
}

function changedStats(before, after) {
  return before === after ? 'unchanged' : 'changed'
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }

  if (!isValidDateString(options.from) || !isValidDateString(options.to)) {
    throw new Error('--from and --to must use YYYY-MM-DD')
  }

  const posts = await listWeeklyPosts()
  const contentsByFile = new Map()
  await Promise.all(posts.map(async (post) => {
    contentsByFile.set(post.filePath, await fs.readFile(post.filePath, 'utf-8'))
  }))

  const imagePosts = options.linksOnly ? [] : selectPosts(posts, options, contentsByFile)
  const linkPosts = linkRepairPosts(posts, imagePosts, options)
  const processingPaths = new Set([...imagePosts, ...linkPosts].map((post) => post.filePath))
  const postsByPath = new Map(posts.map((post) => [post.filePath, post]))

  console.log('Tunes image/link backfill')
  console.log('='.repeat(40))
  console.log(`Mode: ${options.dryRun ? 'dry run' : 'live'}`)
  console.log(`Image/gallery posts: ${imagePosts.length}`)
  console.log(`Link repair posts: ${linkPosts.length}`)
  console.log('')

  const collectionManager = new CollectionManager(COLLECTION_URL)
  const { info: collectionInfo } = await collectionManager.processCollectionData()

  const linkPathSet = new Set(linkPosts.map((post) => post.filePath))
  const imagePathSet = new Set(imagePosts.map((post) => post.filePath))
  const totals = {
    filesChanged: 0,
    artistLinks: 0,
    albumLinks: 0,
    albumArtistLinks: 0,
    unresolvedArtistLinks: 0,
    unresolvedAlbumLinks: 0,
    unresolvedAlbumArtistLinks: 0,
    generatedGalleries: 0,
    plannedDownloads: 0,
    downloadedImages: 0,
    existingImages: 0,
    unresolvedImages: 0,
    failedDownloads: 0,
    failures: [],
    details: []
  }

  for (const filePath of Array.from(processingPaths).sort()) {
    const post = postsByPath.get(filePath)
    const original = contentsByFile.get(filePath)
    let content = original
    const stats = {
      artistLinks: 0,
      albumLinks: 0,
      albumArtistLinks: 0,
      unresolvedArtistLinks: 0,
      unresolvedAlbumLinks: 0,
      unresolvedAlbumArtistLinks: 0,
      generatedGalleries: 0,
      plannedDownloads: 0,
      downloadedImages: 0,
      existingImages: 0,
      unresolvedImages: 0,
      failedDownloads: 0,
      failures: [],
      details: []
    }

    if (linkPathSet.has(filePath)) {
      content = repairLinks(content, collectionInfo, stats)
    }

    if (imagePathSet.has(filePath)) {
      await backfillAssets(post, content, collectionInfo, options, stats)
      if (!options.assetsOnly) {
        content = insertGeneratedGalleries(post, content, collectionInfo, stats)
      }
    }

    if (content !== original) {
      totals.filesChanged += 1
      if (!options.dryRun) await fs.writeFile(filePath, content)
    }

    for (const [key, value] of Object.entries(stats)) {
      if (Array.isArray(value)) totals[key].push(...value)
      else totals[key] += value
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath)
    const linkChanges = stats.artistLinks + stats.albumLinks + stats.albumArtistLinks
    const imageChanges = stats.plannedDownloads + stats.downloadedImages
    if (content !== original || linkChanges > 0 || imageChanges > 0 || stats.generatedGalleries > 0) {
      console.log(`- ${relativePath}: ${changedStats(original, content)}, links ${linkChanges}, galleries ${stats.generatedGalleries}, downloads ${imageChanges}`)
      if (options.dryRun && processingPaths.size <= 5) {
        for (const detail of stats.details.slice(0, 20)) {
          console.log(`  - ${detail}`)
        }
        if (stats.details.length > 20) {
          console.log(`  - ...and ${stats.details.length - 20} more planned actions`)
        }
      }
    }
  }

  console.log('')
  console.log('Summary')
  console.log('='.repeat(40))
  console.log(`Files ${options.dryRun ? 'that would change' : 'changed'}: ${totals.filesChanged}`)
  console.log(`Artist links repaired: ${totals.artistLinks}`)
  console.log(`Album links repaired: ${totals.albumLinks}`)
  console.log(`Top album artist links repaired: ${totals.albumArtistLinks}`)
  console.log(`Generated galleries: ${totals.generatedGalleries}`)
  console.log(`Images ${options.dryRun ? 'planned for download' : 'downloaded'}: ${options.dryRun ? totals.plannedDownloads : totals.downloadedImages}`)
  console.log(`Existing images skipped: ${totals.existingImages}`)
  console.log(`Images without collection source: ${totals.unresolvedImages}`)
  console.log(`Failed downloads: ${totals.failedDownloads}`)
  console.log(`Unresolved artist links: ${totals.unresolvedArtistLinks}`)
  console.log(`Unresolved album links: ${totals.unresolvedAlbumLinks}`)
  console.log(`Unresolved Top Albums artist links: ${totals.unresolvedAlbumArtistLinks}`)

  if (totals.failures.length > 0) {
    console.log('')
    console.log('Failures')
    for (const failure of totals.failures.slice(0, 20)) {
      console.log(`- ${failure}`)
    }
    if (totals.failures.length > 20) {
      console.log(`- ...and ${totals.failures.length - 20} more`)
    }
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
