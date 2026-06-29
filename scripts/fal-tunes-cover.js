import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import { COVER_BLOCKLIST } from './tunes-cover-blocklist.js'
import { isContentPolicyViolation } from './lib/fal-content-policy.js'
import { ConfigLoader } from './lib/config-loader.js'
import { getBackend, BACKENDS } from './lib/image-backends/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_COVER_BACKEND = 'nano-banana'

// Resolve the cover image backend: explicit option first, then the tunes-config.yaml switch
// (settings.cover_backend), then the default. Unknown ids warn and fall back. The backends in
// lib/image-backends/ are generic and shared with the artist portrait flow.
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
  if (backend) return backend

  console.warn(`  Unknown image backend "${requested}"; falling back to ${DEFAULT_COVER_BACKEND}`)
  return BACKENDS[DEFAULT_COVER_BACKEND]
}

// Resolve the backend to switch to when the primary refuses on a content-policy violation.
// Precedence: explicit option -> env (TUNES_COVER_FALLBACK_BACKEND) -> tunes-config.yaml
// (settings.cover_fallback_backend) -> default (nano-banana, the more permissive backend, but
// only when it isn't already the primary). "none"/"off"/"" disables the fallback. Returns the
// backend object, or null when there is no usable fallback distinct from the primary.
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

  return backend.id === primaryBackend.id ? null : backend
}

// We steer away from text, grid/montage layouts, and non-photographic styles. The
// goal is one photorealistic scene, so illustration/painting looks are excluded too.
const NEGATIVE_TERMS = [
  'readable text',
  'letters',
  'words',
  'numbers',
  'captions',
  'titles',
  'logos',
  'watermarks',
  'signage',
  'grid layout',
  'contact sheet',
  'evenly tiled squares',
  'raw album-cover thumbnails',
  'collage of separate panels',
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

// Left to itself the art director almost always sets the unified scene at night - the source
// sleeves skew dark and "cinematic/atmospheric" reads as nighttime to the model. We hand it a
// deterministic time-of-day / lighting direction per week (mostly daylight, one night for
// variety) so the headers stop converging on the same after-dark look. Mirrors the artist
// portrait's SHOOT_DIRECTIONS approach.
const LIGHTING_DIRECTIONS = [
  'bright midday sunlight under a clear blue sky, crisp hard shadows and vivid daylight colour',
  'warm golden-hour light just before sunset, long shadows and a glowing amber sidelight',
  'soft bright overcast daylight, gentle even shadows and rich, true-to-life colour',
  'fresh early-morning light with a low sun, clean cool highlights and long soft shadows',
  'bright interior daylight pouring through large windows, airy and naturally lit',
  'a vivid sunny afternoon with strong directional sun, saturated colour and sparkling highlights',
  'deep blue-hour twilight just after sunset, a saturated blue sky with warm artificial lights starting to glow',
  'dramatic stormlight with sun breaking through, bright shafts of light against dark cloud',
  'a luminous neon-lit night with wet reflective surfaces and bold, saturated artificial colour'
]

const MS_PER_WEEK = 604800000

// Weekly post dates are exactly one MS_PER_WEEK apart, so bucketing the seed (the post date as
// epoch-ms) by weeks-since-epoch advances the index by one each week and cycles through the
// whole list. Small non-timestamp seeds (e.g. a CLI --seed for testing) fall back to a direct
// modulo so they still vary. Matches pickShootDirection in fal-tunes-artists.js.
function pickLightingDirection(seed) {
  const value = Math.abs(Math.trunc(Number.isFinite(seed) ? seed : 0))
  const bucket = value >= MS_PER_WEEK ? Math.floor(value / MS_PER_WEEK) : value
  return LIGHTING_DIRECTIONS[bucket % LIGHTING_DIRECTIONS.length]
}

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

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

    const regions = [
      { left: 0, top: 0, width, height: bandHeight },
      { left: 0, top: Math.max(0, height - bandHeight), width, height: bandHeight }
    ]

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
  const imageScore = rankScore + (saturation * 0.3) + (contrast * 0.08) - (textScore * 0.2)

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
  const selected = analyses.slice(0, Math.min(primaryCount, maxCount, analyses.length))
  const remaining = analyses.slice(selected.length)

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

async function uploadAlbumImages(imagePaths, debug = false) {
  const urls = []

  for (const imagePath of imagePaths) {
    const buffer = await sharp(imagePath)
      .resize(900, 900, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 92 })
      .toBuffer()

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
  return imagePaths.map((imagePath, index) => ({
    source: index + 1,
    filename: path.basename(imagePath),
    album: humanizeImageName(imagePath)
  }))
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

function normalizeCoverDescriptions(rawCovers = []) {
  const covers = Array.isArray(rawCovers) ? rawCovers : []
  return covers
    .map((item, index) => {
      const source = Number(item?.source || item?.source_index || item?.image || index + 1)
      const description = String(item?.description || item?.summary || item?.contents || '').trim()
      if (!description) return null
      return {
        source: Number.isFinite(source) && source > 0 ? source : index + 1,
        description
      }
    })
    .filter(Boolean)
    .slice(0, 8)
}

function normalizeElements(rawElements = [], sourceReferences = []) {
  const elements = Array.isArray(rawElements) ? rawElements : []
  const normalized = elements
    .map((item, index) => {
      const source = Number(item?.source || item?.source_index || item?.image || index + 1)
      const element = String(item?.element || item?.use || item?.description || '').trim()
      if (!element) return null
      return {
        source: Number.isFinite(source) && source > 0 ? source : index + 1,
        element
      }
    })
    .filter(Boolean)
    .slice(0, 8)

  if (normalized.length > 0) return normalized

  return sourceReferences.slice(0, 6).map(reference => ({
    source: reference.source,
    element: `a recognisable element from ${reference.album || reference.filename}`
  }))
}

function normalizeBrief(rawBrief, sourceReferences = []) {
  return {
    covers: normalizeCoverDescriptions(rawBrief?.covers),
    scene: String(
      rawBrief?.scene ||
      rawBrief?.concept ||
      'one cohesive, imaginative scene set in a single shared world that combines recognisable elements drawn from every uploaded album cover'
    ).trim(),
    elements: normalizeElements(rawBrief?.elements || rawBrief?.source_elements, sourceReferences),
    palette: Array.isArray(rawBrief?.palette)
      ? rawBrief.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    mood: String(rawBrief?.mood || 'imaginative, vivid, and music-led, with bright saturated colour').trim()
  }
}

function buildFallbackBrief(sourceReferences) {
  return normalizeBrief({
    scene: 'one cohesive, imaginative scene set in a single shared world that combines recognisable elements drawn from every uploaded album cover, tied together by consistent light, atmosphere, and one art style',
    elements: sourceReferences.slice(0, 6).map(reference => ({
      source: reference.source,
      element: `a recognisable element from ${reference.album || reference.filename}`
    })),
    palette: [],
    mood: 'imaginative, vivid, and music-led, with bright saturated colour'
  }, sourceReferences)
}

async function createArtBrief({ imageUrls, sourceReferences, debug, lightingDirection = '' }) {
  if (!openai) {
    if (debug) {
      console.log('  No OPENAI_API_KEY found; using deterministic art brief')
    }
    return buildFallbackBrief(sourceReferences)
  }

  const lightingLine = lightingDirection
    ? `Set the scene in this specific lighting and time of day, and commit to it fully: ${lightingDirection}. Adapt it so it suits the scene, but do NOT default to a generic night-time setting unless this direction calls for it.`
    : 'Vary the time of day and lighting; do not default to a generic night-time setting.'

  const instructions = `You are a visual art director creating one original illustrated header image for a music blog.
You will receive several album covers as images. Work in two steps and return only valid JSON.
Step 1 - read the artwork: look closely at EACH uploaded album cover and describe its concrete visual contents: the subjects, figures, creatures, objects, symbols, settings, art style, and dominant colours that are actually depicted. Ignore and never mention any text, lettering, titles, or logos printed on the covers.
Step 2 - invent the scene: design ONE original, unique scene that weaves recognisable elements from ALL of the covers into a single cohesive world they could all plausibly share. The final image will be a PHOTOREALISTIC photograph, so imagine it as a real photographed scene: choose a believable physical setting, real-world lighting, and a clear camera viewpoint. Where a cover's motif is an illustration, painting, symbol, or graphic, reimagine it as a real, physical, photographable thing in the scene - a sculpture, prop, costume, set piece, projection, mural, printed poster, real person, animal, or object - so it stays recognisable while the whole frame still reads as a genuine photograph.
${lightingLine}
Everything must feel connected by one environment, light, and story - not separate objects floating side by side, and never arranged as a grid, row, or panel of squares.
Keep it safe for an image generator: never depict or reconstruct children, infants, babies, or minors (recast any youthful figure as an adult, a mannequin, a statue, or an abstract shape); avoid gore, wounds, body horror, surgical or medical imagery, foetal or anatomical motifs, blank or milky eyes, distress, nudity, sexual content, weapons, and real-world hate or brand symbols. When a cover features any of these, reinterpret the motif abstractly - as a sculpture, silhouette, pattern, prop, or play of light - so it stays evocative without recreating the sensitive subject. Do not aim to recreate the exact likeness of any identifiable real person; suggest the look instead.
Be imaginative and go bold; richly detailed and surprising scenes are welcome as long as everything reads as one connected, believable photograph. Lean into bold, bright lighting and rich, vivid, saturated colour - a luminous, high-energy frame rather than a muted, dim, or washed-out one - while still reading as a real photograph. Do not describe the scene as an illustration, painting, drawing, cartoon, or mural - describe it as a real photograph.
Return JSON exactly as: {"covers":[{"source":1,"description":"string"}],"scene":"string","elements":[{"source":1,"element":"string"}],"palette":["string"],"mood":"string"}.
"scene" is a vivid paragraph describing the unified photographic scene and how the borrowed elements appear as real things inside it. "elements" names the single most recognisable thing taken from each cover that must appear in the scene. "palette" is 3-5 colours pulled from the artwork, then pushed brighter and more saturated - favour vivid, luminous, high-energy colour over muted or washed-out tones.`

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_TUNES_COVER_MODEL || process.env.OPENAI_MODEL || 'gpt-5.4',
      instructions,
      input: [
        {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Return JSON only. First describe each of the ${imageUrls.length} uploaded album covers, then design one cohesive original scene that uses recognisable elements from all of them.`
            },
            ...imageUrls.map(url => ({
              type: 'input_image',
              image_url: url,
              detail: 'auto'
            }))
          ]
        }
      ],
      text: { format: { type: 'json_object' } },
      max_output_tokens: 1300,
      temperature: 0.8
    })

    const brief = normalizeBrief(parseJSONResponse(response.output_text || ''), sourceReferences)

    if (debug) {
      console.log(`  Art brief: ${JSON.stringify(brief, null, 2)}`)
    }

    return brief
  } catch (error) {
    console.warn(`  OpenAI art brief failed: ${error.message}`)
    return buildFallbackBrief(sourceReferences)
  }
}

function formatElement(element) {
  return `source ${element.source}: ${element.element}`
}

function buildGenerationPrompt(brief, sourceImageCount, sourceReferences, lightingDirection = '') {
  const elements = brief.elements.length > 0
    ? brief.elements.map(formatElement).join('; ')
    : sourceReferences.map(reference => `source ${reference.source}: recognisable element from ${reference.album || reference.filename}`).join('; ')
  const palette = brief.palette.length > 0 ? brief.palette.join(', ') : 'a palette pulled from the uploaded artwork'
  const avoid = NEGATIVE_TERMS.join(', ')

  return [
    'Create one original, richly detailed 16:9 photograph to use as a music blog header - a single, believable, photorealistic scene.',
    `Compose a single unified scene: ${brief.scene}.`,
    `Weave in recognisable elements taken from the ${sourceImageCount} uploaded album covers: ${elements}.`,
    'Transform the subjects, figures, creatures, objects, and symbols depicted in the uploaded covers so they stay recognisable, and place them all inside one cohesive world with a single shared setting and consistent light.',
    'Render everything photorealistically: real materials and textures, bright, natural cinematic lighting, true-to-life depth of field, captured as if shot on a professional full-frame camera. Where a source motif was originally a drawing, painting, symbol, or graphic, reimagine it as a real physical object, sculpture, set piece, projection, mural, costume, person, or animal within the photograph so it stays recognisable. This is a real photograph, not an illustration, drawing, painting, cartoon, or comic.',
    'Everything must feel like it genuinely belongs in the same scene - connected by environment and story, not separate cut-outs floating side by side, and never laid out as a grid, row, or panel of squares.',
    `Colour direction: ${palette} - rendered bright, vivid, and richly saturated with luminous highlights and punchy contrast, never muted, dull, or washed out.`,
    lightingDirection ? `Time of day and light: ${lightingDirection}.` : '',
    `Mood: ${brief.mood}.`,
    'Keep the scene safe and tasteful: feature only adults (no children, infants, or minors), and show no gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, or sexual content. Reinterpret any such source motif abstractly as a sculpture, prop, silhouette, or play of light, and suggest rather than exactly replicate the likeness of any identifiable real person.',
    'Do not include any text, letters, words, numbers, captions, titles, logos, watermarks, or signage anywhere in the image.',
    `Avoid: ${avoid}.`,
    'Photorealistic, sharp, cinematic, high quality, visually striking, vibrant and colour-rich, with real depth and a strong sense of place.'
  ].join(' ').replace(/\s+/g, ' ').trim()
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
    debug = process.env.DEBUG_COLLAGE === '1'
  } = options

  if ((options.lane || options.style) && debug) {
    console.log(`  Note: lane/style options are deprecated and ignored ("${options.lane || options.style}")`)
  }

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for tunes cover generation')
  }
  fal.config({ credentials: falKey })

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

  const lightingDirection = pickLightingDirection(seed)

  const primaryBackend = await resolveCoverBackend(options.backend)
  const fallbackBackend = await resolveCoverFallbackBackend(primaryBackend, options.fallbackBackend)
  const backendChain = fallbackBackend ? [primaryBackend, fallbackBackend] : [primaryBackend]
  if (debug) {
    console.log(`  Image backend: ${backendChain.map(b => b.label).join(' -> ')}`)
    console.log(`  Lighting direction: ${lightingDirection}`)
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
          console.log(`  Attempt ${attempt + 1} (${backend.label}): generating cover scene from ${attemptPaths.length} album covers`)
        }

        const imageUrls = await uploadAlbumImages(attemptPaths, debug)
        const sourceReferences = buildSourceReferences(attemptPaths)
        const brief = await createArtBrief({ imageUrls, sourceReferences, debug, lightingDirection })
        const prompt = buildGenerationPrompt(brief, imageUrls.length, sourceReferences, lightingDirection)

        if (debug) {
          console.log(`  Prompt: ${prompt}`)
        }

        const { imageUrl, model } = await backend.generate({ imageUrls, prompt, seed, debug })

        const saved = await saveGeneratedImage(imageUrl, outputPath, width, height, debug)
        console.log(`  Created tunes cover scene (${backend.label}) from ${attemptPaths.length} album covers`)
        console.log(`    Full:  ${saved.outputPath}`)
        console.log(`    Small: ${saved.smallOutputPath}`)

        return {
          ...saved,
          selectedImages: attemptPaths,
          imageUrl,
          model,
          backend: backend.id,
          mode: 'source_scene',
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
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length)
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length)
    else if (arg.startsWith('--width=')) options.width = Number(arg.slice('--width='.length))
    else if (arg.startsWith('--height=')) options.height = Number(arg.slice('--height='.length))
    else if (arg.startsWith('--seed=')) options.seed = Number(arg.slice('--seed='.length))
    // --lane / --style are deprecated and accepted only so older commands do not error.
    else if (arg.startsWith('--lane=') || arg.startsWith('--style=')) continue
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

Creates one original, cohesive AI scene for weekly tunes posts by reading the
uploaded album covers and weaving recognisable elements from them into a single
unified artwork.

Usage:
  node scripts/fal-tunes-cover.js --input=<albums-folder> --output=<cover.png> [options]
  node scripts/fal-tunes-cover.js <albums-folder> <cover.png> [options]

Options:
  --output=<path>     Output PNG path (also writes <name>-small.png)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Deterministic seed
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Uses OPENAI_API_KEY when available to describe each album cover and design one
    cohesive scene from their contents. The only negatives applied are text and grids.
  - The image backend comes from settings.cover_backend in tunes-config.yaml. On a
    content-policy refusal the generator retries with alternate inputs, then drops to
    settings.cover_fallback_backend (env TUNES_COVER_FALLBACK_BACKEND; defaults to
    nano-banana while gpt-image-2 is primary, "none" to disable).
  - --lane / --style are deprecated and ignored (kept only so older commands still run).
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

  console.log('Generating tunes cover scene')
  console.log(`  Input: ${inputFolder}`)
  console.log(`  Output: ${outputPath}`)

  await createFALTunesCover(imagePaths, outputPath, {
    width: options.width,
    height: options.height,
    seed: options.seed || Date.now(),
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
  NEGATIVE_TERMS
}
