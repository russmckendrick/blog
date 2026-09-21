import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import { COVER_BLOCKLIST } from './tunes-cover-blocklist.js'
import { isContentPolicyViolation } from './lib/fal-content-policy.js'
import { ConfigLoader } from './lib/config-loader.js'
import { getBackend, BACKENDS } from './lib/image-backends/index.js'
import { appendHistory, recentConcepts, recentMedia, writeSidecar } from './lib/tunes-image-history.js'
import { extractTunesDate } from './lib/tunes-post-context.js'
import {
  buildGenerationPrompt as buildFreeformGenerationPrompt,
  designCoverArtDirection,
  isPhotographicMedium,
  summarizeAlbumCovers
} from './lib/tunes-cover-art-direction.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_COVER_BACKEND = 'nano-banana'
const MIN_TIMESTAMP_SEED = 604800000

// Resolve the cover compose backend: explicit option first, then tunes-config.yaml, then the
// default. Unknown ids warn and fall back, and single-image backends are refused because the
// original album artwork remains attached to every generation call.
async function resolveCoverBackend(explicit) {
  let requested = explicit
  if (!requested) {
    try {
      const config = new ConfigLoader()
      await config.load()
      requested = config.getCoverBackend()
    } catch {
      requested = DEFAULT_COVER_BACKEND
    }
  }

  const backend = getBackend(requested)
  if (backend && (backend.maxInputImages ?? 1) > 1) return backend

  if (backend) {
    console.warn(`  Backend "${backend.id}" only accepts one input image and cannot compose; falling back to ${DEFAULT_COVER_BACKEND}`)
  } else {
    console.warn(`  Unknown image backend "${requested}"; falling back to ${DEFAULT_COVER_BACKEND}`)
  }
  return BACKENDS[DEFAULT_COVER_BACKEND]
}

// Resolve the backend to switch to when the primary refuses on a content-policy violation.
// Precedence: explicit option -> env -> tunes-config.yaml -> default (nano-banana, when it
// is not already primary). "none"/"off"/"" disables it.
async function resolveCoverFallbackBackend(primaryBackend, explicit) {
  let requested = explicit ?? process.env.TUNES_COVER_FALLBACK_BACKEND
  if (requested == null) {
    try {
      const config = new ConfigLoader()
      await config.load()
      requested = config.getCoverFallbackBackend()
    } catch {
      requested = undefined
    }
  }

  if (requested == null) {
    // No explicit choice: default to nano-banana unless it is already the primary backend.
    requested = primaryBackend.id === DEFAULT_COVER_BACKEND ? '' : DEFAULT_COVER_BACKEND
  }

  const normalized = String(requested).trim().toLowerCase()
  if (!normalized || normalized === 'none' || normalized === 'off') return null

  const backend = getBackend(requested)
  if (!backend) {
    console.warn(`  Unknown cover fallback backend "${requested}"; disabling fallback`)
    return null
  }
  if ((backend.maxInputImages ?? 1) <= 1) {
    console.warn(`  Cover fallback backend "${backend.id}" cannot compose multiple inputs; disabling fallback`)
    return null
  }

  return backend.id === primaryBackend.id ? null : backend
}

async function resolveHistorySize() {
  try {
    const config = new ConfigLoader()
    await config.load()
    return config.getCoverHistorySize()
  } catch {
    return 8
  }
}

// These are defects rather than creative direction. The art director chooses the medium,
// composition, palette, and scene from factual image summaries.
const TEXT_NEGATIVE_TERMS = [
  'readable text',
  'letters',
  'words',
  'numbers',
  'captions',
  'titles',
  'logos',
  'watermarks',
  'signage'
]

const LAYOUT_NEGATIVE_TERMS = [
  'grid layout',
  'contact sheet',
  'evenly tiled squares',
  'raw album-cover thumbnails',
  'collage of separate panels'
]

const ANTI_ILLUSTRATION_TERMS = [
  'illustration',
  'illustrated',
  'drawing',
  'painting',
  'cartoon',
  'comic',
  'anime',
  'vector art',
  'sketch',
  'flat graphic style'
]

// The artist portrait remains intentionally photographic and imports this back-compatible
// set. Header covers do not use it because illustration, print, photography, and mixed media
// are all valid AI-selected directions.
const NEGATIVE_TERMS = [
  ...TEXT_NEGATIVE_TERMS,
  ...LAYOUT_NEGATIVE_TERMS,
  ...ANTI_ILLUSTRATION_TERMS
]

function colorDistance(a, b) {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt((dr * dr) + (dg * dg) + (db * db))
}

async function detectTextScore(imagePath) {
  try {
    const metadata = await sharp(imagePath).metadata()
    const width = metadata.width || 512
    const height = metadata.height || 512
    const bandHeight = Math.max(1, Math.floor(height * 0.2))

    // Album lettering is not confined to title/artist bands at the top and bottom: the
    // Flood sleeve that leaked "They Might Be Giants" into a generated cover carries its
    // lettering in the middle. Sample the whole height in five strips so central badges,
    // logos, and type-heavy designs affect selection too.
    const regions = [0, 0.2, 0.4, 0.6, 0.8].map(position => ({
      left: 0,
      top: Math.min(height - bandHeight, Math.floor(height * position)),
      width,
      height: bandHeight
    }))

    let edgePixels = 0
    let totalPixels = 0

    for (const region of regions) {
      const buffer = await sharp(imagePath)
        .extract(region)
        .resize(256, 52, { fit: 'fill' })
        .greyscale()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
        })
        .raw()
        .toBuffer()

      totalPixels += buffer.length
      for (const value of buffer) {
        if (value > 50) edgePixels++
      }
    }

    return totalPixels > 0 ? (edgePixels / totalPixels) * 100 : 100
  } catch {
    return 100
  }
}

async function analyzeImage(imagePath, rank) {
  const image = sharp(imagePath).resize(128, 128, { fit: 'cover' }).removeAlpha()
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const pixelCount = info.width * info.height

  let rSum = 0
  let gSum = 0
  let bSum = 0
  let saturationSum = 0
  let contrastSum = 0

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)

    rSum += r
    gSum += g
    bSum += b
    saturationSum += max - min
    contrastSum += Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r)
  }

  const color = {
    r: Math.round(rSum / pixelCount),
    g: Math.round(gSum / pixelCount),
    b: Math.round(bSum / pixelCount)
  }
  const saturation = saturationSum / pixelCount
  const contrast = contrastSum / pixelCount
  const textScore = await detectTextScore(imagePath)
  const rankScore = Math.max(0, 60 - (rank * 4))
  // Text-like edge density must outweigh a small play-rank advantage; otherwise a
  // lettering-heavy top album is guaranteed into the primary set before scoring matters.
  const imageScore = rankScore + (saturation * 0.3) + (contrast * 0.08) - (textScore * 1.1)

  return {
    path: imagePath,
    rank,
    color,
    saturation,
    contrast,
    textScore,
    score: imageScore
  }
}

async function selectCoverInputs(imagePaths, options = {}) {
  const { maxCount = 8, primaryCount = 7, debug = false } = options
  const uniquePaths = []
  const seen = new Set()

  for (const imagePath of imagePaths) {
    const key = path.basename(imagePath).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) {
      seen.add(key)
      uniquePaths.push(imagePath)
    }
  }

  if (uniquePaths.length === 0) {
    throw new Error('No unique album images provided for tunes cover generation')
  }

  const analyses = await Promise.all(uniquePaths.map((imagePath, index) => analyzeImage(imagePath, index)))
  const selectedCount = Math.min(primaryCount, maxCount, analyses.length)
  const textHeavyThreshold = 24
  const ranked = [...analyses].sort((a, b) => b.score - a.score)
  // Prefer cleaner covers for the primary set, but retain text-heavy candidates as a
  // fallback when a small week would otherwise run short of usable source material.
  const preferred = ranked.filter(item => item.textScore < textHeavyThreshold)
  const textHeavy = ranked.filter(item => item.textScore >= textHeavyThreshold)
  const candidates = [...preferred, ...textHeavy]
  const selected = candidates.slice(0, selectedCount)
  const remaining = candidates.slice(selected.length)

  while (selected.length < Math.min(maxCount, analyses.length) && remaining.length > 0) {
    let bestIndex = 0
    let bestScore = Number.NEGATIVE_INFINITY

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      const minDistance = Math.min(...selected.map(item => colorDistance(candidate.color, item.color)))
      const combinedScore = (minDistance * 0.65) + (candidate.score * 0.35)

      if (combinedScore > bestScore) {
        bestScore = combinedScore
        bestIndex = i
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0])
  }

  if (debug) {
    if (textHeavy.length > 0) {
      console.log(`  Deprioritized ${textHeavy.length} text-heavy cover candidate(s): ${textHeavy.map(item => path.basename(item.path)).join(', ')}`)
    }
    console.log(`  Selected ${selected.length} cover inputs:`)
    selected.forEach((item, index) => {
      console.log(`    ${index + 1}. ${path.basename(item.path)} [rank: ${item.rank + 1}, text: ${item.textScore.toFixed(1)}%, rgb: ${item.color.r},${item.color.g},${item.color.b}]`)
    })
  }

  return {
    selectedPaths: selected.map(item => item.path),
    analyses
  }
}

// Reference size sent to the image model. Faces on a sleeve are often a small fraction of the
// square (Hounds of Love sits inside a wide white border), and the model copies a face better
// the more pixels of it it is given, so plain borders are trimmed first and the crop is sent
// larger than the old 900px.
const REFERENCE_SIZE = Number(process.env.TUNES_COVER_REFERENCE_SIZE || 1280)
const TRIM_THRESHOLD = 24

async function prepareReferenceImage(imagePath) {
  let pipeline = sharp(imagePath)
  try {
    const { width = 0, height = 0 } = await sharp(imagePath).metadata()
    const { info } = await sharp(imagePath).trim({ threshold: TRIM_THRESHOLD }).toBuffer({ resolveWithObject: true })
    const kept = (info.width * info.height) / Math.max(1, width * height)
    // Only accept a trim that removed a real border: a near-uniform sleeve (a flat colour
    // field with one small mark) would otherwise collapse to the mark alone.
    if (kept < 0.98 && kept >= 0.35) pipeline = sharp(imagePath).trim({ threshold: TRIM_THRESHOLD })
  } catch {
    // Uniform image or trim failure: send it untrimmed.
  }
  return pipeline
    .resize(REFERENCE_SIZE, REFERENCE_SIZE, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function uploadAlbumImages(imagePaths, debug = false) {
  const urls = []

  for (const imagePath of imagePaths) {
    const buffer = await prepareReferenceImage(imagePath)

    const file = new File([buffer], path.basename(imagePath), { type: 'image/jpeg' })
    const url = await fal.storage.upload(file)
    urls.push(url)

    if (debug) {
      console.log(`    Uploaded ${path.basename(imagePath)} -> ${url}`)
    }
  }

  return urls
}

function compactKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function humanizeImageName(imagePath) {
  return path.basename(imagePath, path.extname(imagePath)).replace(/[-_]+/g, ' ').trim()
}

function buildSourceReferences(imagePaths) {
  return imagePaths.map((imagePath, index) => {
    const filename = path.basename(imagePath)
    return {
      source: index + 1,
      filename,
      album: humanizeImageName(imagePath),
      artist: '',
      plays: null
    }
  })
}

function filterBlocklistedCovers(imagePaths, debug = false) {
  if (!Array.isArray(COVER_BLOCKLIST) || COVER_BLOCKLIST.length === 0) return imagePaths

  const blockedKeys = new Set(
    COVER_BLOCKLIST.map(entry => compactKey(entry?.album || entry)).filter(Boolean)
  )
  if (blockedKeys.size === 0) return imagePaths

  const allowed = []
  const removed = []
  for (const imagePath of imagePaths) {
    const key = compactKey(path.basename(imagePath, path.extname(imagePath)))
    if (blockedKeys.has(key)) removed.push(imagePath)
    else allowed.push(imagePath)
  }

  if (removed.length > 0) {
    console.log(`  Skipping ${removed.length} blocklisted album cover(s): ${removed.map(item => path.basename(item)).join(', ')}`)
  }

  if (allowed.length === 0) {
    console.warn('  Every album cover was blocklisted; using the full set so a cover can still be generated')
    return imagePaths
  }

  if (debug && removed.length > 0) {
    console.log(`  ${allowed.length} cover(s) remain after the blocklist`)
  }

  return allowed
}

function stripCodeFence(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

function extractFirstJSONObject(text) {
  const source = String(text || '')
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      if (depth === 0) start = i
      depth++
    } else if (char === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        return source.slice(start, i + 1)
      }
    }
  }

  return null
}

function parseJSONResponse(text) {
  const cleaned = stripCodeFence(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    const objectText = extractFirstJSONObject(cleaned)
    if (!objectText) throw new Error('No JSON object found in model output')
    return JSON.parse(objectText)
  }
}

function smallOutputPathFor(outputPath) {
  const actualExt = path.extname(outputPath)
  const ext = actualExt || '.png'
  const base = actualExt ? outputPath.slice(0, outputPath.length - actualExt.length) : outputPath
  return `${base}-small${ext}`
}


async function saveGeneratedImage(imageUrl, outputPath, width, height, debug = false) {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status} ${response.statusText}`)
  }

  const rawBuffer = Buffer.from(await response.arrayBuffer())
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  const metadata = await sharp(rawBuffer).metadata()
  await sharp(rawBuffer)
    .png({ compressionLevel: 6, quality: 100 })
    .toFile(outputPath)

  const smallOutputPath = smallOutputPathFor(outputPath)
  await sharp(rawBuffer)
    .resize(width, height, { fit: 'cover' })
    .png({ compressionLevel: 6, quality: 100 })
    .toFile(smallOutputPath)

  if (debug) {
    console.log(`  Saved full cover: ${outputPath} (${metadata.width || '?'}x${metadata.height || '?'})`)
    console.log(`  Saved small cover: ${smallOutputPath} (${width}x${height})`)
  }

  return {
    outputPath,
    smallOutputPath,
    originalWidth: metadata.width,
    originalHeight: metadata.height
  }
}

function buildAttemptSets(selectedPaths, analyses, maxCount, minCount) {
  const sets = [selectedPaths]
  const rankedByScore = [...analyses]
    .sort((a, b) => b.score - a.score)
    .map(item => item.path)

  const second = rankedByScore.filter(item => !selectedPaths.slice(0, 3).includes(item)).slice(0, maxCount)
  if (second.length >= minCount) sets.push(second)

  const third = rankedByScore.slice(Math.max(0, rankedByScore.length - maxCount))
  if (third.length >= minCount) sets.push(third)

  const seen = new Set()
  return sets.filter(set => {
    const key = set.join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function createFALTunesCover(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed = Date.now(),
    debug = process.env.DEBUG_COLLAGE === '1',
    recordHistory = false
  } = options

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for tunes cover generation')
  }
  fal.config({ credentials: falKey })

  const historySize = await resolveHistorySize()
  const avoidConcepts = await recentConcepts('cover', historySize)
  // Photographic treatments are recorded but never refused - photography is the default.
  const avoidMedia = (await recentMedia('cover', historySize)).filter(medium => !isPhotographicMedium(medium))

  const sourceImagePaths = filterBlocklistedCovers(imagePaths, debug)

  const { selectedPaths, analyses } = await selectCoverInputs(sourceImagePaths, {
    maxCount: Number(process.env.TUNES_COVER_MAX_INPUTS || 8),
    primaryCount: Number(process.env.TUNES_COVER_PRIMARY_INPUTS || 7),
    debug
  })

  const minCount = Math.min(2, selectedPaths.length)
  const attemptSets = buildAttemptSets(
    selectedPaths,
    analyses,
    Number(process.env.TUNES_COVER_MAX_INPUTS || 8),
    minCount
  )

  const primaryBackend = await resolveCoverBackend(options.backend)
  const fallbackBackend = await resolveCoverFallbackBackend(primaryBackend, options.fallbackBackend)
  const backendChain = fallbackBackend ? [primaryBackend, fallbackBackend] : [primaryBackend]

  console.log('  Creative direction: AI-selected from factual album-cover summaries')
  if (debug) {
    console.log(`  Image backend: ${backendChain.map(b => b.label).join(' -> ')}`)
    if (options.hint) console.log(`  Author's steer: ${options.hint}`)
    if (avoidConcepts.length > 0) console.log(`  Avoiding recent concepts: ${avoidConcepts.join(' | ')}`)
    if (avoidMedia.length > 0) console.log(`  Avoiding recent media: ${avoidMedia.join(' | ')}`)
  }

  // Try each backend in turn. Within a backend, content-policy refusals retry with alternate
  // album inputs; once those are exhausted we drop to the next backend (typically the more
  // permissive nano-banana) rather than failing the whole post. Non-policy errors throw at once.
  for (let b = 0; b < backendChain.length; b++) {
    const backend = backendChain[b]
    const isLastBackend = b === backendChain.length - 1
    if (b > 0) {
      console.warn(`  ${backendChain[b - 1].label} refused all attempts; falling back to ${backend.label}`)
    }

    for (let attempt = 0; attempt < attemptSets.length; attempt++) {
      const attemptPaths = attemptSets[attempt]

      try {
        if (debug) {
          console.log(`  Attempt ${attempt + 1} (${backend.label}): generating a freeform cover from ${attemptPaths.length} album covers`)
        }

        const imageUrls = await uploadAlbumImages(attemptPaths, debug)
        const sourceReferences = buildSourceReferences(attemptPaths)
        const coverSummaries = await summarizeAlbumCovers({
          imageUrls,
          sourceReferences,
          debug
        })
        const artDirection = await designCoverArtDirection({
          coverSummaries,
          sourceReferences,
          hint: options.hint,
          avoidConcepts,
          avoidMedia,
          debug
        })
        const prompt = buildFreeformGenerationPrompt(artDirection, coverSummaries)

        if (debug) {
          console.log(`  Prompt: ${prompt}`)
        }

        const composed = await backend.generate({ imageUrls, prompt, seed, debug })

        const saved = await saveGeneratedImage(composed.imageUrl, outputPath, width, height, debug)
        console.log(`  Created tunes cover (${backend.label}) from ${attemptPaths.length} album covers`)
        console.log(`    Direction: ${artDirection.creativeDirection}`)
        console.log(`    Full:  ${saved.outputPath}`)
        console.log(`    Small: ${saved.smallOutputPath}`)

        const runRecord = {
          version: 2,
          date: options.dateLabel || (Number.isFinite(seed) && seed >= MIN_TIMESTAMP_SEED ? new Date(seed).toISOString().slice(0, 10) : ''),
          type: 'cover',
          lane: null,
          lighting: null,
          shootDirection: null,
          colourTreatment: null,
          concept: artDirection.concept,
          medium: artDirection.medium,
          creativeDirection: artDirection.creativeDirection,
          scene: artDirection.scene,
          elements: artDirection.elements,
          palette: artDirection.palette,
          mood: artDirection.mood,
          coverSummaries,
          hint: options.hint || null,
          composeBackend: backend.id,
          model: composed.model,
          prompt,
          inputs: attemptPaths.map(item => path.basename(item))
        }

        try {
          const sidecarPath = await writeSidecar(outputPath, runRecord)
          if (debug) console.log(`  Wrote run sidecar: ${sidecarPath}`)
          if (recordHistory) await appendHistory(runRecord)
        } catch (error) {
          console.warn(`  Could not record cover metadata: ${error.message}`)
        }

        return {
          ...saved,
          selectedImages: attemptPaths,
          imageUrl: composed.imageUrl,
          model: runRecord.model,
          backend: backend.id,
          creativeDirection: artDirection.creativeDirection,
          concept: artDirection.concept,
          medium: artDirection.medium,
          coverSummaries,
          mode: 'summaries_to_prompt',
          prompt
        }
      } catch (error) {
        if (isContentPolicyViolation(error)) {
          if (attempt < attemptSets.length - 1) {
            console.warn(`  Content policy violation on attempt ${attempt + 1} (${backend.label}); retrying with alternate album inputs`)
            continue
          }
          // Exhausted the attempt sets on this backend - hand off to the next one if we have it.
          if (!isLastBackend) break
        }

        let message = error.message
        if (error.body) message += `\nResponse body: ${JSON.stringify(error.body, null, 2)}`
        throw new Error(`Tunes cover generation failed using ${backend.label}: ${message}`)
      }
    }
  }

  throw new Error('Tunes cover generation failed after all attempts')
}

function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    width: 1400,
    height: 800,
    seed: null,
    date: null,
    hint: null,
    record: false,
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg === '--record') options.record = true
    else if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length)
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length)
    else if (arg.startsWith('--width=')) options.width = Number(arg.slice('--width='.length))
    else if (arg.startsWith('--height=')) options.height = Number(arg.slice('--height='.length))
    else if (arg.startsWith('--seed=')) options.seed = Number(arg.slice('--seed='.length))
    else if (arg.startsWith('--date=')) options.date = arg.slice('--date='.length)
    else if (arg.startsWith('--hint=')) options.hint = arg.slice('--hint='.length)
    else if (!arg.startsWith('--') && !options.input) options.input = arg
    else if (!arg.startsWith('--') && !options.output) options.output = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

async function findLatestAlbumsFolder() {
  const publicAssetsDir = path.join(PROJECT_ROOT, 'public', 'assets')
  const entries = await fs.readdir(publicAssetsDir, { withFileTypes: true })
  const latest = entries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('-listened-to-this-week'))
    .map(entry => entry.name)
    .sort()
    .reverse()[0]

  return latest ? path.join(publicAssetsDir, latest, 'albums') : null
}

async function readInputImages(inputFolder) {
  const files = await fs.readdir(inputFolder)
  return files
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
    .sort((a, b) => a.localeCompare(b))
    .map(file => path.join(inputFolder, file))
}

function showHelp() {
  console.log(`
Tunes Cover Generator

Creates one original AI cover for weekly tunes posts by reading the uploaded album
covers, summarising their non-text visual contents, and asking an AI art director to
choose the medium, scene, composition, and palette from that visual research alone.
The original album images remain attached to the final multi-reference image call.

Usage:
  node scripts/fal-tunes-cover.js --input=<albums-folder> --output=<cover.png> [options]
  node scripts/fal-tunes-cover.js <albums-folder> <cover.png> [options]

Options:
  --output=<path>     Output PNG path (also writes <name>-small.png and <name>.json)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Image backend seed (weekly runs use the post date)
  --date=<date>       Run date for sidecar/history; inferred from standard paths
  --hint=<string>     Optional author steer for the AI art director
  --record            Append this run to scripts/.tunes-image-history.json (the
                      weekly generator records automatically; manual runs opt in)
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Uses two separate OpenAI passes when OPENAI_API_KEY is available: factual image
    summaries first, then freeform art direction from those summaries alone.
  - Recent concepts from the history file are passed as do-not-repeat instructions.
  - The compose backend comes from settings.cover_backend in tunes-config.yaml. On a
    content-policy refusal the generator retries with alternate inputs, then drops
    to the fallback backend
    (env TUNES_COVER_FALLBACK_BACKEND, "none" to disable).
  - OPENAI_TUNES_COVER_SUMMARY_MODEL and OPENAI_TUNES_COVER_DIRECTION_MODEL can
    override the two prompt stages; OPENAI_TUNES_COVER_MODEL remains a shared fallback.
  - The composed image ships as-is; there is no second image-to-image pass.
`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }

  const defaultInputFolder = options.input || await findLatestAlbumsFolder()
  if (!defaultInputFolder) {
    throw new Error('No input folder supplied and no listened-to-this-week album folder found')
  }
  const inputFolder = path.resolve(defaultInputFolder)

  const outputPath = path.resolve(options.output || path.join(PROJECT_ROOT, 'test-output', 'tunes-cover.png'))
  const imagePaths = await readInputImages(inputFolder)
  if (imagePaths.length === 0) {
    throw new Error(`No album images found in ${inputFolder}`)
  }
  const dateLabel = options.date || extractTunesDate(inputFolder) || extractTunesDate(outputPath)

  console.log('Generating tunes cover scene')
  console.log(`  Input: ${inputFolder}`)
  console.log(`  Output: ${outputPath}`)

  await createFALTunesCover(imagePaths, outputPath, {
    width: options.width,
    height: options.height,
    seed: options.seed || (dateLabel ? new Date(dateLabel).getTime() : Date.now()),
    dateLabel,
    hint: options.hint,
    recordHistory: options.record,
    debug: options.debug
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  })
}

export {
  createFALTunesCover,
  detectTextScore,
  selectCoverInputs,
  smallOutputPathFor,
  saveGeneratedImage,
  parseJSONResponse,
  isContentPolicyViolation,
  humanizeImageName,
  NEGATIVE_TERMS,
  TEXT_NEGATIVE_TERMS,
  buildFreeformGenerationPrompt as buildGenerationPrompt
}
