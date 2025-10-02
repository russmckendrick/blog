import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'

export class ImageHandler {
  normalizeText(text) {
    if (!text) return ''
    return text.normalize('NFKD').toLowerCase().trim()
  }

  /**
   * Normalize text for filenames - convert special characters to ASCII equivalents
   */
  normalizeForFilename(text) {
    if (!text) return ''

    // First normalize unicode characters
    let normalized = text.normalize('NFD')

    // Replace special Icelandic and other characters with ASCII equivalents
    const charMap = {
      'á': 'a', 'Á': 'A',
      'ð': 'd', 'Ð': 'D',
      'é': 'e', 'É': 'E',
      'í': 'i', 'Í': 'I',
      'ó': 'o', 'Ó': 'O',
      'ú': 'u', 'Ú': 'U',
      'ý': 'y', 'Ý': 'Y',
      'þ': 'th', 'Þ': 'Th',
      'æ': 'ae', 'Æ': 'Ae',
      'ö': 'o', 'Ö': 'O',
      'ø': 'o', 'Ø': 'O',
      'å': 'a', 'Å': 'A',
      'ü': 'u', 'Ü': 'U',
      'ä': 'a', 'Ä': 'A',
      'ë': 'e', 'Ë': 'E',
      'ï': 'i', 'Ï': 'I',
    }

    // Replace each special character
    for (const [special, replacement] of Object.entries(charMap)) {
      normalized = normalized.replace(new RegExp(special, 'g'), replacement)
    }

    // Remove any remaining diacritics
    normalized = normalized.replace(/[\u0300-\u036f]/g, '')

    // Replace spaces and special chars with hyphens
    normalized = normalized.replace(/\s+/g, '-')
                         .replace(/[\/\\]/g, '-')
                         .replace(/[']/g, '')
                         .replace(/[^\w-]/g, '-')
                         .replace(/-+/g, '-')
                         .replace(/^-|-$/g, '')

    return normalized
  }

  lookupArtistData(artist, collectionInfo) {
    const normalizedArtist = this.normalizeText(artist)
    for (const [key, data] of Object.entries(collectionInfo)) {
      if (typeof key === 'string' && this.normalizeText(key) === normalizedArtist) {
        return {
          link: data.artist_link,
          image: data.artist_image
        }
      }
    }
    return null
  }

  lookupAlbumData(artist, album, collectionInfo) {
    const normalizedArtist = this.normalizeText(artist)
    const normalizedAlbum = this.normalizeText(album)

    for (const [key, data] of Object.entries(collectionInfo)) {
      if (key.includes('|||')) {
        const [keyArtist, keyAlbum] = key.split('|||')
        if (this.normalizeText(keyArtist) === normalizedArtist && this.normalizeText(keyAlbum) === normalizedAlbum) {
          return {
            link: data.album_link,
            image: data.album_image
          }
        }
      }
    }
    return null
  }

  async downloadImage(url, folder, name) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      const cleanName = this.normalizeForFilename(name)
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
      const artistData = this.lookupArtistData(artist, collectionInfo)
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
      const albumData = this.lookupAlbumData(artist, album, collectionInfo)
      if (albumData?.image) {
        await this.downloadImage(albumData.image, albumsFolder, album)
      } else {
        console.log(`  ⚠ No image found for album: ${album} by ${artist}`)
      }
    }
  }
}
