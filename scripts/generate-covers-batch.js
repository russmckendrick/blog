import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createStripCollage } from './strip-collage.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function generateCoversForRecentPosts() {
  console.log('Generating covers for recent tunes posts...\n')

  // Find recent tunes post folders in public/assets (where album images are)
  const publicAssetsDir = path.join(__dirname, '..', 'public', 'assets')
  const srcAssetsDir = path.join(__dirname, '..', 'src', 'assets')
  const entries = await fs.readdir(publicAssetsDir)

  const allTunesFolders = entries
    .filter(entry => entry.includes('listened-to-this-week'))
    .sort()
    .reverse()

  // Get batch parameters from command line
  const batchSize = 5
  const batchNum = parseInt(process.argv[2]) || 0 // 0 means all

  let tunesFolders
  if (batchNum === 0) {
    tunesFolders = allTunesFolders
  } else {
    const startIdx = (batchNum - 1) * batchSize
    tunesFolders = allTunesFolders.slice(startIdx, startIdx + batchSize)
  }

  if (batchNum === 0) {
    console.log(`Processing ALL ${tunesFolders.length} tunes posts in batches of ${batchSize}...\n`)
  } else {
    console.log(`Processing batch ${batchNum} (${tunesFolders.length} posts out of ${allTunesFolders.length} total):\n`)
    tunesFolders.forEach(folder => console.log(`  - ${folder}`))
    console.log('')
  }

  // Generate a cover for each post
  for (const folder of tunesFolders) {
    const albumsFolder = path.join(publicAssetsDir, folder, 'albums')

    try {
      await fs.access(albumsFolder)

      // Get album images from public/assets
      const albumFiles = await fs.readdir(albumsFolder)
      const albumImages = albumFiles
        .filter(file => file.endsWith('.jpg') && !file.endsWith('.meta'))
        .map(file => path.join(albumsFolder, file))

      if (albumImages.length === 0) {
        console.log(`  ⚠️  No albums found in ${folder}`)
        continue
      }

      console.log(`\n📀 ${folder}:`)
      console.log(`   Found ${albumImages.length} albums`)

      // Extract date from folder name for unique seed
      const dateMatch = folder.match(/(\d{4}-\d{2}-\d{2})/)
      const seed = dateMatch ? parseInt(dateMatch[1].replace(/-/g, '')) : Date.now()

      // Ensure src/assets folder exists
      const srcFolderPath = path.join(srcAssetsDir, folder)
      await fs.mkdir(srcFolderPath, { recursive: true })

      // Output path: tunes-cover-{folder-name}.png in src/assets/{folder}/
      const outputPath = path.join(srcFolderPath, `tunes-cover-${folder}.png`)

      // Generate the collage
      await createStripCollage(albumImages, outputPath, { seed, width: 1200, height: 630 })

      console.log(`   ✓ Created: src/assets/${folder}/tunes-cover-${folder}.png\n`)

    } catch (error) {
      console.error(`   ✗ Error processing ${folder}:`, error.message)
    }
  }

  console.log('\n✨ All covers generated!')
}

generateCoversForRecentPosts().catch(console.error)
