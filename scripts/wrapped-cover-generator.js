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
 * @param {string[]} imageUrls - Array of uploaded album image URLs
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
          content: `You are a professional photo compositor creating a prompt for a cinematic music blog header. Analyze the visual elements in these album covers (people, faces, buildings, objects, colors, patterns), then write a prompt that creates ONE unified photographic scene using these elements.

CRITICAL CONCEPT:
- Do NOT describe positioning album covers themselves
- INSTEAD: Extract subjects/elements from the covers and blend them into a new unified scene
- Think: "Take the people from cover A, the building from cover B, the colors from cover C, and composite them into one cinematic image"
- The result should be a single cohesive photograph, not visible album covers

Your prompt MUST:
- Identify specific visual elements (e.g., 'the portrait from the yellow cover', 'the building from the blue cover')
- Describe how to composite these ELEMENTS into one unified scene
- Use photographic techniques: double-exposure, color grading, composite layers, blend modes
- Create a cohesive color palette across the entire scene
- Result should look like a movie poster or editorial photo, not album covers

Your prompt MUST NOT:
- Reference positioning album covers ('the first cover', 'stack the covers')
- Use grid/arrangement language
- Use painterly terms: watercolor, brushstrokes, mural
- Describe album covers as objects - describe their CONTENTS as subjects`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these ${imageUrls.length} album covers and create a prompt for compositing them into a cinematic music blog header.

Format: Write 2-3 sentences. Identify the key visual elements from each cover, describe how to composite them into ONE unified cinematic scene, specify color treatment. End with 'Remove all text and typography except "${year}" which should appear as large centered text that is stylistically integrated into the artwork - using colors, lighting effects, or subtle glow that matches the overall composition.'`
            },
            ...imageContent
          ]
        }
      ],
      max_tokens: 500,
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
  return `Extract the key visual elements from these album covers - the people, faces, buildings, objects, and patterns - and composite them into a single cinematic scene. Blend these elements together using photographic double-exposure and color grading to create one unified image, not separate album covers. The result should be a cohesive photographic composition where all the subjects and visual elements coexist in the same scene, similar to a movie poster or editorial photo montage. Remove all text and typography except "${year}" which should appear as large centered text that is stylistically integrated into the artwork - using colors, lighting effects, or subtle glow that matches the overall composition.`
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
 * @param {string[]} albumImagePaths - Paths to top album images
 * @param {string} outputPath - Where to save the final cover
 * @param {Object} options - Generation options
 */
export async function generateWrappedCover(albumImagePaths, outputPath, options = {}) {
  const { year = new Date().getFullYear(), debug = false } = options

  if (!process.env.FAL_KEY) {
    throw new Error('FAL_KEY environment variable is required')
  }

  // Configure FAL client
  fal.config({
    credentials: process.env.FAL_KEY
  })

  console.log(`  Creating year-end wrapped cover for ${year}...`)

  // Select top 12 album images (matches weekly tunes config)
  const selectedAlbums = albumImagePaths.slice(0, 12)

  console.log(`  Using ${selectedAlbums.length} album images (from ${albumImagePaths.length} available)`)

  // Upload all images to FAL.ai
  console.log('  Uploading images to FAL.ai...')
  const albumUrls = await uploadImages(selectedAlbums, debug)

  if (albumUrls.length === 0) {
    throw new Error('No images were successfully uploaded')
  }

  console.log(`  Uploaded ${albumUrls.length} album images`)

  // Generate year-end prompt using GPT-4 Vision
  const prompt = await generateYearEndPrompt(albumUrls, year)

  // Generate AI cover
  await generateAICover(prompt, albumUrls, outputPath, { debug })

  return outputPath
}

export default generateWrappedCover
