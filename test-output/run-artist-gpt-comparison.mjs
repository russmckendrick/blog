import 'dotenv/config'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fal } from '@fal-ai/client'
import { BACKENDS } from '../scripts/lib/image-backends/index.js'

// Artist-portrait backend bake-off. Unlike run-artist-model-comparison.mjs (which froze a
// hand-trimmed prompt to fit Kling's 2,500-character cap), this reads the week's real prompt
// and cast straight from the committed sidecar and calls the production backend modules, so
// what renders here is what would ship if settings.artist_portrait_backend were switched.
const projectRoot = path.resolve(import.meta.dirname, '..')

const date = process.argv.find(arg => arg.startsWith('--date='))?.slice('--date='.length) || '2026-09-07'
const week = `${date}-listened-to-this-week`
const sourceDir = path.join(projectRoot, 'public', 'assets', week, 'artists')
const sidecarPath = path.join(projectRoot, 'src', 'assets', week, `tunes-artists-${week}.json`)
const outputDir = path.join(projectRoot, 'test-output', `artist-gpt-comparison-${date}`)

// The weekly generator seeds from the post date; matching it keeps the seeded backends
// comparable with what actually shipped.
const seed = new Date(date).getTime()

const CONTENDERS = ['nano-banana-pro', 'gpt-image-2', 'gpt-image-2-5']

async function uploadReference(imagePath) {
  // Mirrors uploadArtistImages() in scripts/fal-tunes-artists.js.
  const buffer = await sharp(imagePath)
    .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
    .jpeg({ quality: 92 })
    .toBuffer()
  const file = new File([buffer], path.basename(imagePath), { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${response.statusText}`)
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
        <text x="24" y="37" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#ffffff">${result.label}</text>
      </svg>
    `)
    return sharp({
      create: { width, height: imageHeight + labelHeight, channels: 3, background: '#171717' }
    })
      .composite([{ input: image, top: 0, left: 0 }, { input: label, top: imageHeight, left: 0 }])
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(date).getTime())) {
    throw new Error(`--date must be a real YYYY-MM-DD date, got "${date}"`)
  }
  fal.config({ credentials: process.env.FAL_KEY })

  const sidecar = JSON.parse(await fs.readFile(sidecarPath, 'utf8'))
  const prompt = sidecar.prompt
  if (!prompt) throw new Error(`No prompt recorded in ${sidecarPath}`)

  const inputPaths = sidecar.inputs.map(filename => path.join(sourceDir, filename))
  console.log(`Week ${date}: ${inputPaths.length} references, ${prompt.length}-character prompt, seed ${seed}`)
  console.log(`Cast: ${(sidecar.cast || []).join(', ') || 'n/a'}`)
  console.log(`Shipped with: ${sidecar.composeBackend} (${sidecar.model})`)

  await fs.mkdir(outputDir, { recursive: true })
  const imageUrls = await Promise.all(inputPaths.map(uploadReference))

  const settled = await Promise.allSettled(CONTENDERS.map(async id => {
    const backend = BACKENDS[id]
    if (!backend) throw new Error(`Unknown backend "${id}"`)
    console.log(`Starting ${backend.label}`)
    const startedAt = Date.now()
    const { imageUrl, model } = await backend.generate({ imageUrls, prompt, seed, debug: false })
    const outputPath = path.join(outputDir, `${id}.png`)
    const dimensions = await downloadImage(imageUrl, outputPath)
    const durationSeconds = Number(((Date.now() - startedAt) / 1000).toFixed(1))
    console.log(`Completed ${backend.label} in ${durationSeconds}s`)
    return { id, label: backend.label, model, outputPath, durationSeconds, ...dimensions }
  }))

  const results = []
  const failures = []
  settled.forEach((entry, index) => {
    if (entry.status === 'fulfilled') results.push(entry.value)
    else failures.push({ id: CONTENDERS[index], error: entry.reason?.message || String(entry.reason) })
  })

  if (results.length > 0) {
    const sheet = await createContactSheet(results)
    console.log(`\nContact sheet: ${sheet}`)
  }

  await fs.writeFile(
    path.join(outputDir, 'comparison.json'),
    JSON.stringify({ date, seed, prompt, cast: sidecar.cast, inputs: sidecar.inputs, results, failures }, null, 2)
  )

  results.forEach(r => console.log(`  ${r.label}: ${r.width}x${r.height}  ${r.durationSeconds}s  ${r.outputPath}`))
  failures.forEach(f => console.error(`  FAILED ${f.id}: ${f.error}`))
}

main().catch(error => {
  console.error(`Error: ${error.message}`)
  process.exit(1)
})
