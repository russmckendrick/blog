import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { fal } from '@fal-ai/client'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Analyzes an image and calculates a color variance score
 * Higher score = more vibrant and diverse colors
 */
async function calculateColorScore(imagePath) {
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

    // Combined score: saturation (60%) + variance (40%)
    const score = (avgSaturation * 0.6) + (Math.sqrt(totalVariance) * 0.4)

    return {
      score,
      avgSaturation,
      totalVariance,
      path: imagePath
    }
  } catch (error) {
    console.error(`  Error analyzing ${path.basename(imagePath)}:`, error.message)
    return {
      score: 0,
      avgSaturation: 0,
      totalVariance: 0,
      path: imagePath
    }
  }
}

/**
 * Selects the 4 most colorful/vibrant images from a list
 */
async function selectMostInterestingImages(imagePaths, count = 4, debug = false) {
  if (debug) {
    console.log(`  Analyzing ${imagePaths.length} images for color variance...`)
  }

  const scores = await Promise.all(
    imagePaths.map(imagePath => calculateColorScore(imagePath))
  )

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score)

  // Take top N
  const selected = scores.slice(0, Math.min(count, scores.length))

  if (debug) {
    console.log(`  Top ${selected.length} most vibrant images:`)
    selected.forEach((item, idx) => {
      console.log(`    ${idx + 1}. ${path.basename(item.path)} (score: ${item.score.toFixed(2)})`)
    })
  }

  return selected.map(item => item.path)
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

    // Calculate crop area - remove top 15% and bottom 15% where text usually appears
    // Also remove left/right 5% for edge text/logos
    const cropPercentage = {
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
 * Creates a collage using FAL.ai WAN 2.5 image-to-image model
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

  // Get all candidate images sorted by color variance
  // Note: WAN 2.5 supports up to 4 images per request
  const imageCount = 4
  const maxRetries = Math.min(5, Math.floor(uniqueImagePaths.length / imageCount))
  const allCandidates = await selectMostInterestingImages(uniqueImagePaths, uniqueImagePaths.length, debug)

  if (debug) {
    console.log(`  Ranked ${allCandidates.length} images by color variance (will retry up to ${maxRetries} times if content policy issues occur)`)
  }

  let attempt = 0
  let selectedImages = []
  let uploadedUrls = []
  let contentPolicyViolation = false

  // Helper function to preprocess and upload images
  async function preprocessAndUpload(imagePaths) {
    const urls = []
    for (const imagePath of imagePaths) {
      try {
        if (debug) {
          console.log(`  Pre-processing ${path.basename(imagePath)}...`)
        }

        // Pre-process to remove text regions
        const processedBuffer = await preprocessImageForCollage(imagePath, debug)

        if (debug) {
          console.log(`  Uploading processed image...`)
        }

        const file = new File([processedBuffer], path.basename(imagePath), { type: 'image/jpeg' })
        const url = await fal.storage.upload(file)
        urls.push(url)

        if (debug) {
          console.log(`    → Uploaded: ${url}`)
        }
      } catch (error) {
        throw new Error(`Failed to process/upload ${path.basename(imagePath)}: ${error.message}`)
      }
    }
    return urls
  }

  // Select initial images (top 4 most vibrant)
  selectedImages = allCandidates.slice(0, imageCount)

  if (debug) {
    console.log(`  Attempt ${attempt + 1}: Selected ${imageCount} images:`)
    selectedImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${path.basename(img)}`))
  }

  uploadedUrls = await preprocessAndUpload(selectedImages)

  if (uploadedUrls.length === 0) {
    throw new Error('No images were successfully uploaded to FAL.ai')
  }

  // Prepare enhanced prompt for artistic transformation
  const prompt = "Create an abstract artistic collage merging these album artworks. Transform and blend the visual elements, colors, and textures from the covers into a seamless, flowing composition. Focus on the artistic imagery, color palettes, and visual motifs while completely removing all text, logos, and typography. The result should be a cohesive piece of art that captures the essence and mood of the albums without any readable elements."

  const negativePrompt = "text, typography, letters, words, logos, titles, album names, artist names, watermark, labels, signs, readable text, fonts, writing, characters, symbols, low quality, defects, harsh edges, grid layout, separate panels"

  if (debug) {
    console.log(`  Generating collage with ${uploadedUrls.length} images...`)
    console.log(`  Uploaded URLs:`)
    uploadedUrls.forEach((url, idx) => console.log(`    ${idx + 1}. ${url}`))
    console.log(`  Prompt: ${prompt}`)
    console.log(`  Negative prompt: ${negativePrompt}`)
    console.log(`  Dimensions: ${width}×${height}`)
  }

  // Prepare API request payload
  const apiInput = {
    prompt,
    image_urls: uploadedUrls,
    negative_prompt: negativePrompt,
    image_size: {
      width,
      height
    },
    num_images: 1,
    enable_safety_checker: true
  }

  // Only include seed if it's provided
  if (seed) {
    apiInput.seed = seed
  }

  if (debug) {
    console.log(`  API payload:`, JSON.stringify(apiInput, null, 2))
  }

  // Retry loop for content policy violations
  while (attempt < maxRetries) {
    try {
      // Call FAL.ai WAN 2.5 image-to-image
      const result = await fal.subscribe("fal-ai/wan-25-preview/image-to-image", {
        input: apiInput,
        logs: debug,
        onQueueUpdate: (update) => {
          if (debug && update.status === "IN_PROGRESS") {
            update.logs?.map(log => log.message).forEach(msg => console.log(`  [FAL] ${msg}`))
          }
        }
      })

      if (!result.data || !result.data.images || result.data.images.length === 0) {
        throw new Error('FAL.ai returned no images')
      }

      const imageUrl = result.data.images[0].url

      if (debug) {
        console.log(`  Generated image URL: ${imageUrl}`)
        console.log(`  Seed used: ${result.data.seeds?.[0] || 'N/A'}`)
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
        console.log(`  → Retrying with next ${imageCount} images from the ranked list...`)

        // Select next batch of images
        attempt++
        const startIndex = attempt * imageCount
        selectedImages = allCandidates.slice(startIndex, startIndex + imageCount)

        if (selectedImages.length < imageCount) {
          console.log(`  ✗ Not enough alternative images to retry (need ${imageCount}, have ${selectedImages.length})`)
          break
        }

        if (debug) {
          console.log(`  Attempt ${attempt + 1}: Selected new images:`)
          selectedImages.forEach((img, idx) => console.log(`    ${idx + 1}. ${path.basename(img)}`))
        }

        // Pre-process and upload new batch
        uploadedUrls = await preprocessAndUpload(selectedImages)

        // Update API payload with new URLs
        apiInput.image_urls = uploadedUrls

        if (debug) {
          console.log(`  Updated API payload with new image URLs`)
        }

        // Loop will retry with new images
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
export { createFALCollage, selectMostInterestingImages }

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  testFALCollage(args).catch(error => {
    console.error('Test failed:', error)
    process.exit(1)
  })
}
