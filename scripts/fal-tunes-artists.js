import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import {
  saveGeneratedImage,
  parseJSONResponse,
  isContentPolicyViolation,
  humanizeImageName,
  NEGATIVE_TERMS
} from './fal-tunes-cover.js'
import { ConfigLoader } from './lib/config-loader.js'
import { getBackend, BACKENDS } from './lib/image-backends/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_BACKEND = 'nano-banana'

// Resolve the image backend: explicit option first, then the tunes-config.yaml switch, then the
// default. Unknown ids warn and fall back. The backends themselves live in lib/image-backends/
// and are generic - only the config key and default below are artist-portrait specific.
async function resolveBackend(explicit) {
  let requested = explicit
  if (!requested) {
    try {
      const config = new ConfigLoader()
      await config.load()
      requested = config.getArtistPortraitBackend()
    } catch {
      requested = DEFAULT_BACKEND
    }
  }

  const backend = getBackend(requested)
  if (backend) return backend

  console.warn(`  Unknown image backend "${requested}"; falling back to ${DEFAULT_BACKEND}`)
  return BACKENDS[DEFAULT_BACKEND]
}

// The artist photos are already real portraits of real people. We want one believable
// group photograph, so on top of the shared negatives (text, grids, illustration) we steer
// hard against the failure modes of multi-face composites: invented extras, duplicated or
// blended faces, and warped likenesses.
const ARTIST_NEGATIVE_TERMS = [
  ...NEGATIVE_TERMS,
  'extra people',
  'background crowd',
  'duplicated faces',
  'cloned faces',
  'merged faces',
  'blended faces',
  'morphed features',
  'distorted faces',
  'deformed hands',
  'extra limbs'
]

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

function buildSourceReferences(imagePaths) {
  return imagePaths.map((imagePath, index) => ({
    source: index + 1,
    filename: path.basename(imagePath),
    artist: humanizeImageName(imagePath)
  }))
}

// Unlike the album cover upload, never centre-crop - that slices heads off. Fit the whole
// portrait inside a square and let the model keep the full face.
async function uploadArtistImages(imagePaths, debug = false) {
  const urls = []

  for (const imagePath of imagePaths) {
    const buffer = await sharp(imagePath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
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

function normalizeArtistDescriptions(rawArtists = [], sourceReferences = []) {
  const artists = Array.isArray(rawArtists) ? rawArtists : []
  const normalized = artists
    .map((item, index) => {
      const source = Number(item?.source || item?.source_index || item?.image || index + 1)
      const description = String(item?.description || item?.summary || item?.appearance || '').trim()
      if (!description) return null
      return {
        source: Number.isFinite(source) && source > 0 ? source : index + 1,
        description
      }
    })
    .filter(Boolean)
    .slice(0, 10)

  if (normalized.length > 0) return normalized

  return sourceReferences.map(reference => ({
    source: reference.source,
    description: `${reference.artist} (from reference ${reference.source})`
  }))
}

function normalizeArtistBrief(rawBrief, sourceReferences = []) {
  return {
    artists: normalizeArtistDescriptions(rawBrief?.artists || rawBrief?.people, sourceReferences),
    setting: String(
      rawBrief?.setting ||
      rawBrief?.scene ||
      'a warm, softly lit photographer\'s studio with a simple backdrop'
    ).trim(),
    wardrobe: String(rawBrief?.wardrobe || rawBrief?.styling || '').trim(),
    palette: Array.isArray(rawBrief?.palette)
      ? rawBrief.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    mood: String(rawBrief?.mood || 'relaxed, confident, music-led').trim()
  }
}

function buildFallbackArtistBrief(sourceReferences) {
  return normalizeArtistBrief({
    setting: 'a warm, softly lit photographer\'s studio with a simple textured backdrop, arranged like a relaxed group portrait',
    wardrobe: 'each artist in their own everyday stage-or-street style',
    palette: [],
    mood: 'relaxed, confident, music-led'
  }, sourceReferences)
}

async function createArtistBrief({ imageUrls, sourceReferences, debug }) {
  if (!openai) {
    if (debug) {
      console.log('  No OPENAI_API_KEY found; using deterministic artist brief')
    }
    return buildFallbackArtistBrief(sourceReferences)
  }

  const instructions = `You are a portrait photographer's art director planning ONE group portrait photograph for a music blog.
You will receive several reference photos, each showing one musician. Work in two steps and return only valid JSON.
Step 1 - read each photo: for EACH reference describe the person's concrete, photographable appearance so they stay recognisable - approximate age, build, skin tone, hair (length, colour, style), facial hair, glasses, and signature wardrobe vibe or era. Describe only what is visible. Never invent identities and never mention names or text.
Step 2 - design the shoot: choose ONE believable physical setting, lighting, and overall styling where these specific musicians would plausibly be photographed together as a single relaxed group portrait - all in the same room, same light, same moment. They should look posed or candid together like a real group photo, not cut out and pasted side by side.
The final image is a real PHOTOREALISTIC photograph. Do not describe it as an illustration, painting, or render.
Return JSON exactly as: {"artists":[{"source":1,"description":"string"}],"setting":"string","wardrobe":"string","palette":["string"],"mood":"string"}.
"setting" is a vivid sentence or two describing the location, framing, and lighting of the group portrait. "wardrobe" is a short note on how the group is styled. "palette" is 3-5 colours. "mood" is the emotional tone.`

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
              text: `Return JSON only. First describe each of the ${imageUrls.length} musicians in the reference photos, then design one cohesive group portrait setting where they are all photographed together.`
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
      temperature: 0.7
    })

    const brief = normalizeArtistBrief(parseJSONResponse(response.output_text || ''), sourceReferences)

    if (debug) {
      console.log(`  Artist brief: ${JSON.stringify(brief, null, 2)}`)
    }

    return brief
  } catch (error) {
    console.warn(`  OpenAI artist brief failed: ${error.message}`)
    return buildFallbackArtistBrief(sourceReferences)
  }
}

function buildArtistPrompt(brief, sourceImageCount) {
  const wardrobe = brief.wardrobe ? ` Styling: ${brief.wardrobe}.` : ''
  const palette = brief.palette.length > 0 ? brief.palette.join(', ') : 'a natural, true-to-life palette'
  const avoid = ARTIST_NEGATIVE_TERMS.join(', ')

  return [
    `Create one original, photorealistic 16:9 group portrait photograph of exactly the ${sourceImageCount} people shown in the reference images, together in a single shared setting.`,
    `Setting: ${brief.setting}.${wardrobe}`,
    'Keep every person clearly recognisable and faithful to their reference photo - preserve each face, skin tone, hair, facial hair, glasses, and overall likeness. Each reference person must appear exactly once.',
    'Arrange them naturally as one cohesive group - standing or seated close together in the same room, same moment, same light, like a real posed or candid group photo. Not separate cut-outs floating side by side, and never a grid, row, or panel of squares.',
    'Render photorealistically: real skin texture, natural cinematic studio lighting, true-to-life depth of field, captured as if shot on a professional full-frame camera. This is a real photograph, not an illustration, drawing, painting, cartoon, or render.',
    `Colour direction: ${palette}.`,
    `Mood: ${brief.mood}.`,
    'Do not add any extra people beyond the reference subjects. Do not duplicate, merge, blend, or distort faces.',
    'Do not include any text, letters, words, numbers, captions, titles, logos, watermarks, or signage anywhere in the image.',
    `Avoid: ${avoid}.`,
    'Photorealistic, sharp, cinematic, high quality, flattering, with real depth and a strong sense of place.'
  ].join(' ').replace(/\s+/g, ' ').trim()
}

async function createFALArtistPortrait(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed = Date.now(),
    debug = process.env.DEBUG_COLLAGE === '1'
  } = options

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for artist portrait generation')
  }
  fal.config({ credentials: falKey })

  const maxInputs = Number(process.env.TUNES_ARTIST_PORTRAIT_INPUTS || 6)

  // De-duplicate, keep play-rank order, then take the strongest N. No colour/text scoring -
  // artist order is play-rank and faces should not be dropped on colour.
  const seen = new Set()
  const uniquePaths = []
  for (const imagePath of imagePaths) {
    const key = path.basename(imagePath).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!seen.has(key)) {
      seen.add(key)
      uniquePaths.push(imagePath)
    }
  }

  if (uniquePaths.length === 0) {
    throw new Error('No artist images provided for portrait generation')
  }

  const selectedPaths = uniquePaths.slice(0, Math.max(1, maxInputs))

  if (debug) {
    console.log(`  Selected ${selectedPaths.length} artist photo(s):`)
    selectedPaths.forEach((item, index) => {
      console.log(`    ${index + 1}. ${path.basename(item)}`)
    })
  }

  const backend = await resolveBackend(options.backend)
  if (debug) {
    console.log(`  Image backend: ${backend.label} (${backend.id})`)
  }

  // Each attempt drops one more low-ranked artist, so a content-policy refusal can retry
  // with a smaller, simpler group rather than failing outright.
  const attemptSets = []
  for (let count = selectedPaths.length; count >= Math.min(2, selectedPaths.length); count--) {
    attemptSets.push(selectedPaths.slice(0, count))
  }

  for (let attempt = 0; attempt < attemptSets.length; attempt++) {
    const attemptPaths = attemptSets[attempt]

    try {
      if (debug) {
        console.log(`  Attempt ${attempt + 1}: generating group portrait from ${attemptPaths.length} artist photos`)
      }

      const imageUrls = await uploadArtistImages(attemptPaths, debug)
      const sourceReferences = buildSourceReferences(attemptPaths)
      const brief = await createArtistBrief({ imageUrls, sourceReferences, debug })
      const prompt = buildArtistPrompt(brief, imageUrls.length)

      if (debug) {
        console.log(`  Prompt: ${prompt}`)
      }

      const { imageUrl, model } = await backend.generate({ imageUrls, prompt, seed, debug })

      const saved = await saveGeneratedImage(imageUrl, outputPath, width, height, debug)
      console.log(`  Created tunes artist portrait (${backend.label}) from ${attemptPaths.length} artist photos`)
      console.log(`    Full:  ${saved.outputPath}`)
      console.log(`    Small: ${saved.smallOutputPath}`)

      return {
        ...saved,
        selectedImages: attemptPaths,
        imageUrl,
        model,
        backend: backend.id,
        mode: 'artist_portrait',
        prompt
      }
    } catch (error) {
      if (isContentPolicyViolation(error) && attempt < attemptSets.length - 1) {
        console.warn(`  Content policy violation on attempt ${attempt + 1}; retrying with a smaller group`)
        continue
      }

      let message = error.message
      if (error.body) message += `\nResponse body: ${JSON.stringify(error.body, null, 2)}`
      throw new Error(`Artist portrait generation failed using ${backend.label}: ${message}`)
    }
  }

  throw new Error('Artist portrait generation failed after all attempts')
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
    else if (!arg.startsWith('--') && !options.input) options.input = arg
    else if (!arg.startsWith('--') && !options.output) options.output = arg
    else throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

async function findLatestArtistsFolder() {
  const publicAssetsDir = path.join(PROJECT_ROOT, 'public', 'assets')
  const entries = await fs.readdir(publicAssetsDir, { withFileTypes: true })
  const latest = entries
    .filter(entry => entry.isDirectory() && entry.name.endsWith('-listened-to-this-week'))
    .map(entry => entry.name)
    .sort()
    .reverse()[0]

  return latest ? path.join(publicAssetsDir, latest, 'artists') : null
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
Tunes Artist Portrait Generator

Creates one photorealistic group portrait for weekly tunes posts from the downloaded
artist photos, keeping each artist recognisable from their reference image.

Usage:
  node scripts/fal-tunes-artists.js --input=<artists-folder> --output=<portrait.png> [options]
  node scripts/fal-tunes-artists.js <artists-folder> <portrait.png> [options]

Options:
  --output=<path>     Output PNG path (also writes <name>-small.png)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Deterministic seed
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Uses OPENAI_API_KEY when available to describe each artist and design one cohesive
    group portrait setting. Falls back to a deterministic brief without it.
  - Includes the top TUNES_ARTIST_PORTRAIT_INPUTS artists (default 6) by input order.
  - The image backend (gpt-image-2 or nano-banana) is chosen by settings.artist_portrait_backend
    in scripts/tunes-config.yaml.
`)
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }

  const defaultInputFolder = options.input || await findLatestArtistsFolder()
  if (!defaultInputFolder) {
    throw new Error('No input folder supplied and no listened-to-this-week artists folder found')
  }
  const inputFolder = path.resolve(defaultInputFolder)

  const outputPath = path.resolve(options.output || path.join(PROJECT_ROOT, 'test-output', 'tunes-artists.png'))
  const imagePaths = await readInputImages(inputFolder)
  if (imagePaths.length === 0) {
    throw new Error(`No artist images found in ${inputFolder}`)
  }

  console.log('Generating tunes artist portrait')
  console.log(`  Input: ${inputFolder}`)
  console.log(`  Output: ${outputPath}`)

  await createFALArtistPortrait(imagePaths, outputPath, {
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
  createFALArtistPortrait
}
