import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import { normalizeForFilename, lookupArtistData, lookupAlbumData, isVariousArtists } from './text-utils.js'

export class ImageHandler {

  async downloadImage(url, folder, name, skipIfExists = false) {
    try {
      const cleanName = normalizeForFilename(name)
      const imagePath = path.join(folder, `${cleanName}.jpg`)
      const metaPath = path.join(folder, `${cleanName}.jpg.meta`)

      // Skip if already downloaded
      if (skipIfExists) {
        try {
          await fs.access(imagePath)
          return // Already exists, skip silently
        } catch {
          // File doesn't exist, continue with download
        }
      }

      const response = await axios.get(url, { responseType: 'arraybuffer' })

      await fs.writeFile(imagePath, response.data)

      const metadata = { Title: name }
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2))

      console.log(`  ✓ Downloaded: ${cleanName}.jpg`)
    } catch (error) {
      console.error(`  ✗ Error downloading ${name}: ${error.message}`)
    }
  }

  async downloadArtistImages(topArtists, collectionInfo, artistsFolder, skipIfExists = false) {
    if (!skipIfExists) {
      console.log('Downloading artist images...')
    }
    for (const [artist] of topArtists) {
      // Skip "Various Artists" entries
      if (isVariousArtists(artist)) {
        if (!skipIfExists) {
          console.log(`  ⊘ Skipping "Various Artists": ${artist}`)
        }
        continue
      }

      const artistData = lookupArtistData(artist, collectionInfo)
      if (artistData?.image) {
        await this.downloadImage(artistData.image, artistsFolder, artist, skipIfExists)
      } else if (!skipIfExists) {
        console.log(`  ⚠ No image found for artist: ${artist}`)
      }
    }
  }

  async downloadAlbumImages(topAlbums, collectionInfo, albumsFolder, skipIfExists = false) {
    if (!skipIfExists) {
      console.log('Downloading album images...')
    }
    for (const [[artist, album]] of topAlbums) {
      const albumData = lookupAlbumData(artist, album, collectionInfo)
      if (albumData?.image) {
        await this.downloadImage(albumData.image, albumsFolder, album, skipIfExists)
      } else if (!skipIfExists) {
        console.log(`  ⚠ No image found for album: ${album} by ${artist}`)
      }
    }
  }
}
