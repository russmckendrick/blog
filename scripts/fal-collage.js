import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { fal } from '@fal-ai/client'
import dotenv from 'dotenv'
import OpenAI from 'openai'

// Load environment variables
dotenv.config()

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load configuration
let config
try {
  const configPath = path.join(__dirname, 'fal-collage-config.json')
  const configFile = await fs.readFile(configPath, 'utf-8')
  config = JSON.parse(configFile)
} catch (error) {
  console.error('Failed to load fal-collage-config.json:', error.message)
  process.exit(1)
}

/**
 * Check if an album/artist is blacklisted
 */
function isBlacklisted(albumName, artistName = '') {
  const blacklistConfig = config.blacklist || { albums: [], artists: [] }
  const albums = blacklistConfig.albums || []
  const artists = blacklistConfig.artists || []

  const albumLower = albumName.toLowerCase()
  const artistLower = artistName.toLowerCase()

  // Check if album name contains any blacklisted album (case-insensitive, partial match)
  for (const blacklistedAlbum of albums) {
    if (albumLower.includes(blacklistedAlbum.toLowerCase())) {
      return true
    }
  }

  // Check if artist name contains any blacklisted artist
  for (const blacklistedArtist of artists) {
    if (artistLower.includes(blacklistedArtist.toLowerCase())) {
      return true
    }
  }

  return false
}

function stripCodeFence(text) {
  const trimmed = (text || '').trim()
  if (trimmed.startsWith('```')) {
    return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }
  return trimmed
}

function extractFirstJSONObject(text) {
  const source = text || ''
  let start = -1
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      if (depth === 0) {
        start = i
      }
      depth++
      continue
    }

    if (char === '}') {
      if (depth > 0) {
        depth--
        if (depth === 0 && start !== -1) {
          return source.slice(start, i + 1)
        }
      }
    }
  }

  return null
}

function parseBlueprintResponse(content) {
  const cleaned = stripCodeFence(content)

  try {
    return JSON.parse(cleaned)
  } catch {
    const firstObject = extractFirstJSONObject(cleaned)
    if (!firstObject) {
      throw new Error('No valid JSON object found in model output')
    }
    return JSON.parse(firstObject)
  }
}

const DARK_OR_MONO_KEYWORDS = [
  'black', 'white', 'grey', 'gray', 'monochrome', 'desaturated',
  'charcoal', 'neutral', 'dark', 'shadow', 'noir', 'grayscale'
]

const TEXTUAL_ELEMENT_KEYWORDS = [
  'text', 'typography', 'letters', 'words', 'tracklist', 'title', 'logo'
]

const HUMAN_KEYWORDS = [
  'person', 'people', 'human', 'man', 'woman', 'boy', 'girl', 'face',
  'portrait', 'singer', 'musician', 'artist', 'figure'
]

function hasKeyword(text, keywords) {
  const normalized = String(text || '').toLowerCase()
  return keywords.some(keyword => normalized.includes(keyword))
}

function sanitizeVisualDescriptor(value, fallback) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    return fallback
  }
  if (hasKeyword(normalized, TEXTUAL_ELEMENT_KEYWORDS)) {
    return fallback
  }
  return normalized
}

function uniqueNonEmptyStrings(values, maxCount = 14) {
  const seen = new Set()
  const out = []

  for (const value of values || []) {
    const normalized = String(value || '').trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
    if (out.length >= maxCount) break
  }

  return out
}

function sampleEvenly(values, maxCount) {
  if (!Array.isArray(values) || values.length <= maxCount) {
    return values || []
  }
  const sampled = []
  const lastIndex = values.length - 1
  for (let i = 0; i < maxCount; i++) {
    const idx = Math.round((i * lastIndex) / (maxCount - 1))
    sampled.push(values[idx])
  }
  return uniqueNonEmptyStrings(sampled, maxCount)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractTimedOutUrl(error) {
  const message = String(error?.message || '')
  const match = message.match(/Timeout while downloading\s+(https?:\/\/\S+)/i)
  if (!match || !match[1]) {
    return null
  }
  return match[1].replace(/[.)]+$/, '')
}

function inferPeoplePresent(subjects) {
  return (subjects || []).some(subject => hasKeyword(subject, HUMAN_KEYWORDS))
}

function sanitizePalette(dominant, accent) {
  let safeDominant = String(dominant || '').trim()
  let safeAccent = String(accent || '').trim()

  if (!safeDominant) {
    safeDominant = 'luminous cobalt and cyan'
  }
  if (!safeAccent) {
    safeAccent = 'hot magenta with warm amber highlights'
  }

  if (hasKeyword(safeDominant, DARK_OR_MONO_KEYWORDS)) {
    safeDominant = 'luminous cobalt and cyan'
  }
  if (hasKeyword(safeAccent, DARK_OR_MONO_KEYWORDS)) {
    safeAccent = 'hot magenta with warm amber highlights'
  }

  if (safeAccent.toLowerCase() === safeDominant.toLowerCase()) {
    safeAccent = 'hot magenta with warm amber highlights'
  }

  return { dominant: safeDominant, accent: safeAccent }
}

function normalizeBlueprint(rawBlueprint) {
  const maxSecondaryElements = config.prompts?.maxSecondaryElements || 8
  const secondaryElements = Array.isArray(rawBlueprint?.secondary_elements)
    ? rawBlueprint.secondary_elements
      .map(item => sanitizeVisualDescriptor(item, 'layered abstract shapes'))
      .filter(Boolean)
      .slice(0, maxSecondaryElements)
    : []

  const palette = sanitizePalette(rawBlueprint?.palette?.dominant, rawBlueprint?.palette?.accent)
  const mood = sanitizeVisualDescriptor(rawBlueprint?.mood, 'dramatic and energetic')
  const scene = sanitizeVisualDescriptor(
    rawBlueprint?.scene,
    'a candid on-location music setting inspired by the uploaded imagery'
  )
  const allowedSubjects = uniqueNonEmptyStrings(
    (Array.isArray(rawBlueprint?.allowed_subjects) ? rawBlueprint.allowed_subjects : [])
      .map(item => sanitizeVisualDescriptor(item, ''))
  )
  const peoplePresent = typeof rawBlueprint?.people_present === 'boolean'
    ? rawBlueprint.people_present
    : inferPeoplePresent([
      sanitizeVisualDescriptor(rawBlueprint?.hero_subject, ''),
      ...secondaryElements,
      ...allowedSubjects
    ])

  const fallbackAllowedSubjects = uniqueNonEmptyStrings([
    sanitizeVisualDescriptor(rawBlueprint?.hero_subject, ''),
    ...secondaryElements
  ])

  return {
    hero_subject: sanitizeVisualDescriptor(
      rawBlueprint?.hero_subject,
      'a compelling expressive portrait subject'
    ),
    secondary_elements: secondaryElements,
    background_texture: sanitizeVisualDescriptor(
      rawBlueprint?.background_texture,
      'atmospheric light leaks and textured gradients'
    ),
    scene,
    palette,
    mood,
    allowed_subjects: allowedSubjects.length > 0 ? allowedSubjects : fallbackAllowedSubjects,
    people_present: peoplePresent
  }
}

/**
 * Stage A: Analyze source images and return a structured visual blueprint.
 */
async function extractVisualBlueprint(imageUrls, style = 'editorial_photoshoot', debug = false) {
  const promptsConfig = config.prompts || {}
  const maxAttempts = promptsConfig.stageAMaxAttempts || 3
  const retryDelayMs = promptsConfig.stageARetryDelayMs || 3000
  const userTemplate = promptsConfig.gptVisionUserPrompt
    || 'Analyze these {count} source images for style profile "{style_profile}" and return only the JSON schema.'
  const excludedUrls = new Set()

  if (!process.env.OPENAI_API_KEY) {
    if (debug || config.debug?.logPrompts) {
      console.log('  ⚠ No OpenAI API key found, using default blueprint')
    }
    return null
  }

  if (debug || config.debug?.logPrompts) {
    console.log('  Stage A: extracting structured visual blueprint with GPT-4o...')
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const baseMaxVisionImages = promptsConfig.maxVisionImages || 8
      const maxVisionImages = Math.max(4, baseMaxVisionImages - ((attempt - 1) * 2))
      const candidateUrls = imageUrls.filter(url => !excludedUrls.has(url))
      const sourcePool = candidateUrls.length >= 4 ? candidateUrls : imageUrls
      const analysisImageUrls = sampleEvenly(sourcePool, maxVisionImages)

      if ((debug || config.debug?.logPrompts) && analysisImageUrls.length < imageUrls.length) {
        console.log(`  Stage A: limiting analysis to ${analysisImageUrls.length} of ${imageUrls.length} images for stability`)
        console.log(`  Stage A note: this limit only affects blueprint extraction; final generation still uses all ${imageUrls.length} uploaded images.`)
      }
      if ((debug || config.debug?.logPrompts) && attempt > 1) {
        console.log(`  Stage A retry attempt ${attempt}/${maxAttempts} using up to ${maxVisionImages} images`)
        if (excludedUrls.size > 0) {
          console.log(`  Stage A retry exclusions: ${excludedUrls.size} timed-out image(s)`)
        }
      }

      const userText = userTemplate
        .replaceAll('{count}', String(analysisImageUrls.length))
        .replaceAll('{source_count}', String(imageUrls.length))
        .replaceAll('{style_profile}', style)

      const imageContent = analysisImageUrls.map(url => ({
        type: 'image_url',
        image_url: { url }
      }))

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: promptsConfig.gptVisionSystemPrompt
              || 'Return only valid JSON for hero_subject, secondary_elements, background_texture, palette, and mood.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userText
              },
              ...imageContent
            ]
          }
        ],
        max_tokens: promptsConfig.maxTokens || 320,
        temperature: promptsConfig.temperature ?? 0.35
      })

      const rawContent = response.choices?.[0]?.message?.content || ''
      const parsed = parseBlueprintResponse(rawContent)
      const blueprint = normalizeBlueprint(parsed)

      if (debug || config.debug?.logPrompts) {
        console.log(`  ✓ Blueprint: ${JSON.stringify(blueprint)}`)
      }

      return blueprint
    } catch (error) {
      const canRetry = attempt < maxAttempts
      const timedOutUrl = extractTimedOutUrl(error)
      if (timedOutUrl) {
        excludedUrls.add(timedOutUrl)
      }
      if (debug || config.debug?.logPrompts) {
        console.error(`  ⚠ Stage A attempt ${attempt}/${maxAttempts} failed: ${error.message}`)
        if (timedOutUrl) {
          console.log(`  Stage A will exclude timed-out URL on next retry: ${timedOutUrl}`)
        }
        if (canRetry) {
          const retrySeconds = Math.max(1, Math.round(retryDelayMs / 1000))
          console.log(`  ⏳ Waiting ${retrySeconds}s before Stage A retry...`)
        }
      }
      if (canRetry) {
        await sleep(retryDelayMs)
        continue
      }
    }
  }

  if (debug || config.debug?.logPrompts) {
    console.error('  ⚠ Stage A failed after all retries, using default blueprint')
  }
  return null
}

/**
 * Stage B: Deterministically build the final generation prompt from style profile + blueprint.
 */
function buildPromptFromBlueprint(blueprint, style = 'editorial_photoshoot', sourceImageCount = 0) {
  const promptsConfig = config.prompts || {}
  const profileName = style || promptsConfig.profile || 'editorial_photoshoot'
  const profile = promptsConfig.profiles?.[profileName] || {}
  const normalized = normalizeBlueprint(blueprint || {})
  const maxSecondaryElements = promptsConfig.maxSecondaryElements || 8

  const styleDirectives = (profile.style_directives || []).join(', ')
  const compositionRules = (profile.composition_rules || []).join(', ')
  const lightingRules = (profile.lighting_rules || []).join(', ')
  const colorRules = (profile.color_rules || []).join(', ')
  const secondaryElements = normalized.secondary_elements.length > 0
    ? normalized.secondary_elements.join(', ')
    : 'subtle silhouettes and geometric forms'
  const allowedSubjects = normalized.allowed_subjects.length > 0
    ? normalized.allowed_subjects.join(', ')
    : `${normalized.hero_subject}, ${secondaryElements}`
  const negativeTerms = (promptsConfig.negative || []).join(', ')

  const promptParts = [
    promptsConfig.default
      || 'Create a single cohesive cinematic music blog header from the source images.',
    `Style profile: ${profileName}.`,
    sourceImageCount > 0
      ? `Incorporate a distinct visual motif from all ${sourceImageCount} source images; do not ignore any source image.`
      : '',
    `Hero subject in foreground: ${normalized.hero_subject}.`,
    `Scene selected from Stage A: ${normalized.scene}. Keep a single coherent scene and do not switch environments.`,
    `Secondary elements (supporting motifs, max ${maxSecondaryElements}): ${secondaryElements}.`,
    `Background texture: ${normalized.background_texture}.`,
    `Mood: ${normalized.mood}.`,
    `Color direction: dominant ${normalized.palette.dominant}; vivid accent ${normalized.palette.accent}.`,
    `Subject lock: use only visible subjects from the uploaded source images. Allowed subjects: ${allowedSubjects}.`,
    normalized.people_present
      ? 'Human subject rule: if people are present, only depict people/faces that are directly visible in the uploaded source images; do not create extra people. Use multiple people from the uploaded images when available (target 2-4 people in-frame for group-rich sets).'
      : 'Human subject rule: do not generate any people, faces, or human figures unless they are clearly visible in the uploaded source images.',
    'Exposure requirements: keep most of the frame in mid and high exposure with visible shadow detail; avoid black void backgrounds.',
    'Render the hero subject with illuminated surfaces and color reflections, not as a matte-black silhouette.',
    `Composition requirements: ${compositionRules || 'one clear focal subject, layered depth, intentional negative space'}.`,
    `Lighting requirements: ${lightingRules || 'natural ambient location lighting, soft contrast, no staged spotlights'}.`,
    `Color requirements: ${colorRules || 'neutral base and controlled vivid accent, avoid monochrome grading'}.`,
    `Style directives: ${styleDirectives || 'editorial realism, crisp details, clean compositing'}.`,
    'Remove all text and typography.',
    negativeTerms ? `Avoid: ${negativeTerms}.` : ''
  ]

  return promptParts.join(' ').replace(/\s+/g, ' ').trim()
}

async function buildCollagePrompt(imageUrls, style = 'editorial_photoshoot', debug = false) {
  const blueprint = await extractVisualBlueprint(imageUrls, style, debug)
  const prompt = buildPromptFromBlueprint(blueprint, style, imageUrls.length)

  if (debug || config.debug?.logPrompts) {
    console.log(`  ✓ Stage B prompt: "${prompt}"`)
  }

  return {
    prompt,
    blueprint,
    usedVisionBlueprint: Boolean(blueprint)
  }
}

/**
 * Detects text in an image using edge detection
 * Higher score = more text/sharp edges (likely text)
 * Lower score = less text (better for content policy)
 */
async function detectTextScore(imagePath) {
  try {
    // Focus on top and bottom regions where text usually appears
    const image = sharp(imagePath)
    const metadata = await image.metadata()

    const { width, height } = metadata

    // Extract top 20% and bottom 20% where album titles/artist names typically are
    const topRegion = await sharp(imagePath)
      .extract({ left: 0, top: 0, width, height: Math.floor(height * 0.2) })
      .resize(256, 51, { fit: 'fill' })
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] // Edge detection kernel
      })
      .raw()
      .toBuffer()

    const bottomRegion = await sharp(imagePath)
      .extract({ left: 0, top: Math.floor(height * 0.8), width, height: Math.floor(height * 0.2) })
      .resize(256, 51, { fit: 'fill' })
      .greyscale()
      .convolve({
        width: 3,
        height: 3,
        kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1]
      })
      .raw()
      .toBuffer()

    // Count high-intensity pixels (edges) which indicate text
    let topEdgeCount = 0
    let bottomEdgeCount = 0
    const threshold = 50

    for (let i = 0; i < topRegion.length; i++) {
      if (topRegion[i] > threshold) topEdgeCount++
      if (bottomRegion[i] > threshold) bottomEdgeCount++
    }

    const totalEdgePixels = topEdgeCount + bottomEdgeCount
    const totalPixels = topRegion.length + bottomRegion.length
    const textScore = (totalEdgePixels / totalPixels) * 100

    return textScore
  } catch (error) {
    console.error(`  Error detecting text in ${path.basename(imagePath)}:`, error.message)
    return 100 // Assume high text score on error (to deprioritize)
  }
}

/**
 * Analyzes an image and calculates a comprehensive score
 * Higher score = more vibrant colors + less text = better for collage
 */
async function calculateImageScore(imagePath, debug = false) {
  try {
    // Resize to 256x256 for performance
    const image = sharp(imagePath).resize(256, 256, { fit: 'cover' })

    // Get raw pixel data
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })

    // Calculate color statistics
    let rSum = 0, gSum = 0, bSum = 0
    let rVariance = 0, gVariance = 0, bVariance = 0
    let saturationSum = 0
    const pixelCount = info.width * info.height

    // First pass: calculate means
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      rSum += r
      gSum += g
      bSum += b

      // Calculate saturation (max - min of RGB)
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      saturationSum += (max - min)
    }

    const rMean = rSum / pixelCount
    const gMean = gSum / pixelCount
    const bMean = bSum / pixelCount
    const avgSaturation = saturationSum / pixelCount

    // Second pass: calculate variance
    for (let i = 0; i < data.length; i += info.channels) {
      rVariance += Math.pow(data[i] - rMean, 2)
      gVariance += Math.pow(data[i + 1] - gMean, 2)
      bVariance += Math.pow(data[i + 2] - bMean, 2)
    }

    rVariance /= pixelCount
    gVariance /= pixelCount
    bVariance /= pixelCount

    const totalVariance = (rVariance + gVariance + bVariance) / 3

    // Detect text
    const textScore = await detectTextScore(imagePath)

    // Combined score (using config weights):
    // - Color vibrancy: saturation + variance
    // - Less text is better: penalize text
    const weights = config.scoring || { saturationWeight: 0.4, varianceWeight: 0.3, textPenaltyWeight: 0.3 }
    const colorScore = (avgSaturation * weights.saturationWeight) + (Math.sqrt(totalVariance) * weights.varianceWeight)
    const textPenalty = (100 - textScore) * weights.textPenaltyWeight // Invert text score (less text = higher score)
    const finalScore = colorScore + textPenalty

    if (debug) {
      return {
        score: finalScore,
        colorScore,
        textScore,
        avgSaturation,
        totalVariance,
        path: imagePath
      }
    }

    return {
      score: finalScore,
      path: imagePath
    }
  } catch (error) {
    console.error(`  Error analyzing ${path.basename(imagePath)}:`, error.message)
    return {
      score: 0,
      path: imagePath
    }
  }
}

/**
 * Calculates the dominant color of an image
 * Returns RGB values and color temperature classification
 */
async function calculateDominantColor(imagePath) {
  try {
    const image = sharp(imagePath).resize(64, 64, { fit: 'cover' })
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })

    let rSum = 0, gSum = 0, bSum = 0
    const pixelCount = info.width * info.height

    for (let i = 0; i < data.length; i += info.channels) {
      rSum += data[i]
      gSum += data[i + 1]
      bSum += data[i + 2]
    }

    const r = Math.round(rSum / pixelCount)
    const g = Math.round(gSum / pixelCount)
    const b = Math.round(bSum / pixelCount)

    // Classify as warm or cool based on red vs blue dominance
    const warmth = (r * 1.2 + g * 0.5) - (b * 1.5 + g * 0.3)
    const temperature = warmth > 0 ? 'warm' : 'cool'

    return { r, g, b, temperature, path: imagePath }
  } catch (error) {
    console.error(`  Error calculating dominant color for ${path.basename(imagePath)}:`, error.message)
    return { r: 128, g: 128, b: 128, temperature: 'neutral', path: imagePath }
  }
}

/**
 * Calculates Euclidean distance between two RGB colors
 */
function colorDistance(color1, color2) {
  const dr = color1.r - color2.r
  const dg = color1.g - color2.g
  const db = color1.b - color2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/**
 * Selects images to maximize color diversity
 * Uses greedy selection: picks the image most different from already selected
 */
async function selectDiverseImages(imagePaths, scores, count, debug = false) {
  if (debug) console.log('  Strategy: DIVERSE (maximizing color variety)')

  // Calculate dominant colors for all images
  const colors = await Promise.all(imagePaths.map(p => calculateDominantColor(p)))

  const selected = []
  const remaining = [...colors]

  // Start with the most vibrant image
  const sortedByScore = [...scores].sort((a, b) => b.score - a.score)
  const firstImage = sortedByScore[0]
  const firstColor = colors.find(c => c.path === firstImage.path)
  selected.push(firstColor)
  remaining.splice(remaining.findIndex(c => c.path === firstColor.path), 1)

  // Greedily select images that maximize color distance from already selected
  while (selected.length < count && remaining.length > 0) {
    let maxMinDistance = -1
    let bestCandidate = null
    let bestIndex = -1

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      // Find minimum distance to any already selected image
      const minDistance = Math.min(...selected.map(s => colorDistance(candidate, s)))

      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance
        bestCandidate = candidate
        bestIndex = i
      }
    }

    if (bestCandidate) {
      selected.push(bestCandidate)
      remaining.splice(bestIndex, 1)
    }
  }

  if (debug) {
    console.log(`  Selected ${selected.length} images with maximum color diversity:`)
    selected.forEach((c, i) => {
      console.log(`    ${i + 1}. ${path.basename(c.path)} (RGB: ${c.r},${c.g},${c.b} - ${c.temperature})`)
    })
  }

  return selected.map(c => c.path)
}

/**
 * Selects a balanced mix of warm and cool toned images
 */
async function selectBalancedImages(imagePaths, scores, count, debug = false) {
  if (debug) console.log('  Strategy: BALANCED (mixing warm and cool tones)')

  // Calculate dominant colors and classify by temperature
  const colors = await Promise.all(imagePaths.map(p => calculateDominantColor(p)))

  const warm = colors.filter(c => c.temperature === 'warm')
  const cool = colors.filter(c => c.temperature === 'cool')

  // Sort each group by vibrancy score
  const getScore = (colorObj) => scores.find(s => s.path === colorObj.path)?.score || 0
  warm.sort((a, b) => getScore(b) - getScore(a))
  cool.sort((a, b) => getScore(b) - getScore(a))

  if (debug) {
    console.log(`    Found ${warm.length} warm and ${cool.length} cool images`)
  }

  // Alternate between warm and cool, picking best from each
  const selected = []
  const halfCount = Math.ceil(count / 2)

  // Take roughly equal from each group
  const warmCount = Math.min(halfCount, warm.length)
  const coolCount = Math.min(count - warmCount, cool.length)

  // If one group is short, take more from the other
  const actualWarmCount = Math.min(warmCount + Math.max(0, coolCount - cool.length), warm.length)
  const actualCoolCount = Math.min(count - actualWarmCount, cool.length)

  for (let i = 0; i < actualWarmCount; i++) {
    selected.push(warm[i])
  }
  for (let i = 0; i < actualCoolCount; i++) {
    selected.push(cool[i])
  }

  // Shuffle to mix warm and cool together
  for (let i = selected.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selected[i], selected[j]] = [selected[j], selected[i]]
  }

  if (debug) {
    console.log(`  Selected ${selected.length} images (${actualWarmCount} warm, ${actualCoolCount} cool):`)
    selected.forEach((c, i) => {
      console.log(`    ${i + 1}. ${path.basename(c.path)} (${c.temperature})`)
    })
  }

  return selected.map(c => c.path)
}

/**
 * Randomly selects from top 75% of scored images
 */
function selectRandomImages(scores, count, debug = false) {
  if (debug) console.log('  Strategy: RANDOM (weighted random from top 75%)')

  // Take top 75% of candidates
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const cutoff = Math.ceil(sortedScores.length * 0.75)
  const candidates = sortedScores.slice(0, cutoff)

  // Shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]]
  }

  // Take requested count
  const selected = candidates.slice(0, Math.min(count, candidates.length))

  if (debug) {
    console.log(`  Selected ${selected.length} random images from top ${cutoff} candidates:`)
    selected.forEach((s, i) => {
      console.log(`    ${i + 1}. ${path.basename(s.path)} [score: ${s.score.toFixed(1)}]`)
    })
  }

  return selected.map(s => s.path)
}

/**
 * Deterministic pop-focused selector:
 * - 60% highest vibrancy images
 * - 40% color-diverse images to avoid muddy sameness
 */
async function selectPopMixImages(imagePaths, scores, count, debug = false) {
  if (debug) console.log('  Strategy: POP-MIX (vibrant focal + diverse support)')

  const sortedScores = [...scores].sort((a, b) => b.score - a.score)
  const vibrantCount = Math.max(1, Math.ceil(count * 0.6))

  const vibrantSelection = sortedScores
    .slice(0, Math.min(vibrantCount, sortedScores.length))
    .map(item => item.path)

  const selectedSet = new Set(vibrantSelection)
  const remainingPaths = imagePaths.filter(p => !selectedSet.has(p))
  const remainingScores = scores.filter(item => !selectedSet.has(item.path))
  const diverseCount = Math.max(0, count - vibrantSelection.length)

  let diverseSelection = []
  if (diverseCount > 0 && remainingPaths.length > 0) {
    diverseSelection = await selectDiverseImages(remainingPaths, remainingScores, diverseCount, false)
  }

  const combined = [...vibrantSelection, ...diverseSelection]

  if (combined.length < count) {
    for (const item of sortedScores) {
      if (!combined.includes(item.path)) {
        combined.push(item.path)
      }
      if (combined.length >= count) {
        break
      }
    }
  }

  const selected = combined.slice(0, Math.min(count, combined.length))

  if (debug) {
    console.log(`  Selected ${selected.length} images with pop-mix strategy:`)
    selected.forEach((item, idx) => {
      const score = scores.find(s => s.path === item)?.score ?? 0
      console.log(`    ${idx + 1}. ${path.basename(item)} [score: ${score.toFixed(1)}]`)
    })
  }

  return selected
}

/**
 * Selects the best images using configured strategy selection
 * Strategies: pop-mix (default), vibrant, diverse, balanced, random
 * Filters out blacklisted albums/artists
 */
async function selectMostInterestingImages(imagePaths, count = 4, debug = false, forceStrategy = null) {
  if (debug) {
    console.log(`  Analyzing ${imagePaths.length} images (color vibrancy + text detection + blacklist filtering)...`)
  }

  // Filter out blacklisted images first
  const filteredPaths = imagePaths.filter(imagePath => {
    const filename = path.basename(imagePath, path.extname(imagePath))

    // Check if blacklisted
    if (isBlacklisted(filename)) {
      if (debug) {
        console.log(`  ⚠ Blacklisted (skipping): ${filename}`)
      }
      return false
    }
    return true
  })

  if (debug && filteredPaths.length < imagePaths.length) {
    console.log(`  Filtered out ${imagePaths.length - filteredPaths.length} blacklisted images`)
  }

  if (filteredPaths.length === 0) {
    throw new Error('All images are blacklisted! Update fal-collage-config.json')
  }

  // Score all images first (needed by all strategies)
  const scores = await Promise.all(
    filteredPaths.map(imagePath => calculateImageScore(imagePath, debug))
  )

  // Log all scores if debug enabled
  if (debug || config.debug?.logScores) {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score)
    console.log(`  All ${sortedScores.length} images ranked by vibrancy:`)
    sortedScores.forEach((item, idx) => {
      const details = item.textScore !== undefined
        ? ` [color: ${item.colorScore.toFixed(1)}, text: ${item.textScore.toFixed(1)}%, final: ${item.score.toFixed(1)}]`
        : ` [score: ${item.score.toFixed(1)}]`
      console.log(`    ${idx + 1}. ${path.basename(item.path)}${details}`)
    })
  }

  // Select strategy
  const strategies = config.images?.strategies || ['pop-mix']
  const strategySelection = config.images?.strategySelection || 'first'

  let strategy = forceStrategy
  if (!strategy) {
    if (strategySelection === 'random') {
      strategy = strategies[Math.floor(Math.random() * strategies.length)]
    } else {
      strategy = strategies[0] // Default to first strategy
    }
  }

  console.log(`  🎲 Selected strategy: ${strategy.toUpperCase()}`)

  // Dispatch to appropriate selection function
  let selectedPaths
  try {
    switch (strategy) {
      case 'pop-mix':
        selectedPaths = await selectPopMixImages(filteredPaths, scores, count, debug)
        break
      case 'diverse':
        selectedPaths = await selectDiverseImages(filteredPaths, scores, count, debug)
        break
      case 'balanced':
        selectedPaths = await selectBalancedImages(filteredPaths, scores, count, debug)
        break
      case 'random':
        selectedPaths = selectRandomImages(scores, count, debug)
        break
      case 'vibrant':
      default:
        // Original vibrant strategy - top N by score
        if (debug) console.log('  Strategy: VIBRANT (most colorful/saturated)')
        const sortedScores = [...scores].sort((a, b) => b.score - a.score)
        const selected = sortedScores.slice(0, Math.min(count, sortedScores.length))
        if (debug) {
          console.log(`  Selected ${selected.length} most vibrant images:`)
          selected.forEach((item, idx) => {
            console.log(`    ${idx + 1}. ${path.basename(item.path)} [score: ${item.score.toFixed(1)}]`)
          })
        }
        selectedPaths = selected.map(item => item.path)
        break
    }
  } catch (error) {
    console.error(`  ⚠ Strategy ${strategy} failed: ${error.message}, falling back to vibrant`)
    const sortedScores = [...scores].sort((a, b) => b.score - a.score)
    selectedPaths = sortedScores.slice(0, Math.min(count, sortedScores.length)).map(item => item.path)
  }

  return selectedPaths
}

/**
 * Creates a grid composition from multiple album covers
 * @param {Array} imagePaths - Array of image paths to compose
 * @param {number} columns - Number of columns in grid
 * @param {number} cellSize - Size of each cell in pixels
 * @param {boolean} debug - Enable debug logging
 * @returns {Buffer} - JPEG buffer of the grid composition
 */
async function createGridComposition(imagePaths, columns = 3, cellSize = 400, debug = false) {
  try {
    const imageCount = imagePaths.length
    const rows = Math.ceil(imageCount / columns)
    const gridWidth = columns * cellSize
    const gridHeight = rows * cellSize

    if (debug) {
      console.log(`    Creating ${columns}x${rows} grid (${gridWidth}x${gridHeight}px) from ${imageCount} images`)
    }

    // Create base canvas
    const canvas = sharp({
      create: {
        width: gridWidth,
        height: gridHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    })

    // Prepare composites
    const composites = []

    for (let i = 0; i < imageCount; i++) {
      const col = i % columns
      const row = Math.floor(i / columns)
      const left = col * cellSize
      const top = row * cellSize

      // Resize to cell size (no cropping)
      const resizedBuffer = await sharp(imagePaths[i])
        .resize(cellSize, cellSize, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
        .toBuffer()

      composites.push({
        input: resizedBuffer,
        left,
        top
      })
    }

    // Composite all images onto canvas
    const gridBuffer = await canvas
      .composite(composites)
      .jpeg({ quality: 95 })
      .toBuffer()

    return gridBuffer
  } catch (error) {
    throw new Error(`Failed to create grid composition: ${error.message}`)
  }
}

/**
 * Pre-process an image to remove text regions (typically top/bottom)
 * Crops to center area which usually avoids album titles/artist names
 */
async function preprocessImageForCollage(imagePath, debug = false) {
  try {
    const image = sharp(imagePath)
    const metadata = await image.metadata()

    const { width: origWidth, height: origHeight } = metadata

    // Calculate crop area - use config values for crop regions
    const cropPercentage = config.images?.cropRegions || {
      top: 0.15,
      bottom: 0.15,
      left: 0.05,
      right: 0.05
    }

    const cropLeft = Math.floor(origWidth * cropPercentage.left)
    const cropTop = Math.floor(origHeight * cropPercentage.top)
    const cropWidth = Math.floor(origWidth * (1 - cropPercentage.left - cropPercentage.right))
    const cropHeight = Math.floor(origHeight * (1 - cropPercentage.top - cropPercentage.bottom))

    if (debug) {
      console.log(`    Cropping ${path.basename(imagePath)}: ${origWidth}x${origHeight} → ${cropWidth}x${cropHeight}`)
    }

    // Extract center region and resize to standard size for upload
    const processedBuffer = await image
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight
      })
      .resize(800, 800, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
      .jpeg({ quality: 95 })
      .toBuffer()

    return processedBuffer
  } catch (error) {
    throw new Error(`Failed to preprocess ${path.basename(imagePath)}: ${error.message}`)
  }
}

async function applyPostProcessing(imageBuffer, debug = false) {
  const postprocess = config.postprocess || {}
  if (postprocess.enabled === false) {
    return imageBuffer
  }

  const saturationAmount = Number(postprocess.saturation ?? 0)
  const contrastAmount = Number(postprocess.contrast ?? 0)
  const sharpenAmount = Number(postprocess.sharpen ?? 0)
  const brightnessAmount = Number(postprocess.brightness ?? 0)
  const liftAmount = Number(postprocess.lift ?? 0)

  let pipeline = sharp(imageBuffer)

  if (saturationAmount !== 0 || brightnessAmount !== 0) {
    const modulateOptions = {}
    if (saturationAmount !== 0) {
      modulateOptions.saturation = Math.max(0.1, 1 + saturationAmount)
    }
    if (brightnessAmount !== 0) {
      modulateOptions.brightness = Math.max(0.1, 1 + brightnessAmount)
    }
    pipeline = pipeline.modulate(modulateOptions)
  }

  if (contrastAmount !== 0) {
    const factor = Math.max(0.1, 1 + contrastAmount)
    const offset = 128 * (1 - factor)
    pipeline = pipeline.linear(factor, offset)
  }

  if (liftAmount !== 0) {
    pipeline = pipeline.linear(1, liftAmount)
  }

  if (sharpenAmount > 0) {
    pipeline = pipeline.sharpen(sharpenAmount)
  }

  if (debug) {
    console.log(`  Applied post-processing (contrast: ${contrastAmount}, saturation: ${saturationAmount}, brightness: ${brightnessAmount}, lift: ${liftAmount}, sharpen: ${sharpenAmount})`)
  }

  return pipeline.toBuffer()
}

/**
 * Creates a collage using FAL.ai Gemini 3 Pro Image model
 */
async function createFALCollage(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed,
    strategy = null,
    style = config.prompts?.profile || 'bold_cinematic',
    debug = process.env.DEBUG_COLLAGE === '1'
  } = options

  // Validate FAL_KEY
  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for FAL.ai collage generation')
  }

  // Configure FAL client
  fal.config({
    credentials: falKey
  })

  if (debug) {
    console.log(`  Creating FAL.ai collage (${width}x${height})...`)
  }

  // Deduplicate images
  const sanitizeKey = filePath => path.basename(filePath).toLowerCase().replace(/[^a-z0-9]/g, '')
  const uniqueImagePaths = []
  const seenKeys = new Set()

  for (const imagePath of imagePaths) {
    const key = sanitizeKey(imagePath)
    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      uniqueImagePaths.push(imagePath)
    } else if (debug) {
      console.log(`  Skipping duplicate album art: ${imagePath}`)
    }
  }

  if (uniqueImagePaths.length === 0) {
    throw new Error('No unique album images provided to createFALCollage')
  }

  // Get all candidate images sorted by vibrancy and text score
  // Strategy: Send individual album covers to model (flexible based on available images)
  const minAlbums = config.images?.minCount || 2
  const maxAlbums = config.images?.maxCount || 14
  const totalAlbumsNeeded = Math.min(maxAlbums, Math.max(minAlbums, uniqueImagePaths.length))

  if (uniqueImagePaths.length < minAlbums) {
    throw new Error(`Not enough unique images (need at least ${minAlbums}, have ${uniqueImagePaths.length})`)
  }

  const maxRetries = config.retry?.maxAttempts || 3

  // Filter blacklisted images
  const nonBlacklistedPaths = uniqueImagePaths.filter(imagePath => {
    const filename = path.basename(imagePath, path.extname(imagePath))
    if (isBlacklisted(filename)) {
      if (debug) console.log(`  ⚠ Blacklisted (skipping): ${filename}`)
      return false
    }
    return true
  })

  // Skip selection when all images fit within maxAlbums
  let allCandidates
  if (nonBlacklistedPaths.length <= maxAlbums) {
    if (debug) {
      console.log(`  All ${nonBlacklistedPaths.length} images fit within maxAlbums (${maxAlbums}), using all directly`)
    }
    allCandidates = nonBlacklistedPaths
  } else {
    allCandidates = await selectMostInterestingImages(
      uniqueImagePaths,
      nonBlacklistedPaths.length,
      debug,
      strategy
    )
  }

  if (debug) {
    console.log(`  Strategy: Send ${allCandidates.length} individual album covers to FAL edit model (${minAlbums}-${maxAlbums} range)`)
    console.log(`  Will retry up to ${maxRetries} times if content policy issues occur`)
  }

  let attempt = 0
  let selectedImages = []
  let uploadedUrls = []

  // Helper function to preprocess and upload individual albums
  async function preprocessAndUploadAlbums(imagePaths) {
    const urls = []

    if (debug) {
      console.log(`  Pre-processing and uploading ${imagePaths.length} albums:`)
    }

    for (const imagePath of imagePaths) {
      try {
        if (debug) {
          console.log(`    Processing ${path.basename(imagePath)}...`)
        }

        // Resize to 800x800 for upload (no cropping)
        const processedBuffer = await sharp(imagePath)
          .resize(800, 800, { fit: 'cover', kernel: sharp.kernel.lanczos3 })
          .jpeg({ quality: 95 })
          .toBuffer()

        // Upload to FAL.ai
        const file = new File([processedBuffer], path.basename(imagePath), { type: 'image/jpeg' })
        const url = await fal.storage.upload(file)
        urls.push(url)

        if (debug) {
          console.log(`      → Uploaded: ${url}`)
        }
      } catch (error) {
        throw new Error(`Failed to process/upload ${path.basename(imagePath)}: ${error.message}`)
      }
    }

    return urls
  }

  // Select initial images (as many as available, up to max)
  selectedImages = allCandidates.slice(0, totalAlbumsNeeded)

  if (selectedImages.length < minAlbums) {
    throw new Error(`Not enough images (need at least ${minAlbums}, have ${selectedImages.length})`)
  }

  if (debug) {
    console.log(`  Attempt ${attempt + 1}: Selected ${selectedImages.length} albums:`)
    selectedImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${path.basename(img)}`))
  }

  uploadedUrls = await preprocessAndUploadAlbums(selectedImages)

  if (uploadedUrls.length === 0) {
    throw new Error('No images were successfully uploaded to FAL.ai')
  }

  // Build prompt from structured blueprint + style profile
  let promptData = await buildCollagePrompt(uploadedUrls, style, debug)
  let prompt = promptData.prompt

  if (debug) {
    console.log(`  Generating collage with ${uploadedUrls.length} images`)
    console.log(`  Style profile: ${style}`)
    console.log(`  Prompt source: ${promptData.usedVisionBlueprint ? 'vision blueprint + deterministic assembly' : 'default deterministic assembly'}`)
    console.log(`  Prompt: "${prompt}"`)
  }

  // Determine aspect ratio based on dimensions
  let aspectRatio = '16:9' // Default for 1400×800
  if (width === height) {
    aspectRatio = '1:1'
  } else if (width > height) {
    const ratio = width / height
    if (ratio > 1.7) aspectRatio = '16:9'
    else if (ratio > 1.4) aspectRatio = '3:2'
    else aspectRatio = '4:3'
  } else {
    const ratio = height / width
    if (ratio > 1.7) aspectRatio = '9:16'
    else if (ratio > 1.4) aspectRatio = '2:3'
    else aspectRatio = '3:4'
  }

  // Prepare API request payload
  const apiInput = {
    prompt,
    image_urls: uploadedUrls,
    aspect_ratio: config.output?.aspectRatio || aspectRatio,
    num_images: config.output?.numImages || 1,
    output_format: config.output?.format || 'png',
    resolution: config.output?.resolution || '2K',
    enable_web_search: true
  }

  if (typeof seed === 'number' && !Number.isNaN(seed)) {
    apiInput.seed = seed
  }

  if (debug) {
    console.log(`  Aspect ratio: ${aspectRatio}`)
    console.log(`  API payload:`, JSON.stringify(apiInput, null, 2))
  }

  // Retry loop for content policy violations, with model fallback support
  const primaryModelName = config.model?.name || 'fal-ai/nano-banana-pro/edit'
  const fallbackModelName = config.model?.fallback
  let activeModelName = primaryModelName
  let usedFallbackModel = false

  while (attempt < maxRetries) {
    try {
      // Call FAL.ai model (from config)
      if (debug) {
        console.log(`  Using model: ${activeModelName}`)
      }

      const result = await fal.subscribe(activeModelName, {
        input: apiInput,
        logs: debug,
        onQueueUpdate: (update) => {
          if (debug && update.status === "IN_PROGRESS") {
            update.logs?.map(log => log.message).forEach(msg => console.log(`  [FAL] ${msg}`))
          }
        }
      })

      if (!result.data || !result.data.images || result.data.images.length === 0) {
        throw new Error('FAL.ai model returned no images')
      }

      const imageUrl = result.data.images[0].url

      if (debug) {
        console.log(`  Generated image URL: ${imageUrl}`)
      }

      // Download and save the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const rawBuffer = Buffer.from(arrayBuffer)
      const processedBuffer = await applyPostProcessing(rawBuffer, debug)

      // Get original image dimensions
      const originalMetadata = await sharp(processedBuffer).metadata()
      const originalWidth = originalMetadata.width
      const originalHeight = originalMetadata.height

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      // Save the original full-resolution image to the main output path
      await sharp(processedBuffer)
        .png({ compressionLevel: 6, quality: 100 })
        .toFile(outputPath)

      if (debug) {
        console.log(`  ✓ Saved original resolution: ${originalWidth}×${originalHeight} → ${outputPath}`)
      }

      // Save resized version with -small suffix
      const ext = path.extname(outputPath)
      const baseName = path.basename(outputPath, ext)
      const smallOutputPath = path.join(outputDir, `${baseName}-small${ext}`)

      await sharp(processedBuffer)
        .resize(width, height, { fit: 'cover' })
        .png({ compressionLevel: 6, quality: 100 })
        .toFile(smallOutputPath)

      console.log(`  ✓ Created FAL.ai collage with ${selectedImages.length} selected album covers`)
      console.log(`    Original: ${originalWidth}×${originalHeight} → ${outputPath}`)
      console.log(`    Small:    ${width}×${height} → ${smallOutputPath}`)

      return {
        outputPath,
        smallOutputPath,
        originalWidth,
        originalHeight,
        selectedImages,
        seed: result.data.seeds?.[0],
        imageUrl,
        model: activeModelName
      }

    } catch (error) {
      // Check if this is a content policy violation
      const isContentPolicyViolation = error.body?.detail?.some(
        detail => detail.type === 'content_policy_violation'
      )

      if (isContentPolicyViolation && attempt < maxRetries - 1) {
        console.log(`  ⚠ Content policy violation detected on attempt ${attempt + 1}`)
        console.log(`  → Retrying with different album selection from the ranked list...`)

        // Select next batch of images
        attempt++
        const startIndex = attempt * totalAlbumsNeeded
        const remainingCandidates = allCandidates.slice(startIndex)

        // Use as many as available, down to the minimum (2)
        if (remainingCandidates.length < minAlbums) {
          console.log(`  ✗ Not enough alternative images to retry (need at least ${minAlbums}, have ${remainingCandidates.length})`)
          attempt = maxRetries
        } else {
          // Take as many as we can, up to maxAlbums
          selectedImages = remainingCandidates.slice(0, Math.min(maxAlbums, remainingCandidates.length))

          if (debug) {
            console.log(`  Attempt ${attempt + 1}: Selected ${selectedImages.length} albums (using ${selectedImages.length >= minAlbums ? 'enough' : 'insufficient'} images)`)
            selectedImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${path.basename(img)}`))
          }

          // Preprocess and upload new albums
          uploadedUrls = await preprocessAndUploadAlbums(selectedImages)

          // Rebuild prompt with new image batch
          const retryPromptData = await buildCollagePrompt(uploadedUrls, style, debug)
          promptData = retryPromptData

          // Update API payload with new URLs and prompt
          apiInput.image_urls = uploadedUrls
          apiInput.prompt = retryPromptData.prompt

          if (debug) {
            console.log(`  Updated API payload with ${uploadedUrls.length} album URLs`)
            console.log(`  Rebuilt prompt for retry (${retryPromptData.usedVisionBlueprint ? 'vision blueprint' : 'default blueprint'})`)
          }

          // Loop will retry with new albums
          continue
        }
      }

      // Switch to fallback model once before failing
      const canSwitchToFallback = !usedFallbackModel
        && fallbackModelName
        && fallbackModelName !== activeModelName

      if (canSwitchToFallback) {
        usedFallbackModel = true
        activeModelName = fallbackModelName
        attempt = 0

        console.log(`  ⚠ Primary model failed (${primaryModelName}), switching to fallback: ${fallbackModelName}`)

        selectedImages = allCandidates.slice(0, totalAlbumsNeeded)
        uploadedUrls = await preprocessAndUploadAlbums(selectedImages)
        const fallbackPromptData = await buildCollagePrompt(uploadedUrls, style, debug)
        promptData = fallbackPromptData
        apiInput.image_urls = uploadedUrls
        apiInput.prompt = fallbackPromptData.prompt

        continue
      }

      // Enhanced error reporting for non-retryable errors
      let errorMessage = error.message

      if (error.body) {
        errorMessage += `\n  Response body: ${JSON.stringify(error.body, null, 2)}`
      }

      if (error.status) {
        errorMessage += `\n  HTTP status: ${error.status}`
      }

      if (error.response) {
        errorMessage += `\n  Response: ${JSON.stringify(error.response, null, 2)}`
      }

      if (debug) {
        console.error('  Full error object:', error)
      }

      throw new Error(`FAL.ai API call failed after ${attempt + 1} attempts on model ${activeModelName}: ${errorMessage}`)
    }
  }

  // If we exhausted all retries
  throw new Error(`Failed to generate collage after ${maxRetries} attempts due to content policy violations. Try with different album images.`)
}

/**
 * Parse CLI arguments
 */
function parseArgs(args) {
  const options = {
    input: null,
    output: null,
    width: 1400,
    height: 800,
    seed: null,
    strategy: null,
    style: config.prompts?.profile || 'bold_cinematic',
    debug: false,
    help: false
  }

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--debug' || arg === '-d') {
      options.debug = true
    } else if (arg.startsWith('--input=')) {
      options.input = arg.split('=')[1]
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1]
    } else if (arg.startsWith('--width=')) {
      options.width = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--height=')) {
      options.height = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--seed=')) {
      options.seed = parseInt(arg.split('=')[1], 10)
    } else if (arg.startsWith('--strategy=')) {
      options.strategy = arg.split('=')[1]
    } else if (arg.startsWith('--style=')) {
      options.style = arg.split('=')[1]
    } else if (!arg.startsWith('--') && !options.input) {
      // First positional arg is input
      options.input = arg
    } else if (!arg.startsWith('--') && options.input && !options.output) {
      // Second positional arg is output
      options.output = arg
    }
  }

  return options
}

/**
 * Display CLI help
 */
function showHelp() {
  console.log(`
FAL.ai Collage Generator

Usage:
  node scripts/fal-collage.js [options]
  node scripts/fal-collage.js <input-folder> [output-file]

Options:
  --input=<path>      Path to folder containing album images (required)
  --output=<path>     Path to save collage PNG (default: ./test-output/fal-collage.png)
  --width=<number>    Output width in pixels (default: 1400)
  --height=<number>   Output height in pixels (default: 800)
  --seed=<number>     Random seed for reproducibility
  --strategy=<name>   Selection strategy: pop-mix, vibrant, diverse, balanced, random
  --style=<name>      Prompt style profile (default: ${config.prompts?.profile || 'editorial_photoshoot'})
  --debug, -d         Enable debug output
  --help, -h          Show this help message

Selection Strategies:
  pop-mix   - Deterministic blend of top vibrant images + color-diverse support
  vibrant   - Top images by color vibrancy (most colorful/saturated)
  diverse   - Picks images with maximum color variety
  balanced  - Mix of warm (red/orange) and cool (blue/purple) tones
  random    - Shuffled selection from top 75% of scored images

Positional Arguments:
  <input-folder>      Same as --input
  [output-file]       Same as --output

Output Files:
  The script saves TWO images:
  1. <output>.png           - Full resolution from FAL.ai (typically 2752×1536)
  2. <output>-small.png     - Resized to --width×--height (default 1400×800)

Examples:
  # Use default test folder (style/profile defaults from config)
  node scripts/fal-collage.js

  # Custom input folder
  node scripts/fal-collage.js --input=public/assets/my-albums

  # Force a specific strategy
  node scripts/fal-collage.js --input=./albums --strategy=pop-mix --debug
  node scripts/fal-collage.js --input=./albums --strategy=vibrant --debug
  node scripts/fal-collage.js --input=./albums --strategy=balanced --debug

  # Use a different style profile
  node scripts/fal-collage.js --input=./albums --style=bold_cinematic --debug

  # Custom input and output
  node scripts/fal-collage.js --input=./albums --output=./my-collage.png
  # Creates: ./my-collage.png (full res) + ./my-collage-small.png (1400×800)

  # Using positional arguments
  node scripts/fal-collage.js ./albums ./output.png

  # With debug mode and custom dimensions
  node scripts/fal-collage.js --input=./albums --debug --width=1920 --height=1080

Environment Variables:
  FAL_KEY             FAL.ai API key (required)
  DEBUG_COLLAGE       Set to "1" to enable debug mode
`)
}

/**
 * Test the FAL collage generator with CLI arguments
 */
async function testFALCollage(cliArgs = []) {
  const options = parseArgs(cliArgs)

  if (options.help) {
    showHelp()
    return
  }

  console.log('Creating FAL.ai music collage...\n')

  // Determine input folder
  let albumsFolder
  if (options.input) {
    albumsFolder = path.isAbsolute(options.input)
      ? options.input
      : path.join(process.cwd(), options.input)
  } else {
    // Default to test folder
    const baseFolder = path.join(__dirname, '..', 'public', 'assets', '2025-10-27-listened-to-this-week')
    albumsFolder = path.join(baseFolder, 'albums')
  }

  try {
    await fs.access(albumsFolder)
  } catch {
    console.error(`Albums folder not found: ${albumsFolder}`)
    console.error('\\nTip: Use --help to see usage examples')
    process.exit(1)
  }

  // Get album images
  const albumFiles = await fs.readdir(albumsFolder)
  const albumImages = albumFiles
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file) && !file.endsWith('.meta'))
    .map(file => path.join(albumsFolder, file))

  console.log(`Input folder: ${albumsFolder}`)
  console.log(`Found ${albumImages.length} album images\n`)

  if (albumImages.length === 0) {
    console.error('No album images found to process')
    console.error('Supported formats: .jpg, .jpeg, .png, .webp')
    process.exit(1)
  }

  // Determine output path
  let outputPath
  if (options.output) {
    outputPath = path.isAbsolute(options.output)
      ? options.output
      : path.join(process.cwd(), options.output)
  } else {
    const outputDir = path.join(__dirname, '..', 'test-output')
    await fs.mkdir(outputDir, { recursive: true })
    outputPath = path.join(outputDir, 'fal-collage.png')
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  // Create FAL.ai collage
  console.log('Creating FAL.ai collage...\n')

  try {
    const result = await createFALCollage(
      albumImages,
      outputPath,
      {
        width: options.width,
        height: options.height,
        seed: options.seed || 54321,
        strategy: options.strategy,
        style: options.style,
        debug: options.debug || process.env.DEBUG_COLLAGE === '1'
      }
    )

    console.log('\\n✓ FAL.ai collage complete!')
    console.log(`  Original: ${result.outputPath} (${result.originalWidth}×${result.originalHeight})`)
    console.log(`  Small:    ${result.smallOutputPath} (${options.width}×${options.height})`)
    console.log(`  Selected images: ${result.selectedImages.length}`)
    if (result.seed) {
      console.log(`  Seed: ${result.seed}`)
    }

  } catch (error) {
    console.error('\\n✗ FAL.ai collage generation failed:')
    console.error(`  ${error.message}`)
    process.exit(1)
  }
}

// Export for use in other scripts
export { createFALCollage, selectMostInterestingImages, createGridComposition, detectTextScore }

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  testFALCollage(args).catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}
