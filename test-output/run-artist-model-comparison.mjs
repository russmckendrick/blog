import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fal } from '@fal-ai/client'

const projectRoot = path.resolve(import.meta.dirname, '..')
const date = '2026-08-31'
const sourceDir = path.join(
  projectRoot,
  'public',
  'assets',
  `${date}-listened-to-this-week`,
  'artists'
)
const sidecarPath = path.join(
  projectRoot,
  'src',
  'assets',
  `${date}-listened-to-this-week`,
  `tunes-artists-${date}-listened-to-this-week.json`
)
const outputDir = path.join(projectRoot, 'test-output', `artist-model-comparison-${date}`)
const seed = 20260831

const prompt = `Create one cohesive photorealistic 16:9 group photograph in a modest real room. Use @Image1 as the sole setting authority: preserve its plain off-white wall, narrow partition or door edge at far left, shallow room depth, subdued natural colour and soft diffuse indoor light. Extend only what plausibly continues just outside that frame.

Portray exactly these four adults, once each, and nobody else:
- From @Image1, only the tall fair-skinned young man at the far right with short light-brown hair, black long-sleeve top, wristwatch and round-lensed sunglasses. Place him front right, nearest camera, holding the sunglasses.
- From @Image2, only the seated man at front centre with medium-length dark hair, open floral shirt and light trousers. Place him low at front centre with one knee raised.
- From @Image3, only the older man near centre with short grey hair, black leather jacket, dark shirt and jeans. Place him centre-left, leaning lightly against the wall.
- From @Image4, only the man third from left with long straight dark hair partly covering one eye and a light patterned shirt. Place him rear centre-right, bending slightly towards camera.

Use a straight-on chest-height viewpoint and a natural 40–50mm lens. Arrange staggered heights and overlapping bodies rather than an even line. Keep every face large, sharp and unobstructed. Preserve each selected person's recognisable facial structure, age, skin tone, hair, facial hair, eyewear, clothing and styling from the corresponding reference. Do not average, beautify, de-age, merge or substitute faces. Do not include any unselected band member, extra person, duplicate, reflection, poster, photograph, silhouette or background face. Natural anatomy and hands. No text, logos, signage, captions or watermark.`

const models = [
  {
    id: 'nano-banana-pro-edit',
    endpoint: 'fal-ai/nano-banana-pro/edit',
    input: imageUrls => ({
      prompt,
      image_urls: imageUrls,
      aspect_ratio: '16:9',
      resolution: '2K',
      output_format: 'png',
      num_images: 1,
      safety_tolerance: '5',
      limit_generations: true,
      enable_web_search: false,
      seed
    })
  },
  {
    id: 'kling-o3-image-to-image',
    endpoint: 'fal-ai/kling-image/o3/image-to-image',
    input: imageUrls => ({
      prompt,
      image_urls: imageUrls,
      resolution: '2K',
      result_type: 'single',
      num_images: 1,
      aspect_ratio: '16:9',
      output_format: 'png'
    })
  },
  {
    id: 'flux-2-pro-edit',
    endpoint: 'fal-ai/flux-2-pro/edit',
    input: imageUrls => ({
      prompt,
      image_urls: imageUrls,
      image_size: { width: 1920, height: 1080 },
      output_format: 'png',
      safety_tolerance: '5',
      enable_safety_checker: true,
      seed
    })
  }
]

async function uploadReference(imagePath) {
  const buffer = await sharp(imagePath)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3
    })
    .jpeg({ quality: 92 })
    .toBuffer()
  const file = new File([buffer], path.basename(imagePath), { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  await sharp(buffer).png({ compressionLevel: 6, quality: 100 }).toFile(outputPath)
  const metadata = await sharp(buffer).metadata()
  return { width: metadata.width, height: metadata.height }
}

async function createContactSheet(results) {
  const width = 720
  const imageHeight = 405
  const labelHeight = 58
  const panels = await Promise.all(results.map(async result => {
    const image = await sharp(result.outputPath)
      .resize(width, imageHeight, { fit: 'cover' })
      .png()
      .toBuffer()
    const label = Buffer.from(`
      <svg width="${width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#171717"/>
        <text x="24" y="37" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${result.id}</text>
      </svg>
    `)
    return sharp({
      create: {
        width,
        height: imageHeight + labelHeight,
        channels: 3,
        background: '#171717'
      }
    })
      .composite([
        { input: image, top: 0, left: 0 },
        { input: label, top: imageHeight, left: 0 }
      ])
      .png()
      .toBuffer()
  }))

  const outputPath = path.join(outputDir, 'comparison-contact-sheet.png')
  await sharp({
    create: {
      width: width * panels.length,
      height: imageHeight + labelHeight,
      channels: 3,
      background: '#171717'
    }
  })
    .composite(panels.map((input, index) => ({ input, left: index * width, top: 0 })))
    .png()
    .toFile(outputPath)
  return outputPath
}

async function main() {
  if (!process.env.FAL_KEY) throw new Error('FAL_KEY is required')
  if (prompt.length > 2500) throw new Error(`Comparison prompt is ${prompt.length} characters; Kling permits 2500`)

  fal.config({ credentials: process.env.FAL_KEY })
  await fs.mkdir(outputDir, { recursive: true })

  const sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf8'))
  const inputPaths = sidecar.inputs.map(filename => path.join(sourceDir, filename))
  console.log(`Uploading ${inputPaths.length} shared references`)
  const imageUrls = await Promise.all(inputPaths.map(uploadReference))

  const settled = await Promise.allSettled(models.map(async model => {
    console.log(`Starting ${model.endpoint}`)
    const startedAt = Date.now()
    const result = await fal.subscribe(model.endpoint, {
      input: model.input(imageUrls),
      logs: true,
      onQueueUpdate: update => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map(log => log.message).forEach(message => {
            console.log(`[${model.id}] ${message}`)
          })
        }
      }
    })
    const imageUrl = result.data?.images?.[0]?.url
    if (!imageUrl) throw new Error(`${model.endpoint} returned no image URL`)
    const outputPath = path.join(outputDir, `${model.id}.png`)
    const dimensions = await downloadImage(imageUrl, outputPath)
    console.log(`Completed ${model.endpoint} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
    return {
      id: model.id,
      endpoint: model.endpoint,
      requestId: result.requestId,
      outputPath,
      durationSeconds: Number(((Date.now() - startedAt) / 1000).toFixed(1)),
      ...dimensions
    }
  }))

  const results = []
  const failures = []
  settled.forEach((entry, index) => {
    if (entry.status === 'fulfilled') results.push(entry.value)
    else failures.push({
      id: models[index].id,
      endpoint: models[index].endpoint,
      error: entry.reason?.message || String(entry.reason)
    })
  })

  const contactSheetPath = results.length > 0 ? await createContactSheet(results) : null
  const record = {
    date,
    createdAt: new Date().toISOString(),
    seed,
    prompt,
    promptLength: prompt.length,
    sourceSidecar: path.relative(projectRoot, sidecarPath),
    inputs: sidecar.inputs,
    results: results.map(result => ({
      ...result,
      outputPath: path.relative(projectRoot, result.outputPath)
    })),
    failures,
    contactSheetPath: contactSheetPath ? path.relative(projectRoot, contactSheetPath) : null
  }
  await fs.writeFile(
    path.join(outputDir, 'comparison.json'),
    `${JSON.stringify(record, null, 2)}\n`,
    'utf8'
  )

  console.log(JSON.stringify(record, null, 2))
  if (failures.length > 0) process.exitCode = 1
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
