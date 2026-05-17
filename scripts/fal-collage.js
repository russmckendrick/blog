import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import { lookupAlbumData } from './lib/text-utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const LANES = ['auto', 'documentary', 'still_life', 'architecture', 'portrait', 'abstract', 'surreal']
const GENERATION_LANES = LANES.filter(lane => lane !== 'auto')

const LEGACY_STYLE_TO_LANE = {
  rotate: 'auto',
  editorial_photoshoot: 'documentary',
  bold_cinematic: 'documentary',
  studio_session: 'portrait',
  retro_vinyl: 'still_life',
  miniature_diorama: 'architecture',
  collage_cutout: 'abstract',
  pop_art: 'abstract',
  painted_mural: 'abstract',
  surreal_dreamscape: 'surreal'
}

const LANE_DIRECTIVES = {
  documentary: 'grounded editorial photography, a believable real-world music-adjacent location, observed detail, natural human scale, restrained drama',
  still_life: 'a composed studio still life of objects, surfaces, fabrics, instruments, paper, light, and texture, no people unless essential',
  architecture: 'a striking built environment, interior, venue, street, or impossible architectural space shaped by the week music mood',
  portrait: 'one distinctive portrait or small group portrait with editorial styling, strong character, and controlled lighting',
  abstract: 'graphic abstraction using color, rhythm, texture, shapes, and material cues rather than literal album-cover objects',
  surreal: 'one dreamlike but coherent scene with impossible scale or atmosphere, controlled weirdness, and a clear focal idea'
}

const NEGATIVE_TERMS = [
  'album covers',
  'record sleeves',
  'square cover panels',
  'grid layout',
  'pasted cutouts',
  'cluttered montage',
  'floating disconnected objects',
  'readable text',
  'typography',
  'logos',
  'watermarks',
  'duplicate faces',
  'cloned people',
  'generic concert crowd',
  'glowing portal',
  'fireballs',
  'muddy low contrast'
]

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function hashSeed(seed) {
  let h = Math.abs(Number(seed) || 0) | 0
  h = ((h >>> 16) ^ h) * 0x45d9f3b | 0
  h = ((h >>> 16) ^ h) * 0x45d9f3b | 0
  h = (h >>> 16) ^ h
  return Math.abs(h)
}

function normalizeLane(rawLane = 'auto') {
  const normalized = String(rawLane || 'auto').trim().toLowerCase().replace(/-/g, '_')
  const lane = LEGACY_STYLE_TO_LANE[normalized] || normalized
  if (!LANES.includes(lane)) {
    throw new Error(`Unknown cover lane "${rawLane}". Available lanes: ${LANES.join(', ')}`)
  }
  return lane
}

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
  const { maxCount = 10, primaryCount = 6, debug = false } = options
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

function compactAlbumContext(topAlbums = [], collectionInfo = null, limit = 14) {
  return topAlbums.slice(0, limit).map((entry, index) => {
    const [[artist, album], plays] = entry
    const albumData = collectionInfo ? lookupAlbumData(artist, album, collectionInfo) : null
    return {
      rank: index + 1,
      artist,
      album,
      plays,
      genres: albumData?.genres || [],
      release_year: albumData?.release_year || null
    }
  })
}

function compactArtistContext(topArtists = [], limit = 12) {
  return topArtists.slice(0, limit).map(([artist, plays], index) => ({
    rank: index + 1,
    artist,
    plays
  }))
}

function inferAlbumContextFromFiles(imagePaths) {
  return imagePaths.map((imagePath, index) => ({
    rank: index + 1,
    artist: null,
    album: path.basename(imagePath, path.extname(imagePath)).replace(/-/g, ' '),
    plays: null,
    genres: [],
    release_year: null
  }))
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

function normalizeBrief(rawBrief, fallbackLane) {
  const lane = normalizeLane(rawBrief?.lane || fallbackLane)
  const resolvedLane = lane === 'auto' ? fallbackLane : lane

  return {
    lane: resolvedLane,
    concept: String(rawBrief?.concept || 'a distinctive music-led editorial scene').trim(),
    setting: String(rawBrief?.setting || 'an atmospheric music-adjacent location shaped by the uploaded source art').trim(),
    hero_subject: String(rawBrief?.hero_subject || 'one clear visual focal point').trim(),
    visual_motifs: Array.isArray(rawBrief?.visual_motifs)
      ? rawBrief.visual_motifs.map(item => String(item).trim()).filter(Boolean).slice(0, 6)
      : [],
    palette: Array.isArray(rawBrief?.palette)
      ? rawBrief.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    composition: String(rawBrief?.composition || 'wide 16:9 composition with one strong focal area and enough breathing room for a blog card crop').trim(),
    lighting: String(rawBrief?.lighting || 'clear shaped light with visible shadow detail').trim(),
    mood: String(rawBrief?.mood || 'curious, energetic, and specific to this week').trim(),
    avoid: Array.isArray(rawBrief?.avoid)
      ? rawBrief.avoid.map(item => String(item).trim()).filter(Boolean).slice(0, 8)
      : []
  }
}

async function readRecentCoverMemory(dateStr, limit = 8) {
  if (!dateStr) return []

  const tunesDir = path.join(PROJECT_ROOT, 'src', 'content', 'tunes')
  let entries
  try {
    entries = await fs.readdir(tunesDir)
  } catch {
    return []
  }

  const posts = []
  for (const entry of entries) {
    const match = entry.match(/^(\d{4}-\d{2}-\d{2})-listened-to-this-week\.mdx$/)
    if (!match || match[1] >= dateStr) continue

    try {
      const content = await fs.readFile(path.join(tunesDir, entry), 'utf-8')
      const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1] || ''
      const description = content.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1] || ''
      posts.push({ date: match[1], title, description })
    } catch {
      // Ignore unreadable old posts.
    }
  }

  return posts
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}

function fallbackLane(seed) {
  return GENERATION_LANES[hashSeed(seed || Date.now()) % GENERATION_LANES.length]
}

function buildFallbackBrief(context, selectedAnalyses, requestedLane, seed) {
  const lane = requestedLane === 'auto' ? fallbackLane(seed) : requestedLane
  const albumNames = context.albums.slice(0, 4).map(item => item.album).filter(Boolean)
  const palette = selectedAnalyses
    .slice(0, 4)
    .map(item => `rgb(${item.color.r}, ${item.color.g}, ${item.color.b})`)

  return normalizeBrief({
    lane,
    concept: `an interpreted scene for a week led by ${albumNames.join(', ') || 'the selected albums'}`,
    setting: 'a music-adjacent editorial environment that borrows colour, texture, and mood from the source artwork without showing the covers',
    hero_subject: 'one clear symbolic focal subject drawn from the strongest shared mood in the albums',
    visual_motifs: albumNames,
    palette,
    composition: 'wide 16:9 frame, one focal subject, asymmetrical supporting details, no visible album-cover layout',
    lighting: 'clean directional light with readable detail and a polished editorial finish',
    mood: context.summary || context.title || 'distinctive, musical, and visually specific',
    avoid: ['album-cover grid', 'pasted montage', 'readable typography']
  }, lane)
}

async function createArtBrief({ imageUrls, context, requestedLane, selectedAnalyses, seed, debug }) {
  if (!openai) {
    if (debug) {
      console.log('  No OPENAI_API_KEY found; using deterministic art brief')
    }
    return buildFallbackBrief(context, selectedAnalyses, requestedLane, seed)
  }

  const directorLane = requestedLane === 'auto'
    ? 'Choose the best lane from documentary, still_life, architecture, portrait, abstract, surreal.'
    : `Use the "${requestedLane}" lane.`

  const metadata = {
    date: context.dateStr || null,
    week_number: context.weekNumber || null,
    title: context.title || null,
    summary: context.summary || null,
    top_artists: context.artists,
    top_albums: context.albums,
    recent_covers: context.recentCoverMemory
  }

  const instructions = `You are the art director for weekly music blog covers.
Return only valid JSON with this schema: {"lane":"documentary|still_life|architecture|portrait|abstract|surreal","concept":"string","setting":"string","hero_subject":"string","visual_motifs":["string"],"palette":["string"],"composition":"string","lighting":"string","mood":"string","avoid":["string"]}.
${directorLane}
Create an interpreted scene, not a collage. Analyze the uploaded album artwork for mood, palette, materials, subjects, era cues, and visual rhythm, but do not ask the image model to display album covers as objects.
Avoid repeating recent cover grammar, especially central glowing portals, generic concert crowds, pasted panels, busy surreal stages, and floating disconnected objects.
Be specific, concise, and practical for image generation.`

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
              text: `Return JSON only. Weekly tunes metadata:\n${JSON.stringify(metadata, null, 2)}`
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
      max_output_tokens: 900,
      temperature: 0.65
    })

    const brief = normalizeBrief(parseJSONResponse(response.output_text || ''), requestedLane === 'auto' ? fallbackLane(seed) : requestedLane)

    if (debug) {
      console.log(`  Art brief: ${JSON.stringify(brief, null, 2)}`)
    }

    return brief
  } catch (error) {
    console.warn(`  OpenAI art brief failed: ${error.message}`)
    return buildFallbackBrief(context, selectedAnalyses, requestedLane, seed)
  }
}

function buildGenerationPrompt(brief, sourceImageCount) {
  const laneDirective = LANE_DIRECTIVES[brief.lane] || LANE_DIRECTIVES.documentary
  const motifs = brief.visual_motifs.length > 0 ? brief.visual_motifs.join(', ') : 'subtle visual motifs from the uploaded source art'
  const palette = brief.palette.length > 0 ? brief.palette.join(', ') : 'a palette sampled from the uploaded artwork'
  const avoid = [...NEGATIVE_TERMS, ...brief.avoid].filter(Boolean).join(', ')

  return [
    'Create one distinctive 16:9 editorial music blog header as an interpreted scene.',
    `${brief.concept}.`,
    `Use the ${brief.lane} lane: ${laneDirective}.`,
    `Set it in ${brief.setting}.`,
    `The clear focal subject is ${brief.hero_subject}.`,
    `Borrow these transformed visual cues from the uploaded album art: ${motifs}.`,
    `Use ${palette} as the color direction.`,
    `Composition: ${brief.composition}.`,
    `Lighting: ${brief.lighting}.`,
    `Mood: ${brief.mood}.`,
    `Use the ${sourceImageCount} uploaded album images as research material only: interpret their mood, era, palette, shapes, materials, and a few motifs into a new unified scene.`,
    'Do not show album covers, record sleeves, square panels, a grid, pasted cutouts, or a visible collage layout.',
    'No readable text, typography, logos, watermarks, duplicated faces, or cloned people.',
    `Avoid: ${avoid}.`,
    'High quality, crisp, polished, visually memorable, with enough negative space to work as a responsive blog card crop.'
  ].join(' ').replace(/\s+/g, ' ').trim()
}

function smallOutputPathFor(outputPath) {
  const actualExt = path.extname(outputPath)
  const ext = actualExt || '.png'
  const base = actualExt ? outputPath.slice(0, outputPath.length - actualExt.length) : outputPath
  return `${base}-small${ext}`
}

function isContentPolicyViolation(error) {
  return Boolean(error?.body?.detail?.some?.(detail => detail.type === 'content_policy_violation'))
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

async function createFALCollage(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed = Date.now(),
    debug = process.env.DEBUG_COLLAGE === '1',
    topArtists = [],
    topAlbums = [],
    collectionInfo = null,
    title = '',
    summary = '',
    dateStr = null,
    weekNumber = null,
    recentCoverMemory = null
  } = options

  const requestedLane = normalizeLane(options.lane || options.style || 'auto')
  if (options.style && !options.lane) {
    console.log(`  Deprecated --style alias received; mapped "${options.style}" to lane "${requestedLane}"`)
  }

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for tunes cover generation')
  }
  fal.config({ credentials: falKey })

  const { selectedPaths, analyses } = await selectCoverInputs(imagePaths, {
    maxCount: Number(process.env.TUNES_COVER_MAX_INPUTS || 10),
    primaryCount: Number(process.env.TUNES_COVER_PRIMARY_INPUTS || 6),
    debug
  })

  const context = {
    dateStr,
    weekNumber,
    title,
    summary,
    artists: compactArtistContext(topArtists),
    albums: topAlbums.length > 0
      ? compactAlbumContext(topAlbums, collectionInfo)
      : inferAlbumContextFromFiles(selectedPaths),
    recentCoverMemory: recentCoverMemory || await readRecentCoverMemory(dateStr)
  }

  const minCount = Math.min(2, selectedPaths.length)
  const attemptSets = buildAttemptSets(
    selectedPaths,
    analyses,
    Number(process.env.TUNES_COVER_MAX_INPUTS || 10),
    minCount
  )

  const modelName = process.env.FAL_TUNES_COVER_MODEL || 'fal-ai/nano-banana-2/edit'
  const fallbackModelName = process.env.FAL_TUNES_COVER_FALLBACK_MODEL || ''
  let activeModelName = modelName
  let usedFallbackModel = false

  for (let attempt = 0; attempt < attemptSets.length; attempt++) {
    const attemptPaths = attemptSets[attempt]

    try {
      if (debug) {
        console.log(`  Attempt ${attempt + 1}: generating interpreted cover with ${attemptPaths.length} album inputs`)
      }

      const imageUrls = await uploadAlbumImages(attemptPaths, debug)
      const selectedAnalyses = analyses.filter(item => attemptPaths.includes(item.path))
      const brief = await createArtBrief({
        imageUrls,
        context,
        requestedLane,
        selectedAnalyses,
        seed,
        debug
      })
      const prompt = buildGenerationPrompt(brief, imageUrls.length)

      if (debug) {
        console.log(`  Lane: ${brief.lane}`)
        console.log(`  Prompt: ${prompt}`)
      }

      const input = {
        prompt,
        image_urls: imageUrls,
        aspect_ratio: '16:9',
        num_images: 1,
        output_format: 'png',
        resolution: '2K',
        enable_web_search: false,
        seed
      }

      const result = await fal.subscribe(activeModelName, {
        input,
        logs: debug,
        onQueueUpdate: update => {
          if (debug && update.status === 'IN_PROGRESS') {
            update.logs?.map(log => log.message).forEach(message => console.log(`  [FAL] ${message}`))
          }
        }
      })

      const imageUrl = result.data?.images?.[0]?.url
      if (!imageUrl) {
        throw new Error('FAL.ai returned no image URL')
      }

      const saved = await saveGeneratedImage(imageUrl, outputPath, width, height, debug)
      console.log(`  Created interpreted tunes cover using lane "${brief.lane}"`)
      console.log(`    Full:  ${saved.outputPath}`)
      console.log(`    Small: ${saved.smallOutputPath}`)

      return {
        ...saved,
        selectedImages: attemptPaths,
        imageUrl,
        model: activeModelName,
        lane: brief.lane,
        prompt
      }
    } catch (error) {
      if (isContentPolicyViolation(error) && attempt < attemptSets.length - 1) {
        console.warn(`  Content policy violation on attempt ${attempt + 1}; retrying with alternate album inputs`)
        continue
      }

      const canFallback = !usedFallbackModel && fallbackModelName && fallbackModelName !== activeModelName
      if (canFallback) {
        usedFallbackModel = true
        activeModelName = fallbackModelName
        console.warn(`  Primary FAL model failed; retrying with fallback model ${fallbackModelName}`)
        attempt = -1
        continue
      }

      let message = error.message
      if (error.body) message += `\nResponse body: ${JSON.stringify(error.body, null, 2)}`
      throw new Error(`Tunes cover generation failed using ${activeModelName}: ${message}`)
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
    style: null,
    title: '',
    summary: '',
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
    else if (arg.startsWith('--lane=')) options.lane = arg.slice('--lane='.length)
    else if (arg.startsWith('--style=')) options.style = arg.slice('--style='.length)
    else if (arg.startsWith('--title=')) options.title = arg.slice('--title='.length)
    else if (arg.startsWith('--summary=')) options.summary = arg.slice('--summary='.length)
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

Creates interpreted AI cover images for weekly tunes posts.

Usage:
  node scripts/fal-collage.js --input=<albums-folder> --output=<cover.png> [options]
  node scripts/fal-collage.js <albums-folder> <cover.png> [options]

Options:
  --lane=<name>       Creative lane: ${LANES.join(', ')} (default: auto)
  --style=<name>      Deprecated alias for --lane; old profile names are mapped
  --output=<path>     Output PNG path (also writes <name>-small.png)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Deterministic seed
  --title=<text>      Optional tunes post title for art direction
  --summary=<text>    Optional tunes post summary for art direction
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Uses OPENAI_API_KEY when available to build an art brief from album art and metadata.
  - The output is an interpreted scene, not an album-cover collage.
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

  console.log('Generating interpreted tunes cover')
  console.log(`  Input: ${inputFolder}`)
  console.log(`  Output: ${outputPath}`)
  console.log(`  Lane: ${options.lane || options.style || 'auto'}`)

  await createFALCollage(imagePaths, outputPath, {
    width: options.width,
    height: options.height,
    seed: options.seed || Date.now(),
    lane: options.lane,
    style: options.style,
    title: options.title,
    summary: options.summary,
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
  LANES,
  createFALCollage,
  detectTextScore,
  normalizeLane,
  selectCoverInputs,
  smallOutputPathFor
}
