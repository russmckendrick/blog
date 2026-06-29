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

// Left to its own devices the model keeps designing the same warm industrial-loft band
// promo every week. We pick one of these realistic shoot directions by the week's seed and
// hand it to the art director, so each week commits to a genuinely different kind of photo
// (location, light, era, framing) while still reading as a believable group photograph.
const SHOOT_DIRECTIONS = [
  'a candid city-street editorial at golden hour, shot wide with long evening shadows',
  'a sunlit rooftop overlooking a skyline, open sky behind the group, bright natural light',
  'a backstage documentary moment before a show - corridors, flight cases, hard practical lighting',
  'a daytime rehearsal room with amps and cables, flat honest daylight from a side window',
  'inside a record shop surrounded by crates and racks of vinyl, warm interior light',
  'a windswept coastal seafront under an overcast sky, muted natural light, sea behind them',
  'a neon-lit night street, wet pavement reflections, mixed colourful artificial light',
  'a minimal high-key studio against a clean white background, soft even light, modern fashion-editorial framing',
  '1970s film-grain interior with wood panelling and warm tungsten light, vintage styling',
  'a glass greenhouse or conservatory full of plants, soft diffused daylight, green tones',
  'a warehouse performance stage lit by coloured concert lighting, atmospheric haze',
  'a park or woodland clearing in flat green daylight, relaxed outdoor framing',
  'a retro diner or cafe booth, large windows, warm afternoon light spilling across the table',
  'a graffiti-covered back alley, gritty urban texture, directional daylight'
]

const MS_PER_WEEK = 604800000

// The seed is the post date as epoch-milliseconds. Weekly post dates are exactly one
// MS_PER_WEEK apart, and MS_PER_WEEK is divisible by 14, so a plain `seed % length` maps
// EVERY week to the same scene (they all share the same residue). Bucketing by
// weeks-since-epoch instead advances the index by one each week, so the direction cycles
// through the whole list. Small non-timestamp seeds (e.g. a CLI --seed for testing) fall
// back to a direct modulo so they still vary.
function pickShootDirection(seed) {
  const value = Math.abs(Math.trunc(Number.isFinite(seed) ? seed : 0))
  const bucket = value >= MS_PER_WEEK ? Math.floor(value / MS_PER_WEEK) : value
  return SHOOT_DIRECTIONS[bucket % SHOOT_DIRECTIONS.length]
}

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

function normalizeArtistBrief(rawBrief, sourceReferences = [], varietyHint = '') {
  const fallbackScene = varietyHint
    ? `the group photographed together in ${varietyHint}, each artist in their own everyday stage-or-street style`
    : 'the group photographed together in a warm, softly lit room, each artist in their own everyday stage-or-street style'

  const rawSelection = rawBrief?.selection || rawBrief?.cast || rawBrief?.choose
  const selection = Array.isArray(rawSelection)
    ? [...new Set(rawSelection.map(item => Number(item?.source ?? item)).filter(n => Number.isInteger(n) && n > 0))]
    : []

  return {
    artists: normalizeArtistDescriptions(rawBrief?.artists || rawBrief?.people, sourceReferences),
    selection,
    scene: String(
      rawBrief?.scene ||
      rawBrief?.setting ||
      rawBrief?.concept ||
      fallbackScene
    ).trim(),
    palette: Array.isArray(rawBrief?.palette)
      ? rawBrief.palette.map(item => String(item).trim()).filter(Boolean).slice(0, 5)
      : [],
    mood: String(rawBrief?.mood || 'relaxed, confident, music-led, with bright saturated colour').trim()
  }
}

function buildFallbackArtistBrief(sourceReferences, varietyHint = '') {
  return normalizeArtistBrief({ palette: [], mood: 'relaxed, confident, music-led, with bright saturated colour' }, sourceReferences, varietyHint)
}

async function createArtistBrief({ imageUrls, sourceReferences, debug, varietyHint = '', featureCount = 6 }) {
  if (!openai) {
    if (debug) {
      console.log('  No OPENAI_API_KEY found; using deterministic artist brief')
    }
    return buildFallbackArtistBrief(sourceReferences, varietyHint)
  }

  const directionLine = varietyHint
    ? `This week, lean into this shoot direction and commit to it fully: ${varietyHint}. Adapt it so it suits this particular group, but do not fall back to a generic studio or industrial-loft band promo.`
    : 'Pick a fresh, specific kind of shoot - vary the location type, era, time of day, lighting, and framing. Avoid defaulting to a generic studio or industrial-loft band promo.'

  const instructions = `You are a portrait photographer's art director and casting director planning ONE group photograph for a music blog.
You will receive ${imageUrls.length} numbered reference photos; each shows one musical act (a solo artist or a band). Work in three steps and return only valid JSON.
Step 1 - read each photo: for EACH reference give a SHORT one-sentence description of the recognisable people in it - approximate age, build, skin tone, hair, facial hair, glasses, and wardrobe vibe. Describe only what is visible. Never invent identities and never mention names or text.
Step 2 - cast the shoot: choose the most visually interesting and varied people to actually feature, so the final photo is an intimate, well-composed group of about ${featureCount} people - NOT a crowd. Strongly favour solo artists and single striking individuals; where you do pick a band, mentally feature only its one or two most recognisable members. Return the chosen reference numbers in "selection" (about ${featureCount} of them, in the order they should read across the frame).
Step 3 - author the shoot: write ONE vivid paragraph describing a single shared real-world scene where ONLY the selected people are photographed together - same place, same light, same moment, like a real posed or candid group photo, not cut out and pasted side by side. ${directionLine} Cover the location, framing, time of day, lighting, and how the group is styled. Keep the cast small and uncrowded.
The final image is a real PHOTOREALISTIC photograph. Do not describe it as an illustration, painting, or render.
Return JSON exactly as: {"artists":[{"source":1,"description":"string"}],"selection":[1,2],"scene":"string","palette":["string"],"mood":"string"}.
"selection" is the reference numbers you cast (about ${featureCount}). "scene" is a vivid paragraph describing the photograph of just those people. "palette" is 3-5 colours, pushed bright and saturated - favour vivid, luminous colour over muted or washed-out tones. "mood" is the emotional tone.`

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
              text: `Return JSON only. There are ${imageUrls.length} reference photos. Describe each, cast about ${featureCount} of the most interesting people into "selection", then author one cohesive scene featuring only those selected people.`
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

    const brief = normalizeArtistBrief(parseJSONResponse(response.output_text || ''), sourceReferences, varietyHint)

    if (debug) {
      console.log(`  Artist brief: ${JSON.stringify(brief, null, 2)}`)
    }

    return brief
  } catch (error) {
    console.warn(`  OpenAI artist brief failed: ${error.message}`)
    return buildFallbackArtistBrief(sourceReferences, varietyHint)
  }
}

function buildArtistPrompt(brief, sourceImageCount) {
  const avoid = ARTIST_NEGATIVE_TERMS.join(', ')

  return [
    `Create one original, photorealistic 16:9 group photograph that brings together the musicians shown across the ${sourceImageCount} reference images into a single shared real-world scene.`,
    `Scene: ${brief.scene}`,
    'Keep every person clearly recognisable and faithful to their reference photo - preserve each face, skin tone, hair, facial hair, glasses, and overall likeness. Do not invent anyone who is not in the reference photos.',
    'Keep this an intimate, well-composed group, not a crowd. Where a reference photo shows a band, feature only its one or two most recognisable members rather than every member.',
    'Arrange them naturally within the scene as one connected group sharing the same moment and light, like a real posed or candid group photo. Not separate cut-outs floating side by side, and never a grid, row, or panel of squares.',
    'Render photorealistically: real skin texture, true-to-life lighting and depth of field, captured as if shot on a professional camera. This is a real photograph, not an illustration, drawing, painting, cartoon, or render.',
    brief.palette.length > 0 ? `Colour direction: ${brief.palette.join(', ')} - rendered bright, vivid, and richly saturated with luminous highlights and punchy contrast, never muted, dull, or washed out.` : '',
    brief.mood ? `Mood: ${brief.mood}.` : '',
    'Do not add any extra people beyond the reference subjects. Do not duplicate, merge, blend, or distort faces.',
    'Do not include any text, letters, words, numbers, captions, titles, logos, watermarks, or signage anywhere in the image.',
    `Avoid: ${avoid}.`,
    'Photorealistic, sharp, high quality, flattering, vibrant and colour-rich, with real depth and a strong sense of place.'
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
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

  const featureCount = Number(process.env.TUNES_ARTIST_PORTRAIT_INPUTS || options.inputs || 6)
  const candidateCount = Number(process.env.TUNES_ARTIST_PORTRAIT_CANDIDATES || options.candidates || 12)
  const varietyHint = pickShootDirection(seed)
  if (debug) {
    console.log(`  Lean into this direction: ${varietyHint}`)
  }

  // De-duplicate, keep play-rank order.
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

  const backend = await resolveBackend(options.backend)

  // Upload a wider candidate pool, then let the brief cast the most interesting subset. The
  // image backend anchors on every reference it is handed, so only the cast is rendered -
  // this keeps the group small and stops it crowding into a band-photo of everyone.
  const candidatePaths = uniquePaths.slice(0, Math.max(1, candidateCount))
  if (debug) {
    console.log(`  Casting from ${candidatePaths.length} candidate photo(s); featuring about ${featureCount}`)
    console.log(`  Image backend: ${backend.label} (${backend.id})`)
  }

  const candidateUrls = await uploadArtistImages(candidatePaths, debug)
  const sourceReferences = buildSourceReferences(candidatePaths)
  const brief = await createArtistBrief({ imageUrls: candidateUrls, sourceReferences, debug, varietyHint, featureCount })

  // Resolve the cast: map the brief's selected reference numbers back to candidates, cap at
  // featureCount, and fall back to the top play-ranked candidates if nothing usable came back.
  const bySource = new Map(candidatePaths.map((p, i) => [i + 1, { path: p, url: candidateUrls[i] }]))
  let cast = brief.selection
    .map(source => bySource.get(source))
    .filter(Boolean)
    .slice(0, Math.max(1, featureCount))
  if (cast.length === 0) {
    cast = candidatePaths.slice(0, Math.max(1, featureCount)).map((p, i) => ({ path: p, url: candidateUrls[i] }))
  }

  if (debug) {
    console.log(`  Cast ${cast.length} artist photo(s):`)
    cast.forEach((item, index) => {
      console.log(`    ${index + 1}. ${path.basename(item.path)}`)
    })
  }

  // Each attempt drops one more cast member, so a content-policy refusal can retry with a
  // smaller, simpler group rather than failing outright. Upload and casting are already done.
  const attemptSets = []
  for (let count = cast.length; count >= Math.min(2, cast.length); count--) {
    attemptSets.push(cast.slice(0, count))
  }

  for (let attempt = 0; attempt < attemptSets.length; attempt++) {
    const attemptCast = attemptSets[attempt]

    try {
      if (debug) {
        console.log(`  Attempt ${attempt + 1}: generating group portrait from ${attemptCast.length} cast photos`)
      }

      const imageUrls = attemptCast.map(item => item.url)
      const prompt = buildArtistPrompt(brief, imageUrls.length)

      if (debug) {
        console.log(`  Prompt: ${prompt}`)
      }

      const { imageUrl, model } = await backend.generate({ imageUrls, prompt, seed, debug })

      const saved = await saveGeneratedImage(imageUrl, outputPath, width, height, debug)
      console.log(`  Created tunes artist portrait (${backend.label}) from ${attemptCast.length} artist photos`)
      console.log(`    Full:  ${saved.outputPath}`)
      console.log(`    Small: ${saved.smallOutputPath}`)

      return {
        ...saved,
        selectedImages: attemptCast.map(item => item.path),
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
  - Uses OPENAI_API_KEY when available to describe each artist, cast the most interesting
    subset, and author the full scene for that week's photo. Falls back without it.
  - Each week leans into a different shoot direction (location, light, era, framing),
    chosen by the seed, so the portraits vary week to week.
  - Uploads the top TUNES_ARTIST_PORTRAIT_CANDIDATES artists (default 12) as casting
    options, then features about TUNES_ARTIST_PORTRAIT_INPUTS of them (default 6) - only
    the cast is rendered, keeping the group uncrowded.
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
