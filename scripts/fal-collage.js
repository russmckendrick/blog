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

/**
 * Analyzes album covers with GPT-4 Vision and generates a custom blending prompt
 */
async function generateSmartPrompt(imageUrls, debug = false) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      if (debug || config.debug?.logPrompts) {
        console.log('  ⚠ No OpenAI API key found, using default prompt')
      }
      return null // Will use default prompt
    }

    if (debug || config.debug?.logPrompts) {
      console.log('  Analyzing album covers with GPT-4 Vision...')
    }

    // Prepare image content for GPT-4 Vision
    const imageContent = imageUrls.map(url => ({
      type: 'image_url',
      image_url: { url }
    }))

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: config.prompts.gptVisionSystemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${imageUrls.length} album covers and create a prompt for compositing them into a cinematic music blog header.`
            },
            ...imageContent
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    })

    const generatedPrompt = response.choices[0].message.content.trim()

    if (debug || config.debug?.logPrompts) {
      console.log(`  ✓ Generated smart prompt: "${generatedPrompt}"`)
    }

    return generatedPrompt
  } catch (error) {
    if (debug || config.debug?.logPrompts) {
      console.error(`  ⚠ Failed to generate smart prompt: ${error.message}`)
    }
    return null // Fall back to default prompt
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
 * Selects the best images based on color vibrancy and low text content
 * Filters out blacklisted albums/artists
 */
async function selectMostInterestingImages(imagePaths, count = 4, debug = false) {
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

  const scores = await Promise.all(
    filteredPaths.map(imagePath => calculateImageScore(imagePath, debug))
  )

  // Sort by score descending (high score = vibrant + minimal text)
  scores.sort((a, b) => b.score - a.score)

  // Take top N
  const selected = scores.slice(0, Math.min(count, scores.length))

  if (debug || config.debug?.logScores) {
    console.log(`  Top ${selected.length} best images (vibrant + low text):`)
    selected.forEach((item, idx) => {
      const details = item.textScore !== undefined
        ? ` [color: ${item.colorScore.toFixed(1)}, text: ${item.textScore.toFixed(1)}%, final: ${item.score.toFixed(1)}]`
        : ` [score: ${item.score.toFixed(1)}]`
      console.log(`    ${idx + 1}. ${path.basename(item.path)}${details}`)
    })
  }

  return selected.map(item => item.path)
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

      // Pre-process image (crop text regions)
      const processedBuffer = await preprocessImageForCollage(imagePaths[i], false)

      // Resize to cell size
      const resizedBuffer = await sharp(processedBuffer)
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

/**
 * Creates a collage using FAL.ai Gemini 3 Pro Image model
 */
async function createFALCollage(imagePaths, outputPath, options = {}) {
  const {
    width = 1400,
    height = 800,
    seed,
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
  const maxAlbums = config.images?.maxCount || 6
  const totalAlbumsNeeded = Math.min(maxAlbums, Math.max(minAlbums, uniqueImagePaths.length))

  if (uniqueImagePaths.length < minAlbums) {
    throw new Error(`Not enough unique images (need at least ${minAlbums}, have ${uniqueImagePaths.length})`)
  }

  const maxRetries = config.retry?.maxAttempts || 3
  const allCandidates = await selectMostInterestingImages(uniqueImagePaths, uniqueImagePaths.length, debug)

  if (debug) {
    console.log(`  Strategy: Send ${totalAlbumsNeeded} individual album covers to Gemini 3 Pro model (${minAlbums}-${maxAlbums} range)`)
    console.log(`  Ranked ${allCandidates.length} images by vibrancy + text score`)
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

        // Pre-process to remove text regions
        const processedBuffer = await preprocessImageForCollage(imagePath, debug)

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

  // Generate smart prompt using GPT-4 Vision (falls back to default if unavailable)
  const defaultPrompt = config.prompts?.default || "Fuse and blend these album covers into a seamless artistic music collage. The covers should flow together organically with their colors, imagery, and textures merging and overlapping naturally. Create smooth, painterly transitions between albums where they meet - think watercolor bleeding or double exposure photography. Each album's distinctive visual elements should remain visible and recognizable, but integrated into a unified flowing composition. Remove all text and typography. The final result should look like a dreamy, cohesive artistic piece where the albums naturally blend into each other, not a grid of separate images."

  const smartPrompt = await generateSmartPrompt(uploadedUrls, debug)
  const prompt = smartPrompt || defaultPrompt

  if (debug) {
    console.log(`  Generating collage with ${uploadedUrls.length} images using Gemini 3 Pro Image...`)
    console.log(`  Using ${smartPrompt ? 'AI-generated' : 'default'} prompt`)
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
    resolution: config.output?.resolution || '2K'
  }

  if (debug) {
    console.log(`  Aspect ratio: ${aspectRatio}`)
    console.log(`  API payload:`, JSON.stringify(apiInput, null, 2))
  }

  // Retry loop for content policy violations
  const modelName = config.model?.name || "fal-ai/nano-banana-pro/edit"

  while (attempt < maxRetries) {
    try {
      // Call FAL.ai model (from config)
      if (debug) {
        console.log(`  Using model: ${modelName}`)
      }

      const result = await fal.subscribe(modelName, {
        input: apiInput,
        logs: debug,
        onQueueUpdate: (update) => {
          if (debug && update.status === "IN_PROGRESS") {
            update.logs?.map(log => log.message).forEach(msg => console.log(`  [FAL] ${msg}`))
          }
        }
      })

      if (!result.data || !result.data.images || result.data.images.length === 0) {
        throw new Error('FAL.ai Gemini 3 Pro returned no images')
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
      const buffer = Buffer.from(arrayBuffer)

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath)
      await fs.mkdir(outputDir, { recursive: true })

      // Process with Sharp to ensure exact dimensions and format
      await sharp(buffer)
        .resize(width, height, { fit: 'cover' })
        .png({ compressionLevel: 6, quality: 100 })
        .toFile(outputPath)

      console.log(`  ✓ Created FAL.ai collage with ${selectedImages.length} vibrant album covers`)

      return {
        outputPath,
        selectedImages,
        seed: result.data.seeds?.[0],
        imageUrl
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
          break
        }

        // Take as many as we can, up to maxAlbums
        selectedImages = remainingCandidates.slice(0, Math.min(maxAlbums, remainingCandidates.length))

        if (debug) {
          console.log(`  Attempt ${attempt + 1}: Selected ${selectedImages.length} albums (using ${selectedImages.length >= minAlbums ? 'enough' : 'insufficient'} images)`)
          selectedImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${path.basename(img)}`))
        }

        // Preprocess and upload new albums
        uploadedUrls = await preprocessAndUploadAlbums(selectedImages)

        // Regenerate smart prompt with new images
        const newSmartPrompt = await generateSmartPrompt(uploadedUrls, debug)
        const newPrompt = newSmartPrompt || defaultPrompt

        // Update API payload with new URLs and prompt
        apiInput.image_urls = uploadedUrls
        apiInput.prompt = newPrompt

        if (debug) {
          console.log(`  Updated API payload with ${uploadedUrls.length} album URLs`)
          console.log(`  Regenerated ${newSmartPrompt ? 'AI' : 'default'} prompt for retry`)
        }

        // Loop will retry with new albums
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

      throw new Error(`FAL.ai API call failed after ${attempt + 1} attempts: ${errorMessage}`)
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
  --debug, -d         Enable debug output
  --help, -h          Show this help message

Positional Arguments:
  <input-folder>      Same as --input
  [output-file]       Same as --output

Examples:
  # Use default test folder
  node scripts/fal-collage.js

  # Custom input folder
  node scripts/fal-collage.js --input=public/assets/my-albums

  # Custom input and output
  node scripts/fal-collage.js --input=./albums --output=./my-collage.png

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

  console.log('Creating FAL.ai music collage...\\n')

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
  console.log(`Found ${albumImages.length} album images\\n`)

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
  console.log('Creating FAL.ai collage...\\n')

  try {
    const result = await createFALCollage(
      albumImages,
      outputPath,
      {
        width: options.width,
        height: options.height,
        seed: options.seed || 54321,
        debug: options.debug || process.env.DEBUG_COLLAGE === '1'
      }
    )

    console.log('\\n✓ FAL.ai collage complete!')
    console.log(`  Output: ${result.outputPath}`)
    console.log(`  Dimensions: ${options.width}×${options.height}`)
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
