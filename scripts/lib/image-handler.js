import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'
import { normalizeForFilename, lookupArtistData, lookupAlbumData } from './text-utils.js'

export class ImageHandler {

  async downloadImage(url, folder, name) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      const cleanName = normalizeForFilename(name)
      const imagePath = path.join(folder, `${cleanName}.jpg`)
      const metaPath = path.join(folder, `${cleanName}.jpg.meta`)

      await fs.writeFile(imagePath, response.data)

      const metadata = { Title: name }
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2))

      console.log(`  ✓ Downloaded: ${cleanName}.jpg`)
    } catch (error) {
      console.error(`  ✗ Error downloading ${name}: ${error.message}`)
    }
  }

  async downloadArtistImages(topArtists, collectionInfo, artistsFolder) {
    console.log('Downloading artist images...')
    for (const [artist] of topArtists) {
      const artistData = lookupArtistData(artist, collectionInfo)
      if (artistData?.image) {
        await this.downloadImage(artistData.image, artistsFolder, artist)
      } else {
        console.log(`  ⚠ No image found for artist: ${artist}`)
      }
    }
  }

  async downloadAlbumImages(topAlbums, collectionInfo, albumsFolder) {
    console.log('Downloading album images...')
    for (const [[artist, album]] of topAlbums) {
      const albumData = lookupAlbumData(artist, album, collectionInfo)
      if (albumData?.image) {
        await this.downloadImage(albumData.image, albumsFolder, album)
      } else {
        console.log(`  ⚠ No image found for album: ${album} by ${artist}`)
      }
    }
  }
}
