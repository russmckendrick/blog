import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import {
  saveGeneratedImage,
  isContentPolicyViolation,
  humanizeImageName
} from './fal-tunes-cover.js'
import { ConfigLoader } from './lib/config-loader.js'
import { getBackend, BACKENDS } from './lib/image-backends/index.js'
import { appendHistory, recentConcepts, writeSidecar } from './lib/tunes-image-history.js'
import {
  buildArtistGenerationPrompt,
  designArtistArtDirection,
  summarizeArtistPhotos
} from './lib/tunes-artist-art-direction.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '..')

const DEFAULT_BACKEND = 'nano-banana-pro'
const MIN_TIMESTAMP_SEED = 604800000

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
  if (backend && (backend.maxInputImages ?? 1) > 1) return backend

  if (backend) {
    console.warn(`  Backend "${backend.id}" only accepts one input image and cannot compose a group; falling back to ${DEFAULT_BACKEND}`)
  } else {
    console.warn(`  Unknown image backend "${requested}"; falling back to ${DEFAULT_BACKEND}`)
  }
  return BACKENDS[DEFAULT_BACKEND]
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

// Resolve how many artists to cast (featureCount) and how many candidates to upload.
// Precedence: env -> explicit option -> tunes-config.yaml -> code default. The config tier
// matters: the weekly generator passes options explicitly, but the regenerate harness and
// direct CLI runs do not, and they must still honour settings.artist_portrait_inputs.
async function resolveCastCounts(options) {
  let configInputs
  let configCandidates
  try {
    const config = new ConfigLoader()
    await config.load()
    configInputs = config.getArtistPortraitInputs()
    configCandidates = config.getArtistPortraitCandidates()
  } catch {
    // fall through to code defaults
  }

  return {
    featureCount: Number(process.env.TUNES_ARTIST_PORTRAIT_INPUTS || options.inputs || configInputs || 4),
    candidateCount: Number(process.env.TUNES_ARTIST_PORTRAIT_CANDIDATES || options.candidates || configCandidates || 12)
  }
}

// The portrait PNG lives in public/assets/, which Astro deploys verbatim - a sidecar next
// to it would publish the run metadata (prompts, casting inputs) at a live URL. Mirror it
// into src/assets/<same subpath> instead, beside the cover's sidecar; outputs anywhere else
// keep the sidecar alongside the image.
function sidecarTargetFor(outputPath) {
  const publicAssets = path.join(PROJECT_ROOT, 'public', 'assets') + path.sep
  if (outputPath.startsWith(publicAssets)) {
    return path.join(PROJECT_ROOT, 'src', 'assets', outputPath.slice(publicAssets.length))
  }
  return outputPath
}

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

async function createFALArtistPortrait(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed = Date.now(),
    debug = process.env.DEBUG_COLLAGE === '1',
    recordHistory = false
  } = options

  const falKey = process.env.FAL_KEY
  if (!falKey) {
    throw new Error('FAL_KEY environment variable is required for artist portrait generation')
  }
  fal.config({ credentials: falKey })

  const { featureCount, candidateCount } = await resolveCastCounts(options)
  const historySize = await resolveHistorySize()
  const avoidConcepts = await recentConcepts('artist', historySize)
  if (debug) {
    if (options.hint) console.log(`  Author's steer: ${options.hint}`)
    if (avoidConcepts.length > 0) console.log(`  Avoiding recent concepts: ${avoidConcepts.join(' | ')}`)
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

  // Upload a wider candidate pool for factual analysis, then let the separate art-direction
  // stage cast the most interesting subset. The image backend anchors on every reference it
  // is handed, so only the selected original photos are attached to the final call.
  const candidatePaths = uniquePaths.slice(0, Math.max(1, candidateCount))
  const castSize = Math.min(Math.max(1, featureCount), candidatePaths.length)
  if (debug) {
    console.log(`  Casting from ${candidatePaths.length} candidate photo(s); featuring exactly ${castSize}`)
    console.log(`  Image backend: ${backend.label} (${backend.id})`)
  }

  const candidateUrls = await uploadArtistImages(candidatePaths, debug)
  const sourceReferences = buildSourceReferences(candidatePaths)
  const artistSummaries = await summarizeArtistPhotos({
    imageUrls: candidateUrls,
    sourceReferences,
    debug
  })
  const artDirection = await designArtistArtDirection({
    artistSummaries,
    sourceReferences,
    imageUrls: candidateUrls,
    featureCount: castSize,
    hint: options.hint,
    avoidConcepts,
    debug
  })
  if (debug) {
    const locationPath = candidatePaths[artDirection.locationSource - 1]
    console.log(
      `  Location anchor: source ${artDirection.locationSource} (${path.basename(locationPath || 'unknown')})`
    )
    console.log(`    Setting: ${artDirection.locationSetting}`)
    console.log(`    Evidence: ${artDirection.locationEvidence}`)
  }

  // Resolve the cast: map selected source numbers back to candidates and retain only those
  // original photos for the final multi-reference generation call.
  const bySource = new Map(candidatePaths.map((p, i) => [
    i + 1,
    { source: i + 1, path: p, url: candidateUrls[i] }
  ]))
  let cast = artDirection.selection
    .map(source => bySource.get(source))
    .filter(Boolean)
    .slice(0, castSize)
  if (cast.length === 0) {
    cast = candidatePaths.slice(0, castSize).map((p, i) => ({
      source: i + 1,
      path: p,
      url: candidateUrls[i]
    }))
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
      const selectedSources = attemptCast.map(item => item.source)
      const prompt = buildArtistGenerationPrompt(artDirection, selectedSources)

      if (debug) {
        console.log(`  Prompt: ${prompt}`)
      }

      const { imageUrl, model } = await backend.generate({ imageUrls, prompt, seed, debug })

      const saved = await saveGeneratedImage(imageUrl, outputPath, width, height, debug)
      console.log(`  Created tunes artist portrait (${backend.label}) from ${attemptCast.length} artist photos`)
      console.log(`    Direction: ${artDirection.creativeDirection}`)
      console.log(`    Full:  ${saved.outputPath}`)
      console.log(`    Small: ${saved.smallOutputPath}`)

      const runRecord = {
        version: 2,
        date: options.dateLabel || (Number.isFinite(seed) && seed >= MIN_TIMESTAMP_SEED ? new Date(seed).toISOString().slice(0, 10) : ''),
        type: 'artist',
        lane: null,
        lighting: null,
        shootDirection: null,
        colourTreatment: null,
        concept: artDirection.concept,
        creativeDirection: artDirection.creativeDirection,
        scene: artDirection.scene,
        locationSource: artDirection.locationSource,
        locationSetting: artDirection.locationSetting,
        locationEvidence: artDirection.locationEvidence,
        locationReference: selectedSources.indexOf(artDirection.locationSource) + 1,
        locationInput: path.basename(bySource.get(artDirection.locationSource)?.path || ''),
        cast: artDirection.cast,
        selection: artDirection.selection,
        palette: artDirection.palette,
        mood: artDirection.mood,
        artistSummaries,
        hint: options.hint || null,
        composeBackend: backend.id,
        model,
        prompt,
        inputs: attemptCast.map(item => path.basename(item.path))
      }

      try {
        const sidecarPath = await writeSidecar(sidecarTargetFor(outputPath), runRecord)
        if (debug) console.log(`  Wrote run sidecar: ${sidecarPath}`)
        if (recordHistory) await appendHistory(runRecord)
      } catch (error) {
        console.warn(`  Could not record portrait metadata: ${error.message}`)
      }

      return {
        ...saved,
        selectedImages: attemptCast.map(item => item.path),
        imageUrl,
        model,
        backend: backend.id,
        creativeDirection: artDirection.creativeDirection,
        concept: artDirection.concept,
        locationSource: artDirection.locationSource,
        locationSetting: artDirection.locationSetting,
        locationEvidence: artDirection.locationEvidence,
        locationInput: bySource.get(artDirection.locationSource)?.path || '',
        artistSummaries,
        mode: 'summaries_to_prompt',
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
    else if (arg.startsWith('--hint=')) options.hint = arg.slice('--hint='.length)
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
  --output=<path>     Output PNG path (also writes <name>-small.png and <name>.json)
  --width=<px>        Small output width (default: 1400)
  --height=<px>       Small output height (default: 800)
  --seed=<number>     Image backend seed
  --hint=<string>     Optional author steer for the AI art director
  --record            Append this run to scripts/.tunes-image-history.json (the
                      weekly generator records automatically; manual runs opt in)
  --debug, -d         Verbose output
  --help, -h          Show this help

Notes:
  - Requires FAL_KEY.
  - Requires OPENAI_API_KEY for factual photo research. Artist research fails closed
    after one retry; set TUNES_ARTIST_ALLOW_DEGRADED_SUMMARIES=1 only to explicitly
    allow filename-based fallback summaries.
  - Uses two separate OpenAI passes when OPENAI_API_KEY is available: factual photo
    summaries first, then casting and photographic art direction using those findings
    plus the candidate photos to anchor the scene to their strongest visible location.
  - OPENAI_TUNES_ARTIST_SUMMARY_MODEL and OPENAI_TUNES_ARTIST_DIRECTION_MODEL can
    override the two prompt stages; OPENAI_TUNES_ARTIST_MODEL is their shared fallback.
  - Uploads the top TUNES_ARTIST_PORTRAIT_CANDIDATES artists (default 12) as casting
    options, then features about TUNES_ARTIST_PORTRAIT_INPUTS of them (default 4) - only
    the cast is rendered, keeping the group uncrowded.
  - The image backend (nano-banana-pro, gpt-image-2, or nano-banana) is chosen by
    settings.artist_portrait_backend in scripts/tunes-config.yaml.
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
  createFALArtistPortrait
}
