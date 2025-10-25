#!/usr/bin/env node

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

// Supported image formats
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif']

// Get custom path from command line args or use defaults
const customPath = process.argv[2]
const IMAGE_DIRS = customPath
  ? [path.isAbsolute(customPath) ? customPath : path.join(ROOT_DIR, customPath)]
  : [
      path.join(ROOT_DIR, 'src/assets'),
      path.join(ROOT_DIR, 'public/assets')
    ]

// Optimization settings
const OPTIMIZE_OPTIONS = {
  jpeg: { quality: 85, progressive: true },
  png: { quality: 85, compressionLevel: 9 },
  webp: { quality: 85 },
  avif: { quality: 85 }
}

// Additional derivative profiles that get generated alongside the optimized original
const DERIVATIVE_PROFILES = [
  {
    name: 'card',
    suffix: '-card',
    width: 900,
    height: 506,
    format: 'avif',
    quality: 72,
    match: (filePath, metadata) =>
      metadata.width >= 1000 || /blog-cover/i.test(path.basename(filePath))
  }
]

/**
 * Generate derivative assets (like pre-cropped card art) alongside the primary image
 */
async function generateDerivatives(imagePath, metadata) {
  const outputs = []

  for (const profile of DERIVATIVE_PROFILES) {
    if (!profile.match(imagePath, metadata)) continue

    const { dir, name } = path.parse(imagePath)
    const outputPath = path.join(dir, `${name}${profile.suffix}.${profile.format}`)

    try {
      const derivative = sharp(imagePath)
        .resize(profile.width, profile.height, {
          fit: 'cover',
          position: 'attention'
        })
        .toFormat(profile.format, {
          quality: profile.quality
        })

      await derivative.toFile(outputPath)
      const stats = await fs.stat(outputPath)

      outputs.push({
        path: outputPath,
        profile: profile.name,
        size: stats.size
      })
    } catch (error) {
      console.error(`Error generating ${profile.name} derivative for ${imagePath}:`, error.message)
    }
  }

  return outputs
}

/**
 * Recursively find all image files in a directory
 */
async function findImages(dir) {
  const images = []

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        images.push(...await findImages(fullPath))
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (IMAGE_EXTENSIONS.includes(ext)) {
          images.push(fullPath)
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error.message)
  }

  return images
}

/**
 * Optimize a single image in place
 */
async function optimizeImage(imagePath) {
  const ext = path.extname(imagePath).toLowerCase()
  const stats = await fs.stat(imagePath)
  const originalSize = stats.size

  try {
    let image = sharp(imagePath)
    const metadata = await image.metadata()

    // Resize if image is wider than 1500px
    const maxWidth = 1500
    let resized = false
    if (metadata.width > maxWidth) {
      image = image.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      resized = true
    }

    // Choose optimization based on format
    let optimized
    if (ext === '.jpg' || ext === '.jpeg') {
      optimized = image.jpeg(OPTIMIZE_OPTIONS.jpeg)
    } else if (ext === '.png') {
      optimized = image.png(OPTIMIZE_OPTIONS.png)
    } else if (ext === '.webp') {
      optimized = image.webp(OPTIMIZE_OPTIONS.webp)
    } else if (ext === '.avif') {
      optimized = image.avif(OPTIMIZE_OPTIONS.avif)
    } else {
      return null // Skip unsupported formats
    }

    // Write to temporary file first
    const tempPath = `${imagePath}.tmp`
    await optimized.toFile(tempPath)

    // Check new file size
    const tempStats = await fs.stat(tempPath)
    const newSize = tempStats.size
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(2)

    // Only replace if we saved space
    if (newSize < originalSize) {
      await fs.rename(tempPath, imagePath)
      const derivatives = await generateDerivatives(imagePath, metadata)
      return {
        path: imagePath,
        originalSize,
        newSize,
        savings: `${savings}%`,
        dimensions: `${metadata.width}x${metadata.height}`,
        resized,
        derivatives
      }
    } else {
      // Remove temp file if optimization didn't help
      await fs.unlink(tempPath)
      const derivatives = await generateDerivatives(imagePath, metadata)
      return {
        path: imagePath,
        originalSize,
        newSize: originalSize,
        savings: '0%',
        skipped: true,
        dimensions: `${metadata.width}x${metadata.height}`,
        resized,
        derivatives
      }
    }
  } catch (error) {
    console.error(`Error optimizing ${imagePath}:`, error.message)
    return null
  }
}

/**
 * Format bytes for display
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Main function
 */
async function main() {
  if (customPath) {
    console.log(`🔍 Finding images in ${customPath}...\n`)
  } else {
    console.log('🔍 Finding images to optimize...\n')
  }

  const allImages = []
  for (const dir of IMAGE_DIRS) {
    const images = await findImages(dir)
    allImages.push(...images)
  }

  if (allImages.length === 0) {
    console.log('No images found to optimize.')
    return
  }

  console.log(`Found ${allImages.length} images\n`)
  console.log('🔧 Optimizing images...\n')

  const results = []
  let totalOriginalSize = 0
  let totalNewSize = 0
  let optimizedCount = 0
  let skippedCount = 0

  for (let i = 0; i < allImages.length; i++) {
    const imagePath = allImages[i]
    const relativePath = path.relative(ROOT_DIR, imagePath)

    process.stdout.write(`[${i + 1}/${allImages.length}] ${relativePath}... `)

    const result = await optimizeImage(imagePath)

    if (result) {
      results.push(result)
      totalOriginalSize += result.originalSize
      totalNewSize += result.newSize

      const resizeInfo = result.resized ? ' [resized]' : ''

    const derivativeInfo = result.derivatives && result.derivatives.length > 0
      ? ` + ${result.derivatives.map((derivative) => `${derivative.profile} (${formatBytes(derivative.size)})`).join(', ')}`
      : ''

    if (result.skipped) {
      console.log(`✓ Already optimal (${result.dimensions})${resizeInfo}${derivativeInfo}`)
      skippedCount++
    } else {
      console.log(`✓ Saved ${result.savings} (${result.dimensions})${resizeInfo}${derivativeInfo}`)
      optimizedCount++
    }
    } else {
      console.log('✗ Failed')
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Optimization Summary')
  console.log('='.repeat(60))
  console.log(`Total images processed: ${allImages.length}`)
  console.log(`Optimized: ${optimizedCount}`)
  console.log(`Already optimal: ${skippedCount}`)
  console.log(`Failed: ${allImages.length - results.length}`)
  console.log(`\nOriginal size: ${formatBytes(totalOriginalSize)}`)
  console.log(`New size: ${formatBytes(totalNewSize)}`)

  if (totalOriginalSize > 0) {
    const totalSavings = ((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(2)
    const savedBytes = totalOriginalSize - totalNewSize
    console.log(`Total saved: ${formatBytes(savedBytes)} (${totalSavings}%)`)
  }

  console.log('='.repeat(60))
  console.log('\n✨ Optimization complete!')
}

main().catch(console.error)
