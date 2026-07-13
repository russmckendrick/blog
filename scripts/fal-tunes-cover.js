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
import {
  MS_PER_WEEK,
  getLane,
  listLanes,
  pickLane,
  pickLightingDirection,
  pipelineStage
} from './lib/tunes-lanes.js'
import { appendHistory, recentConcepts, writeSidecar } from './lib/tunes-image-history.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_COVER_BACKEND = 'nano-banana'

// Resolve the cover compose backend: explicit option first, then the lane's compose stage,
// then the tunes-config.yaml switch (settings.cover_backend), then the default. Unknown ids
// warn and fall back, and single-image restyle backends are refused (composing needs the
// week's full set of covers as references).
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
// Precedence: explicit option -> env (TUNES_COVER_FALLBACK_BACKEND) -> the lane's compose
// stage -> tunes-config.yaml (settings.cover_fallback_backend) -> default (nano-banana, the
// more permissive backend, but only when it isn't already the primary). "none"/"off"/""
// disables the fallback. Returns the backend object, or null when there is no usable
// fallback distinct from the primary.
async function resolveCoverFallbackBackend(primaryBackend, explicit, laneFallback) {
  let requested = explicit ?? process.env.TUNES_COVER_FALLBACK_BACKEND ?? laneFallback
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

// Resolve the week's creative-direction lane. Precedence: explicit option (--lane / --style)
// -> env TUNES_COVER_LANE -> deterministic weekly rotation over settings.cover_lanes (or all
// lanes). "auto" means rotation and is collapsed at EACH tier - bulk-listen.js passes
// --lane=auto by default, and the env var must still work behind it. An unknown explicit
// lane is an error so a typo cannot silently change the look.
async function resolveLane(explicit, seed) {
  const isAuto = value => ['auto', 'rotate', 'rotation'].includes(String(value || '').trim().toLowerCase())
  let requested = isAuto(explicit) ? null : explicit
  if (!requested) requested = isAuto(process.env.TUNES_COVER_LANE) ? null : process.env.TUNES_COVER_LANE
  if (requested) {
    const lane = getLane(requested)
    if (!lane) {
      throw new Error(`Unknown lane "${requested}". Valid lanes: ${listLanes().map(item => item.id).join(', ')}`)
    }
    return lane
  }

  let laneIds = null
  try {
    const config = new ConfigLoader()
    await config.load()
    laneIds = config.getCoverLanes()
  } catch {
    laneIds = null
  }

  return pickLane(seed, { laneIds })
}

// Whether the lane's optional restyle stage runs. Precedence: explicit option (--no-restyle)
// -> tunes-config.yaml settings.cover_restyle -> on.
async function resolveRestyleEnabled(explicit) {
  if (explicit === false) return false
  try {
    const config = new ConfigLoader()
    await config.load()
    return config.getCoverRestyleEnabled()
  } catch {
    return true
  }
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

// Negative steers, split by concern so each lane bans the RIGHT media. Text and layout
// negatives always apply; photo lanes ban illustration looks; print lanes ban photo/3D looks
// instead (the old behaviour banned every non-photo medium globally, which is exactly why
// months of covers converged on one photoreal formula).
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
  'raw album-cover thumbnails'
]

const PANEL_COLLAGE_TERM = 'collage of separate panels'

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

const ANTI_PHOTO_TERMS = [
  'photorealistic photograph',
  'DSLR photo',
  '3D render',
  'CGI',
  'octane render',
  'glossy 3D rendering',
  'camera depth of field',
  'lens bokeh',
  'realistic skin texture'
]

// Back-compat export: the artist portrait flow builds on the photo-lane set.
const NEGATIVE_TERMS = [
  ...TEXT_NEGATIVE_TERMS,
  ...LAYOUT_NEGATIVE_TERMS,
  PANEL_COLLAGE_TERM,
  ...ANTI_ILLUSTRATION_TERMS
]

function negativeTermsForLane(lane) {
  const kindTerms = lane.kind === 'print' ? ANTI_PHOTO_TERMS : ANTI_ILLUSTRATION_TERMS
  return [
    ...TEXT_NEGATIVE_TERMS,
    ...LAYOUT_NEGATIVE_TERMS,
    ...(lane.collageMedium ? [] : [PANEL_COLLAGE_TERM]),
    ...kindTerms,
    ...(lane.negatives || []),
    ...(lane.antiCliche || [])
  ]
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

function firstSentence(text) {
  const trimmed = String(text || '').trim()
  const match = trimmed.match(/^[^.!?]+[.!?]?/)
  return (match ? match[0] : trimmed).trim()
}

function normalizeBrief(rawBrief, sourceReferences = []) {
  const scene = String(
    rawBrief?.scene ||
    'one cohesive, imaginative scene set in a single shared world that combines recognisable elements drawn from every uploaded album cover'
  ).trim()

  return {
    covers: normalizeCoverDescriptions(rawBrief?.covers),
    scene,
    // The one-line concept is what gets remembered and fed back as a do-not-repeat next
    // week, so it always exists even when the model omits it.
    concept: String(rawBrief?.concept || '').trim() || firstSentence(scene),
    elements: normalizeElements(rawBrief?.elements || rawBrief?.source_elements, sourceReferences),
    palette: Array.isArray(rawBrief?.palette)
      ? rawBrief.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    mood: String(rawBrief?.mood || 'imaginative and music-led').trim()
  }
}

function buildFallbackBrief(sourceReferences, lane) {
  return normalizeBrief({
    scene: `one cohesive, imaginative scene rendered as ${lane.medium}, combining recognisable elements drawn from every uploaded album cover, tied together by one setting, one light, and one consistent treatment`,
    concept: `${lane.label} weaving together the week's album motifs`,
    elements: sourceReferences.slice(0, 6).map(reference => ({
      source: reference.source,
      element: `a recognisable element from ${reference.album || reference.filename}`
    })),
    palette: [],
    mood: 'imaginative and music-led'
  }, sourceReferences)
}

async function createArtBrief({ imageUrls, sourceReferences, debug, lane, lightingDirection = '', avoidConcepts = [] }) {
  if (!openai) {
    if (debug) {
      console.log('  No OPENAI_API_KEY found; using deterministic art brief')
    }
    return buildFallbackBrief(sourceReferences, lane)
  }

  // Photo lanes keep the original "make it photographable" flip; print lanes design motifs
  // natively in the medium instead.
  const motifLine = lane.kind === 'photo'
    ? "Where a cover's motif is an illustration, painting, symbol, or graphic, reimagine it as a real, physical, photographable thing in the scene - a sculpture, prop, costume, set piece, projection, mural, printed poster, real person, animal, or object - so it stays recognisable while the whole frame still reads as a genuine photograph."
    : lane.motifTreatment

  const lightingLine = lane.lighting && lightingDirection
    ? `Set the scene in this specific lighting and time of day, and commit to it fully: ${lightingDirection}. Adapt it so it suits the scene, but do NOT default to a generic night-time setting unless this direction calls for it.`
    : ''

  const avoidBlock = avoidConcepts.length > 0
    ? `These concepts were used in recent weeks and must NOT be repeated - choose a different setting, a different central idea, and a different composition:\n${avoidConcepts.map(concept => `- ${concept}`).join('\n')}`
    : ''

  const instructions = `You are a visual art director creating one original header image for a music blog.
You will receive several album covers as images. Work in two steps and return only valid JSON.
Step 1 - read the artwork: look closely at EACH uploaded album cover and describe its concrete visual contents: the subjects, figures, creatures, objects, symbols, settings, art style, and dominant colours that are actually depicted. Ignore and never mention any text, lettering, titles, or logos printed on the covers.
Step 2 - invent the scene: design ONE original, unique scene that weaves recognisable elements from ALL of the covers into a single cohesive world they could all plausibly share. The final image will be ${lane.medium}. Design the scene natively in that medium and imagine every borrowed element the way that medium would render it. ${motifLine}
Compose it as: ${lane.composition}
${lightingLine}
${lane.collageMedium
    ? 'Everything must feel like one deliberate page - fragments composed together with intent, unified by the paper, print texture, and palette - never arranged as a grid, row, or panel of squares.'
    : 'Everything must feel connected by one environment, light, and story - not separate objects floating side by side, and never arranged as a grid, row, or panel of squares.'}
Never design: ${(lane.antiCliche || []).join('; ')}.
${avoidBlock}
Keep it safe for an image generator: never depict or reconstruct children, infants, babies, or minors (recast any youthful figure as an adult, a mannequin, a statue, or an abstract shape); avoid gore, wounds, body horror, surgical or medical imagery, foetal or anatomical motifs, blank or milky eyes, distress, nudity, sexual content, weapons, and real-world hate or brand symbols. When a cover features any of these, reinterpret the motif abstractly - as a sculpture, silhouette, pattern, prop, or play of light - so it stays evocative without recreating the sensitive subject. Do not aim to recreate the exact likeness of any identifiable real person; suggest the look instead.
Be imaginative and go bold; richly detailed and surprising scenes are welcome as long as everything reads as one connected piece in this medium. Colour: ${lane.paletteTreatment}.
Return JSON exactly as: {"covers":[{"source":1,"description":"string"}],"scene":"string","concept":"string","elements":[{"source":1,"element":"string"}],"palette":["string"],"mood":"string"}.
"scene" is a vivid paragraph describing the unified scene in this medium and how the borrowed elements appear inside it. "concept" is one line of at most 15 words naming the setting and the central idea. "elements" names the single most recognisable thing taken from each cover that must appear in the scene. "palette" lists the exact colours the image should use, pulled from the artwork and chosen to suit this treatment - respect any ink-count limit it sets: ${lane.paletteTreatment}. "mood" is the emotional tone.`

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
              text: `Return JSON only. First describe each of the ${imageUrls.length} uploaded album covers, then design one cohesive original scene, rendered as ${lane.medium}, that uses recognisable elements from all of them.`
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
    return buildFallbackBrief(sourceReferences, lane)
  }
}

function formatElement(element) {
  return `source ${element.source}: ${element.element}`
}

function formatElements(brief, sourceReferences) {
  return brief.elements.length > 0
    ? brief.elements.map(formatElement).join('; ')
    : sourceReferences.map(reference => `source ${reference.source}: recognisable element from ${reference.album || reference.filename}`).join('; ')
}

// Style-first prompt (Style -> Subject -> Setting -> Composition -> Colour), because the
// image models otherwise drift back to their default vivid cinematic photoreal look when
// the medium arrives late or hedged.
function buildGenerationPrompt(brief, sourceImageCount, sourceReferences, lane, lightingDirection = '') {
  const elements = formatElements(brief, sourceReferences)
  const palette = brief.palette.length > 0 ? brief.palette.join(', ') : 'a palette pulled from the uploaded artwork'
  const avoid = negativeTermsForLane(lane).join(', ')

  const qualityLine = lane.kind === 'photo'
    ? 'Sharp, high quality, visually striking, with real depth and a strong sense of place.'
    : 'Bold, confident, gallery-quality print design with a strong sense of place.'

  // Collage lanes are, by definition, pasted fragments - demanding "one shared setting and
  // consistent light" there would argue with the medium, so they get a page-unity line instead.
  const cohesionLine = lane.collageMedium
    ? 'Transform the subjects, figures, creatures, objects, and symbols depicted in the uploaded covers so they stay recognisable, and compose them all onto one deliberate page unified by the paper texture, print treatment, and palette.'
    : 'Transform the subjects, figures, creatures, objects, and symbols depicted in the uploaded covers so they stay recognisable, and place them all inside one cohesive world with a single shared setting and consistent light.'

  return [
    lane.styleDirective,
    'The image is a 16:9 music blog header.',
    `Scene: ${String(brief.scene).trim().replace(/\.+$/, '')}.`,
    `Weave in recognisable elements taken from the ${sourceImageCount} uploaded album covers: ${elements}.`,
    cohesionLine,
    lane.motifTreatment,
    `Composition: ${lane.composition}`,
    `Colour direction: ${palette} - ${lane.paletteTreatment}.`,
    lane.lighting && lightingDirection ? `Time of day and light: ${lightingDirection}.` : '',
    `Mood: ${brief.mood}.`,
    'Keep the scene safe and tasteful: feature only adults (no children, infants, or minors), and show no gore, wounds, body horror, medical or anatomical imagery, blank or milky eyes, nudity, or sexual content. Reinterpret any such source motif abstractly, and suggest rather than exactly replicate the likeness of any identifiable real person.',
    'Do not include any text, letters, words, numbers, captions, titles, logos, watermarks, or signage anywhere in the image.',
    `Avoid: ${avoid}.`,
    qualityLine
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

// The restyle prompt re-lists every motif so the second pass reinforces the lane's medium
// without sanding the recognisable album elements away.
function buildRestylePrompt(brief, sourceReferences, lane) {
  const elements = formatElements(brief, sourceReferences)

  return [
    `Restyle this image as ${lane.medium}.`,
    lane.styleDirective,
    `Keep the existing composition, and keep every one of these motifs clearly recognisable: ${elements}.`,
    'Keep the image safe and tasteful: no children or minors, no gore, nudity, or sexual content.',
    'Do not add any text, letters, words, numbers, captions, logos, watermarks, or signage.'
  ].join(' ').replace(/\s+/g, ' ').trim()
}

// Recraft's image-to-image input must be under 5 MB (and within 4096px); the compose stage
// emits detailed 2K/1440p PNGs that routinely blow past that, silently costing print lanes
// their restyle. Re-encode the composed image to a bounded JPEG and upload it as the restyle
// source; on any failure fall back to the original URL and let the backend try anyway.
async function prepareRestyleInputUrl(composeImageUrl, debug) {
  try {
    const response = await fetch(composeImageUrl)
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const jpeg = await sharp(buffer)
      .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()
    const file = new File([jpeg], 'restyle-input.jpg', { type: 'image/jpeg' })
    return await fal.storage.upload(file)
  } catch (error) {
    if (debug) {
      console.log(`  Could not re-encode the restyle input (${error.message}); using the original URL`)
    }
    return composeImageUrl
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

// Run the lane's optional restyle stage over the composed image. Strictly additive: the
// compose output is already prompted in the lane's style, so any failure here logs a
// warning and ships the compose result rather than failing the post.
async function applyRestyleStage({ lane, brief, sourceReferences, composeImageUrl, seed, debug }) {
  const restyleStage = pipelineStage(lane, 'restyle')
  if (!restyleStage) return null

  const backend = getBackend(restyleStage.backend)
  if (!backend) {
    console.warn(`  Unknown restyle backend "${restyleStage.backend}"; keeping the composed image`)
    return null
  }

  const prompt = buildRestylePrompt(brief, sourceReferences, lane)
  if (debug) {
    console.log(`  Restyle (${backend.label}): ${prompt}`)
  }

  try {
    const inputUrl = await prepareRestyleInputUrl(composeImageUrl, debug)
    const { imageUrl, model } = await backend.generate({
      imageUrls: [inputUrl],
      prompt,
      seed,
      debug,
      negativePrompt: TEXT_NEGATIVE_TERMS.join(', '),
      ...(restyleStage.params || {})
    })
    return { imageUrl, model, backend: backend.id, prompt }
  } catch (error) {
    console.warn(`  Restyle stage failed (${backend.label}); keeping the composed image: ${error.message}`)
    return null
  }
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

  const lane = await resolveLane(options.lane || options.style, seed)
  const lightingDirection = lane.lighting ? pickLightingDirection(seed) : ''
  const restyleEnabled = await resolveRestyleEnabled(options.restyle)
  const historySize = await resolveHistorySize()
  const avoidConcepts = await recentConcepts('cover', historySize)

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

  const composeStage = pipelineStage(lane, 'compose')
  const primaryBackend = await resolveCoverBackend(options.backend || composeStage?.backend)
  const fallbackBackend = await resolveCoverFallbackBackend(primaryBackend, options.fallbackBackend, composeStage?.fallback)
  const backendChain = fallbackBackend ? [primaryBackend, fallbackBackend] : [primaryBackend]

  console.log(`  Creative direction: ${lane.label} (${lane.id})`)
  if (debug) {
    console.log(`  Image backend: ${backendChain.map(b => b.label).join(' -> ')}`)
    if (lightingDirection) console.log(`  Lighting direction: ${lightingDirection}`)
    if (avoidConcepts.length > 0) console.log(`  Avoiding recent concepts: ${avoidConcepts.join(' | ')}`)
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
          console.log(`  Attempt ${attempt + 1} (${backend.label}): generating ${lane.id} cover from ${attemptPaths.length} album covers`)
        }

        const imageUrls = await uploadAlbumImages(attemptPaths, debug)
        const sourceReferences = buildSourceReferences(attemptPaths)
        const brief = await createArtBrief({ imageUrls, sourceReferences, debug, lane, lightingDirection, avoidConcepts })
        const prompt = buildGenerationPrompt(brief, imageUrls.length, sourceReferences, lane, lightingDirection)

        if (debug) {
          console.log(`  Prompt: ${prompt}`)
        }

        const composed = await backend.generate({ imageUrls, prompt, seed, debug })

        let restyled = restyleEnabled
          ? await applyRestyleStage({
              lane,
              brief,
              sourceReferences,
              composeImageUrl: composed.imageUrl,
              seed,
              debug
            })
          : null

        // The restyle stage is strictly additive, and that includes the download: if the
        // restyled URL fails to fetch, fall back to saving the composed image rather than
        // failing the whole post.
        let saved
        try {
          saved = await saveGeneratedImage(restyled?.imageUrl || composed.imageUrl, outputPath, width, height, debug)
        } catch (error) {
          if (!restyled) throw error
          console.warn(`  Could not download the restyled image (${error.message}); saving the composed image instead`)
          restyled = null
          saved = await saveGeneratedImage(composed.imageUrl, outputPath, width, height, debug)
        }
        const finalImageUrl = restyled?.imageUrl || composed.imageUrl
        console.log(`  Created tunes cover (${lane.label}, ${backend.label}${restyled ? ` + ${restyled.backend}` : ''}) from ${attemptPaths.length} album covers`)
        console.log(`    Full:  ${saved.outputPath}`)
        console.log(`    Small: ${saved.smallOutputPath}`)

        const runRecord = {
          date: options.dateLabel || (Number.isFinite(seed) && seed >= MS_PER_WEEK ? new Date(seed).toISOString().slice(0, 10) : ''),
          type: 'cover',
          lane: lane.id,
          lighting: lightingDirection || null,
          shootDirection: null,
          colourTreatment: null,
          concept: brief.concept,
          scene: brief.scene,
          palette: brief.palette,
          composeBackend: backend.id,
          restyleBackend: restyled?.backend || null,
          restyled: Boolean(restyled),
          model: restyled?.model || composed.model,
          prompt,
          restylePrompt: restyled?.prompt || null,
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
          imageUrl: finalImageUrl,
          model: runRecord.model,
          backend: backend.id,
          lane: lane.id,
          lighting: lightingDirection || null,
          concept: brief.concept,
          restyled: Boolean(restyled),
          restyleBackend: restyled?.backend || null,
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
    lane: null,
    restyle: true,
    record: false,
    listLanes: false,
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') options.help = true
    else if (arg === '--debug' || arg === '-d') options.debug = true
    else if (arg === '--list-lanes') options.listLanes = true
    else if (arg === '--no-restyle') options.restyle = false
    else if (arg === '--record') options.record = true
    else if (arg.startsWith('--input=')) options.input = arg.slice('--input='.length)
    else if (arg.startsWith('--output=')) options.output = arg.slice('--output='.length)
    else if (arg.startsWith('--width=')) options.width = Number(arg.slice('--width='.length))
    else if (arg.startsWith('--height=')) options.height = Number(arg.slice('--height='.length))
    else if (arg.startsWith('--seed=')) options.seed = Number(arg.slice('--seed='.length))
    else if (arg.startsWith('--lane=')) options.lane = arg.slice('--lane='.length)
    // --style is the historical alias for --lane.
    else if (arg.startsWith('--style=')) options.lane = arg.slice('--style='.length)
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

function printLanes() {
  console.log('\nAvailable lanes:\n')
  for (const lane of listLanes()) {
    const restyleStage = pipelineStage(lane, 'restyle')
    const composeStage = pipelineStage(lane, 'compose')
    const compose = composeStage?.backend || 'config default'
    const pipeline = restyleStage ? `${compose} -> ${restyleStage.backend}` : compose
    console.log(`  ${lane.id.padEnd(24)} ${lane.kind.padEnd(6)} ${pipeline.padEnd(28)} ${lane.label}`)
  }
  console.log()
}

function showHelp() {
  console.log(`
Tunes Cover Generator

Creates one original AI cover for weekly tunes posts by reading the uploaded album
covers and weaving recognisable elements from them into a single artwork. Each week
rotates through a different creative-direction lane (photo and print media), so the
covers stop converging on one look.

Usage:
  node scripts/fal-tunes-cover.js --input=<albums-folder> --output=<cover.png> [options]
  node scripts/fal-tunes-cover.js <albums-folder> <cover.png> [options]

Options:
  --output=<path>     Output PNG path (also writes <name>-small.png and <name>.json)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Deterministic seed (weekly runs use the post date)
  --lane=<id>         Force a creative-direction lane (--style is an alias);
                      env TUNES_COVER_LANE also works. Default: weekly rotation.
  --list-lanes        Print the available lanes and exit
  --no-restyle        Skip the lane's optional restyle stage (compose only)
  --record            Append this run to scripts/.tunes-image-history.json (the
                      weekly generator records automatically; manual runs opt in)
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Uses OPENAI_API_KEY when available to describe each album cover and design one
    cohesive scene in the week's lane; recent concepts from the history file are
    passed as do-not-repeat instructions.
  - The compose backend comes from the lane, falling back to settings.cover_backend
    in tunes-config.yaml. On a content-policy refusal the generator retries with
    alternate inputs, then drops to the fallback backend
    (env TUNES_COVER_FALLBACK_BACKEND, "none" to disable).
  - Print lanes may run a second restyle stage (Recraft / Ideogram via fal) to lock
    in the medium; disable with --no-restyle or settings.cover_restyle: off.
`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }
  if (options.listLanes) {
    printLanes()
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
    lane: options.lane,
    restyle: options.restyle,
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
  negativeTermsForLane
}
