/**
 * AI-powered Year Wrapped Cover Generator
 * Uploads individual artist and album images to FAL.ai for blending into a stylized cover
 */

import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fal } from '@fal-ai/client'
import dotenv from 'dotenv'
import OpenAI from 'openai'

// Load environment variables
dotenv.config()

// Initialize OpenAI client
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

/**
 * Pre-process an image for upload (crop edges to remove text)
 * @param {string} imagePath - Path to the image
 * @returns {Promise<Buffer>} Processed JPEG buffer
 */
async function preprocessImage(imagePath) {
  const image = sharp(imagePath)
  const metadata = await image.metadata()

  const { width: origWidth, height: origHeight } = metadata

  // Crop 15% from top/bottom (where text usually appears) and 5% from sides
  const cropTop = Math.floor(origHeight * 0.15)
  const cropBottom = Math.floor(origHeight * 0.15)
  const cropLeft = Math.floor(origWidth * 0.05)
  const cropRight = Math.floor(origWidth * 0.05)

  const cropWidth = origWidth - cropLeft - cropRight
  const cropHeight = origHeight - cropTop - cropBottom

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
}

/**
 * Upload images to FAL.ai storage
 * @param {string[]} imagePaths - Array of image paths
 * @param {boolean} debug - Enable debug logging
 * @returns {Promise<string[]>} Array of uploaded URLs
 */
async function uploadImages(imagePaths, debug = false) {
  const urls = []

  for (const imagePath of imagePaths) {
    try {
      const processedBuffer = await preprocessImage(imagePath)
      const file = new File([processedBuffer], path.basename(imagePath), { type: 'image/jpeg' })
      const url = await fal.storage.upload(file)
      urls.push(url)

      if (debug) {
        console.log(`    Uploaded: ${path.basename(imagePath)} → ${url}`)
      }
    } catch (error) {
      console.error(`  Warning: Could not upload ${path.basename(imagePath)}: ${error.message}`)
    }
  }

  return urls
}

/**
 * Generate a year-end themed prompt using GPT-4 Vision
 * @param {string[]} imageUrls - Array of uploaded image URLs
 * @param {number} year - The year for the wrapped
 * @returns {Promise<string>} Generated prompt
 */
async function generateYearEndPrompt(imageUrls, year) {
  if (!openai) {
    console.log('  Using default year-end prompt (no OpenAI API key)')
    return getDefaultPrompt(year)
  }

  try {
    console.log('  Analyzing images with GPT-4 Vision...')

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
          content: `You are an expert at analyzing images and creating detailed image generation prompts.
Your task is to CAREFULLY LOOK AT each image provided and describe what you see in detail.
You must reference SPECIFIC visual elements, colors, subjects, and styles from the actual images.
Do NOT generate generic prompts - your output must prove you analyzed the images.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Look carefully at these ${imageUrls.length} album and artist images from my ${year} music listening.

FIRST, analyze each image and note:
- The dominant colors and color palette
- The main subjects (people, objects, abstract elements)
- The artistic style (photographic, illustrated, abstract, etc.)
- Any distinctive visual elements or motifs

THEN, create a detailed image generation prompt that:
1. SPECIFICALLY describes how to blend these exact images together
2. References the actual colors you see (e.g., "deep blues from image 1 bleeding into the warm oranges of image 3")
3. Describes the actual subjects/people/elements from the images and how they should merge
4. Creates artistic transitions between the specific visual styles present

IMPORTANT: The text "${year}" MUST appear prominently in the final image. Integrate it naturally into the composition - perhaps formed from light, smoke, paint, or as stylized typography that complements the artwork.

Your prompt MUST mention specific visual elements from at least 6 of the 10 images.
Your prompt MUST explicitly include instructions to display "${year}" in the image.
The prompt should read like you're describing a specific artwork, not a generic template.

Return ONLY the image generation prompt (no analysis or explanation).
Keep it under 250 words to avoid API errors.`
            },
            ...imageContent
          ]
        }
      ],
      max_tokens: 400,
      temperature: 0.8
    })

    const prompt = response.choices[0].message.content.trim()
    console.log(`  Generated prompt:\n    "${prompt}"`)
    return prompt
  } catch (error) {
    console.error(`  Warning: GPT-4 Vision failed: ${error.message}`)
    return getDefaultPrompt(year)
  }
}

/**
 * Get default year-end prompt
 */
function getDefaultPrompt(year) {
  return `Fuse and blend these artist and album images into a seamless artistic music collage.
The images should flow together organically with their colors, imagery, and textures merging and overlapping naturally.
Create smooth, painterly transitions between images where they meet - think watercolor bleeding or double exposure photography.
Integrate the text "${year}" organically into the artwork - formed from paint strokes, light trails, smoke, or emerging naturally from the visual elements. The year should feel like part of the art, not an overlay.
Add subtle musical elements like vinyl textures and sound waves woven throughout.
Preserve the visual essence and color palettes from the original album artwork.
The final result should look like a dreamy, cohesive artistic piece celebrating this year in music.
Professional album artwork style, highly detailed, cinematic lighting.
Do NOT include celebration themes like fireworks, confetti, or champagne.
Do NOT place the year as simple text on top - it must be integrated into the imagery.`
}

/**
 * Generate AI cover using FAL.ai with multiple input images
 * @param {string} prompt - Image generation prompt
 * @param {string[]} imageUrls - Array of uploaded image URLs
 * @param {string} outputPath - Where to save the generated image
 * @param {Object} options - Generation options
 */
async function generateAICover(prompt, imageUrls, outputPath, options = {}) {
  const { debug = false } = options

  console.log('  Generating AI cover with FAL.ai...')

  // Use the image-to-image model
  const modelName = 'fal-ai/nano-banana-pro/edit'

  if (debug) {
    console.log(`  Using model: ${modelName}`)
    console.log(`  Input images: ${imageUrls.length}`)
    console.log(`  Prompt: "${prompt}"`)
  }

  const result = await fal.subscribe(modelName, {
    input: {
      prompt: prompt,
      image_urls: imageUrls,
      aspect_ratio: '16:9',
      num_images: 1,
      output_format: 'png',
      resolution: '2K'
    },
    logs: debug,
    onQueueUpdate: (update) => {
      if (debug && update.status === 'IN_PROGRESS') {
        update.logs?.map(log => log.message).forEach(msg => console.log(`  [FAL] ${msg}`))
      }
    }
  })

  if (!result.data?.images?.[0]?.url) {
    throw new Error('No image generated from FAL.ai')
  }

  // Download and save the generated image
  const imageUrl = result.data.images[0].url

  if (debug) {
    console.log(`  Generated image URL: ${imageUrl}`)
  }

  const response = await fetch(imageUrl)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Get original dimensions
  const originalMetadata = await sharp(buffer).metadata()

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  // Resize to exact dimensions and save
  await sharp(buffer)
    .resize(1400, 800, { fit: 'cover' })
    .png()
    .toFile(outputPath)

  console.log(`  ✓ AI cover saved to: ${outputPath}`)
  if (debug) {
    console.log(`    Original: ${originalMetadata.width}×${originalMetadata.height}`)
    console.log(`    Resized to: 1400×800`)
  }

  return outputPath
}

/**
 * Main function to generate wrapped cover
 * @param {string[]} artistImagePaths - Paths to top artist images
 * @param {string[]} albumImagePaths - Paths to top album images
 * @param {string} outputPath - Where to save the final cover
 * @param {Object} options - Generation options
 */
export async function generateWrappedCover(artistImagePaths, albumImagePaths, outputPath, options = {}) {
  const { year = new Date().getFullYear(), debug = false } = options

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required')
  }

  // Configure FAL client
  fal.config({
    credentials: process.env.FAL_KEY
  })

  console.log(`  Creating year-end wrapped cover for ${year}...`)

  // Select top 5 of each type (10 total) for best AI generation results
  const selectedArtists = artistImagePaths.slice(0, 5)
  const selectedAlbums = albumImagePaths.slice(0, 5)

  console.log(`  Using ${selectedArtists.length} artist images and ${selectedAlbums.length} album images (from ${artistImagePaths.length} artists, ${albumImagePaths.length} albums available)`)

  // Upload all images to FAL.ai
  console.log('  Uploading images to FAL.ai...')
  const artistUrls = await uploadImages(selectedArtists, debug)
  const albumUrls = await uploadImages(selectedAlbums, debug)

  const allUrls = [...artistUrls, ...albumUrls]

  if (allUrls.length === 0) {
    throw new Error('No images were successfully uploaded')
  }

  console.log(`  Uploaded ${allUrls.length} images total`)

  // Generate year-end prompt using GPT-4 Vision
  const prompt = await generateYearEndPrompt(allUrls, year)

  // Generate AI cover
  await generateAICover(prompt, allUrls, outputPath, { debug })

  return outputPath
}

export default generateWrappedCover
