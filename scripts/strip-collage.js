import sharp from 'sharp'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Creates a collage with horizontal torn paper strips
 */
async function createStripCollage(imagePaths, outputPath, options = {}) {
 const {
    width = 1400,
    height = 800,
    seed = Date.now(),
    debug = process.env.DEBUG_COLLAGE === '1'
  } = options

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
    throw new Error('No unique album images provided to createStripCollage')
  }

  const albumCount = uniqueImagePaths.length

  // Seeded random
  let randomSeed = seed
  const random = () => {
    randomSeed = (randomSeed * 9301 + 49297) % 233280
    return randomSeed / 233280
  }

  // Color palette - vibrant and varied
  const colorPalettes = [
    [[255, 50, 100], [100, 200, 255], [255, 200, 50], [150, 100, 255], [50, 255, 150]],
    [[255, 100, 200], [100, 255, 200], [255, 200, 100], [200, 100, 255], [100, 200, 50]],
    [[255, 150, 0], [0, 200, 255], [255, 50, 150], [100, 255, 100], [200, 100, 255]],
    [[255, 0, 100], [0, 255, 200], [255, 200, 0], [100, 150, 255], [255, 100, 150]]
  ]

  const palette = colorPalettes[Math.floor(random() * colorPalettes.length)]

  // Create OVERSIZED canvas with padding on all sides to ensure full coverage
  // We'll crop it down to exact size at the end
  const padding = Math.round(Math.max(width, height) * 0.3)
  const canvasWidth = width + (padding * 2)
  const canvasHeight = height + (padding * 2)

  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })

  const composites = []

  // Calculate VERTICAL strips - dynamically adjust width based on available images
  // If we have fewer images, make strips MUCH wider to ensure FULL coverage (NO BLACK SHOWING!)
  const baseStripWidth = albumCount <= 3 ? 400 : (albumCount <= 5 ? 280 : (albumCount <= 8 ? 180 : 120))
  const stripVariation = albumCount <= 3 ? 250 : (albumCount <= 5 ? 200 : (albumCount <= 8 ? 160 : 140))

  const strips = []

  // Start left of the padded crop window so rotations have room to breathe
  let currentX = -padding

  const overlap = albumCount <= 5 ? 100 : 60

  while (currentX < canvasWidth + padding) {
    const stripWidth = baseStripWidth + Math.floor(random() * stripVariation)
    const rotation = -4 + random() * 8 // Slight rotation for torn effect
    const color = palette[Math.floor(random() * palette.length)]

    strips.push({
      x: currentX,
      width: stripWidth,
      rotation,
      color
    })

    currentX += stripWidth - overlap
  }

  // Choose the window of strips that best covers the crop (left margin + full width)
  const usableStripCount = Math.min(strips.length, albumCount)
  let bestStart = 0
  let bestScore = Number.POSITIVE_INFINITY
  for (let start = 0; start <= strips.length - usableStripCount; start++) {
    const first = strips[start]
    const last = strips[start + usableStripCount - 1]
    const coverage = (last.x + last.width) - first.x
    const coverageShortfall = Math.max(0, width - coverage)
    const leftShortfall = Math.max(0, -padding - first.x)
    const score = coverageShortfall * 2 + leftShortfall
    if (score < bestScore) {
      bestScore = score
      bestStart = start
      if (score === 0) break
    }
  }

  const limitedStrips = strips.slice(bestStart, bestStart + usableStripCount)
  const xReference = limitedStrips.length > 0 ? limitedStrips[0].x : 0

  if (debug) {
    console.log(`  Creating ${limitedStrips.length} strips (NO DUPLICATES - limited by ${albumCount} available albums)`)
  }

  // Shuffle images - each will be used exactly once
  const shuffledImages = [...uniqueImagePaths].sort(() => random() - 0.5)

  // Process each VERTICAL strip - one unique album per strip
  for (let i = 0; i < limitedStrips.length; i++) {
    const strip = limitedStrips[i]

    try {
      // Use each image exactly once - no duplicates!
      const imagePath = shuffledImages[i]

      // Load full image - VERTICAL orientation matching oversized canvas height
      let imageBuffer = await sharp(imagePath)
        .resize(Math.floor(strip.width), canvasHeight, {
          fit: 'cover',
          kernel: sharp.kernel.lanczos3 // Best quality scaling
        })
        .toBuffer()

      // NO TINTING - use 100% original album colors!
      if (debug) {
        console.log(`  Strip ${i + 1}: Using original album colors (no tint)`)
      }

      // Create torn edge mask for vertical strip
      const tornMaskSvg = `
        <svg width="${strip.width + 30}" height="${canvasHeight}">
          <defs>
            <filter id="torn${i}">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="15" xChannelSelector="R" yChannelSelector="G"/>
            </filter>
          </defs>
          <rect x="0" y="0" width="${strip.width + 30}" height="${canvasHeight}"
                fill="white" filter="url(#torn${i})"/>
        </svg>
      `

      // Apply torn mask
      const tornStrip = await sharp({
        create: {
          width: strip.width + 30,
          height: canvasHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
        .composite([
          { input: imageBuffer, top: 0, left: 15 },
          { input: Buffer.from(tornMaskSvg), blend: 'dest-in' }
        ])
        .png()
        .toBuffer()

      // Rotate the vertical strip and keep track of bounding box
      const { data: rotatedBuffer, info: rotatedInfo } = await sharp(tornStrip)
        .rotate(strip.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer({ resolveWithObject: true })

      // Trim any overflow that exceeds the oversized canvas so Sharp composite accepts it
      const needsCrop = rotatedInfo.width > canvasWidth || rotatedInfo.height > canvasHeight
      const targetWidth = needsCrop ? Math.min(rotatedInfo.width, canvasWidth) : rotatedInfo.width
      const targetHeight = needsCrop ? Math.min(rotatedInfo.height, canvasHeight) : rotatedInfo.height

      const cropped = needsCrop
        ? await sharp(rotatedBuffer)
            .extract({
              left: Math.round((rotatedInfo.width - targetWidth) / 2),
              top: Math.round((rotatedInfo.height - targetHeight) / 2),
              width: targetWidth,
              height: targetHeight
            })
            .png()
            .toBuffer({ resolveWithObject: true })
        : { data: rotatedBuffer, info: rotatedInfo }

      const finalStripBuffer = cropped.data
      const finalMeta = cropped.info

      if (debug) {
        const verifyMeta = await sharp(finalStripBuffer).metadata()
        console.log(`      verified via metadata: ${verifyMeta.width}x${verifyMeta.height}`)
      }

      // Align the rotated strip by its centre so rotations do not expose the background
      const maskedWidth = strip.width + 30
      const targetCenterX = padding + (strip.x - xReference) + maskedWidth / 2
      const targetCenterY = canvasHeight / 2

      let left = Math.round(targetCenterX - finalMeta.width / 2)
      let top = Math.round(targetCenterY - finalMeta.height / 2)

      left = Math.max(0, Math.min(canvasWidth - finalMeta.width, left))
      top = Math.max(0, Math.min(canvasHeight - finalMeta.height, top))

      if (debug) {
        console.log(`    → final strip ${i + 1}: ${finalMeta.width}x${finalMeta.height} at left=${left}, top=${top}`)
      }

      if (finalMeta.width > canvasWidth || finalMeta.height > canvasHeight) {
        console.error(`  Warning: Strip ${i + 1} still too large after crop (${finalMeta.width}x${finalMeta.height}), skipping`)
        continue
      }

      composites.push({
        input: finalStripBuffer,
        top,
        left,
        blend: 'over'
      })

    } catch (error) {
      console.error(`  Error processing strip ${i}:`, error.message)
    }
  }

  // Create final collage with maximum quality, then crop to exact dimensions
  if (debug) {
    console.log(`  Compositing ${composites.length} strips on ${canvasWidth}x${canvasHeight} canvas`)

    for (let idx = 0; idx < composites.length; idx++) {
      try {
        if (debug) {
          console.log(`      preflight overlay ${idx + 1} buffer bytes: ${composites[idx].input.length}`)
        }
        await sharp({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          }
        })
          .composite([composites[idx]])
          .png()
          .toBuffer()
      } catch (err) {
        console.error(`  Overlay ${idx + 1} failed preflight:`, err)
      }
    }
  }

  const compositeLimit = debug && process.env.DEBUG_COLLAGE_LIMIT
    ? Math.max(1, Number(process.env.DEBUG_COLLAGE_LIMIT))
    : null

  const compositesToApply = compositeLimit ? composites.slice(0, compositeLimit) : composites

  if (debug && compositeLimit) {
    console.log(`  DEBUG limit in effect – compositing first ${compositesToApply.length} strips`)
  }

  if (debug) {
    compositesToApply.forEach((comp, idx) => {
      console.log(`  → applying overlay ${idx + 1} buffer bytes: ${comp.input.length}`)
    })
  }

  try {
    const { data: composedData, info: composedInfo } = await canvas
      .composite(compositesToApply)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data: croppedData, info: croppedInfo } = await sharp(composedData, {
      raw: {
        width: composedInfo.width,
        height: composedInfo.height,
        channels: composedInfo.channels
      }
    })
      .extract({
        left: padding,
        top: padding,
        width: width,
        height: height
      })
      .raw()
      .toBuffer({ resolveWithObject: true })

    if (debug) {
      console.log(`  Cropped image info: ${croppedInfo.width}x${croppedInfo.height} channels=${croppedInfo.channels}`)
    }

    const filledData = Buffer.from(croppedData)
    const { width: cropWidth, height: cropHeight, channels } = croppedInfo
    const rowStride = cropWidth * channels

    const rowCoverage = Array.from({ length: cropHeight }, () => ({ hasSolid: false, first: null, last: null }))

    for (let y = 0; y < cropHeight; y++) {
      const rowOffset = y * rowStride

      // Fill transparent pixels on the left edge
      let firstSolidIndex = -1
      for (let x = 0; x < cropWidth; x++) {
        const idx = rowOffset + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          firstSolidIndex = idx
          break
        }
      }

      if (firstSolidIndex !== -1) {
        rowCoverage[y].hasSolid = true
        rowCoverage[y].first = Math.floor((firstSolidIndex - rowOffset) / channels)
      }

      if (firstSolidIndex > rowOffset) {
        let leftColorIndex = firstSolidIndex
        let attempts = 0
        while (leftColorIndex < rowOffset + rowStride && attempts < 6) {
          const r = filledData[leftColorIndex]
          const g = filledData[leftColorIndex + 1]
          const b = filledData[leftColorIndex + 2]
          if ((r + g + b) > 45) {
            break
          }
          leftColorIndex += channels
          attempts++
        }

        if (leftColorIndex >= rowOffset + rowStride) {
          leftColorIndex = firstSolidIndex
        }

        const r = filledData[leftColorIndex]
        const g = filledData[leftColorIndex + 1]
        const b = filledData[leftColorIndex + 2]
        const a = 255
        for (let idx = rowOffset; idx < firstSolidIndex; idx += channels) {
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
          filledData[idx + 3] = a
        }
      }

      // Fill transparent pixels on the right edge
      let lastSolidIndex = -1
      for (let x = cropWidth - 1; x >= 0; x--) {
        const idx = rowOffset + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          lastSolidIndex = idx
          break
        }
      }

      if (lastSolidIndex !== -1) {
        rowCoverage[y].last = Math.floor((lastSolidIndex - rowOffset) / channels)
      }

      if (lastSolidIndex !== -1 && lastSolidIndex < rowOffset + (cropWidth - 1) * channels) {
        let rightColorIndex = lastSolidIndex
        let attempts = 0
        while (rightColorIndex >= rowOffset && attempts < 6) {
          const r = filledData[rightColorIndex]
          const g = filledData[rightColorIndex + 1]
          const b = filledData[rightColorIndex + 2]
          if ((r + g + b) > 45) {
            break
          }
          rightColorIndex -= channels
          attempts++
        }

        if (rightColorIndex < rowOffset) {
          rightColorIndex = lastSolidIndex
        }

        const r = filledData[rightColorIndex]
        const g = filledData[rightColorIndex + 1]
        const b = filledData[rightColorIndex + 2]
        const a = 255
        for (let idx = lastSolidIndex + channels; idx < rowOffset + rowStride; idx += channels) {
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
          filledData[idx + 3] = a
        }
      }

      // Ensure partially transparent pixels at edges are made solid
      if (firstSolidIndex !== -1) {
        const idx = firstSolidIndex
        filledData[idx + 3] = 255
      }
      if (lastSolidIndex !== -1) {
        const idx = lastSolidIndex
        filledData[idx + 3] = 255
      }
    }

    // Propagate colour vertically for rows that remained empty after horizontal fill
    let lastSolidRow = -1
    for (let y = 0; y < cropHeight; y++) {
      const rowOffset = y * rowStride
      if (!rowCoverage[y].hasSolid) {
        if (lastSolidRow !== -1) {
          const sourceOffset = lastSolidRow * rowStride
          filledData.copy(filledData, rowOffset, sourceOffset, sourceOffset + rowStride)
        }
      } else {
        lastSolidRow = y
      }
    }

    // Back-fill any leading empty rows with the first solid row below them
    let firstSolidRow = rowCoverage.findIndex(row => row.hasSolid)
    if (firstSolidRow === -1) {
      firstSolidRow = 0
    }
    for (let y = 0; y < firstSolidRow; y++) {
      const rowOffset = y * rowStride
      const sourceOffset = firstSolidRow * rowStride
      filledData.copy(filledData, rowOffset, sourceOffset, sourceOffset + rowStride)
    }

    // Vertical edge fill per column to eliminate remaining transparency
    for (let x = 0; x < cropWidth; x++) {
      let topSolidRow = -1
      for (let y = 0; y < cropHeight; y++) {
        const idx = (y * rowStride) + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          topSolidRow = y
          break
        }
      }

      if (topSolidRow > 0) {
        const idx = (topSolidRow * rowStride) + x * channels
        const r = filledData[idx]
        const g = filledData[idx + 1]
        const b = filledData[idx + 2]
        for (let y = 0; y < topSolidRow; y++) {
          const dstIdx = (y * rowStride) + x * channels
          filledData[dstIdx] = r
          filledData[dstIdx + 1] = g
          filledData[dstIdx + 2] = b
          filledData[dstIdx + 3] = 255
        }
      }

      let bottomSolidRow = -1
      for (let y = cropHeight - 1; y >= 0; y--) {
        const idx = (y * rowStride) + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          bottomSolidRow = y
          break
        }
      }

      if (bottomSolidRow !== -1 && bottomSolidRow < cropHeight - 1) {
        const idx = (bottomSolidRow * rowStride) + x * channels
        const r = filledData[idx]
        const g = filledData[idx + 1]
        const b = filledData[idx + 2]
        for (let y = bottomSolidRow + 1; y < cropHeight; y++) {
          const dstIdx = (y * rowStride) + x * channels
          filledData[dstIdx] = r
          filledData[dstIdx + 1] = g
          filledData[dstIdx + 2] = b
          filledData[dstIdx + 3] = 255
        }
      }
    }

    // Harmonise extreme edge pixels with nearby interior colours to avoid dark seams
    const edgeWidth = Math.min(4, Math.max(1, Math.floor(cropWidth / 80)))
    const sampleSpan = Math.min(12, Math.max(3, Math.floor(cropWidth / 40)))
    const targetEdgeBrightness = 60

    let globalR = 0
    let globalG = 0
    let globalB = 0
    let globalCount = 0
    for (let i = 0; i < filledData.length; i += channels) {
      const alpha = filledData[i + 3]
      if (alpha > 0) {
        globalR += filledData[i]
        globalG += filledData[i + 1]
        globalB += filledData[i + 2]
        globalCount++
      }
    }
    const fallbackR = globalCount > 0 ? Math.round(globalR / globalCount) : 80
    const fallbackG = globalCount > 0 ? Math.round(globalG / globalCount) : 80
    const fallbackB = globalCount > 0 ? Math.round(globalB / globalCount) : 80

    for (let y = 0; y < cropHeight; y++) {
      const rowOffset = y * rowStride
      const centerIdx = rowOffset + Math.floor(cropWidth / 2) * channels
      const centerR = filledData[centerIdx]
      const centerG = filledData[centerIdx + 1]
      const centerB = filledData[centerIdx + 2]
      const firstSolidColumn = rowCoverage[y].first
      const lastSolidColumn = rowCoverage[y].last

      // Left edge blend
      let leftR = 0
      let leftG = 0
      let leftB = 0
      let leftCount = 0
      const leftSampleStart = Math.min(edgeWidth, cropWidth - 1)
      const leftSampleEnd = Math.min(leftSampleStart + sampleSpan, cropWidth - 1)
      for (let x = leftSampleStart; x <= leftSampleEnd; x++) {
        const idx = rowOffset + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          leftR += filledData[idx]
          leftG += filledData[idx + 1]
          leftB += filledData[idx + 2]
          leftCount++
        }
      }

      if (leftCount > 0 && (firstSolidColumn === null || firstSolidColumn > 0)) {
        let r = Math.round(leftR / leftCount)
        let g = Math.round(leftG / leftCount)
        let b = Math.round(leftB / leftCount)
        let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const minBrightness = 55
        if (brightness < minBrightness) {
          if ((r + g + b) < 30) {
            r = (centerR + fallbackR) >> 1
            g = (centerG + fallbackG) >> 1
            b = (centerB + fallbackB) >> 1
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          const boost = minBrightness / Math.max(brightness, 1)
          r = Math.min(255, Math.round(r * boost))
          g = Math.min(255, Math.round(g * boost))
          b = Math.min(255, Math.round(b * boost))
        }
        const limit = Math.min(edgeWidth, cropWidth)
        for (let x = 0; x < limit; x++) {
          if (firstSolidColumn !== null && x >= firstSolidColumn) break
          const idx = rowOffset + x * channels
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
          filledData[idx + 3] = 255
        }
      }

      // Right edge blend
      let rightR = 0
      let rightG = 0
      let rightB = 0
      let rightCount = 0
      const rightSampleStart = Math.max(cropWidth - edgeWidth - sampleSpan, 0)
      const rightSampleEnd = Math.max(cropWidth - edgeWidth - 1, 0)
      for (let x = rightSampleStart; x <= rightSampleEnd; x++) {
        const idx = rowOffset + x * channels
        const alpha = filledData[idx + 3]
        if (alpha > 0) {
          rightR += filledData[idx]
          rightG += filledData[idx + 1]
          rightB += filledData[idx + 2]
          rightCount++
        }
      }
      if (rightCount > 0 && (lastSolidColumn === null || lastSolidColumn < cropWidth - 1)) {
        let r = Math.round(rightR / rightCount)
        let g = Math.round(rightG / rightCount)
        let b = Math.round(rightB / rightCount)
        let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const minBrightness = 55
        if (brightness < minBrightness) {
          if ((r + g + b) < 30) {
            r = (centerR + fallbackR) >> 1
            g = (centerG + fallbackG) >> 1
            b = (centerB + fallbackB) >> 1
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          const boost = minBrightness / Math.max(brightness, 1)
          r = Math.min(255, Math.round(r * boost))
          g = Math.min(255, Math.round(g * boost))
          b = Math.min(255, Math.round(b * boost))
        }
        const limit = Math.min(edgeWidth, cropWidth)
        for (let x = cropWidth - limit; x < cropWidth; x++) {
          if (lastSolidColumn !== null && x <= lastSolidColumn) continue
          const idx = rowOffset + x * channels
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
          filledData[idx + 3] = 255
        }
      }

      const edgeLimit = Math.min(edgeWidth, cropWidth)
      for (let x = 0; x < edgeLimit; x++) {
        if (firstSolidColumn !== null && x >= firstSolidColumn) break
        const idx = rowOffset + x * channels
        let r = filledData[idx]
        let g = filledData[idx + 1]
        let b = filledData[idx + 2]
        let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if (brightness < targetEdgeBrightness) {
          if ((r + g + b) < 30) {
            r = (centerR + fallbackR) >> 1
            g = (centerG + fallbackG) >> 1
            b = (centerB + fallbackB) >> 1
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          const boost = targetEdgeBrightness / Math.max(brightness, 1)
          r = Math.min(255, Math.round(r * boost))
          g = Math.min(255, Math.round(g * boost))
          b = Math.min(255, Math.round(b * boost))
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
        }
        filledData[idx + 3] = 255
      }

      for (let x = cropWidth - edgeLimit; x < cropWidth; x++) {
        if (lastSolidColumn !== null && x <= lastSolidColumn) continue
        const idx = rowOffset + x * channels
        let r = filledData[idx]
        let g = filledData[idx + 1]
        let b = filledData[idx + 2]
        let brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
        if (brightness < targetEdgeBrightness) {
          if ((r + g + b) < 30) {
            r = (centerR + fallbackR) >> 1
            g = (centerG + fallbackG) >> 1
            b = (centerB + fallbackB) >> 1
            brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
          }
          const boost = targetEdgeBrightness / Math.max(brightness, 1)
          r = Math.min(255, Math.round(r * boost))
          g = Math.min(255, Math.round(g * boost))
          b = Math.min(255, Math.round(b * boost))
          filledData[idx] = r
          filledData[idx + 1] = g
          filledData[idx + 2] = b
        }
        filledData[idx + 3] = 255
      }
    }

    await sharp(filledData, {
      raw: {
        width: cropWidth,
        height: cropHeight,
        channels
      }
    })
      .png({ compressionLevel: 6, quality: 100 })
      .toFile(outputPath.replace('.jpg', '.png'))
  } catch (err) {
    console.error('  Composite failed with', compositesToApply.length, 'strips')
    console.error('  Error details:', err)
    throw err
  }

  console.log(`  ✓ Created high-quality strip collage with original album colors (no tint, cropped to exact size)`)
}

// Test the strip collage
async function testStripCollage() {
  console.log('Creating torn paper strip collages...\n')

  const baseFolder = path.join(__dirname, '..', 'public', 'assets', '2025-10-27-listened-to-this-week')
  const albumsFolder = path.join(baseFolder, 'albums')
  const artistsFolder = path.join(baseFolder, 'artists')

  try {
    await fs.access(albumsFolder)
  } catch {
    console.error(`Albums folder not found: ${albumsFolder}`)
    return
  }

  // Get album images
  const albumFiles = await fs.readdir(albumsFolder)
  const albumImages = albumFiles
    .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
    .map(file => path.join(albumsFolder, file))

  // ONLY use album images - no artists!
  const allImages = albumImages

  console.log(`Found ${albumImages.length} albums`)
  console.log(`Using ONLY album covers\n`)

  const outputDir = path.join(__dirname, '..', 'test-output')
  await fs.mkdir(outputDir, { recursive: true })

  // Create variations with different seeds
  console.log('Creating strip variations...\n')

  for (let i = 0; i < 4; i++) {
    console.log(`Variation ${i + 1}:`)
    await createStripCollage(
      allImages,
      path.join(outputDir, `strips-${i + 1}.png`),
      { seed: 54321 + i * 2000 }
    )
  }

  console.log('\nStrip collages complete! Check test-output/ directory')
}

// Export for use in other scripts
export { createStripCollage }

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testStripCollage().catch(console.error)
}
