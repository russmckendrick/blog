import axios from 'axios'
import { promises as fs } from 'fs'
import path from 'path'

export class CollectionManager {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.localFile = 'collection.json'
  }

  async getCollectionData() {
    try {
      await this.updateLocalCache()
      return await this.processCollectionData()
    } catch (error) {
      console.error(`Error processing collection data: ${error.message}`)
      throw error
    }
  }

  async updateLocalCache() {
    try {
      const stats = await fs.stat(this.localFile).catch(() => null)
      const shouldUpdate = !stats || (Date.now() - stats.mtimeMs > 3600000)

      if (shouldUpdate) {
        console.log('Updating collection cache...')
        const response = await axios.get(`${this.baseUrl}/collection.json`, {
          responseType: 'arraybuffer'
        })
        await fs.writeFile(this.localFile, response.data)
      }
    } catch (error) {
      console.error(`Error updating cache: ${error.message}`)
      throw error
    }
  }

  async processCollectionData() {
    const data = JSON.parse(await fs.readFile(this.localFile, 'utf-8'))
    const info = {}
    const originalCases = {}

    for (const release of data) {
      this.processRelease(release, info, originalCases)
    }

    return { info, originalCases }
  }

  processRelease(release, info, originalCases) {
    const artist = release.release_artist
    const album = release.release_name

    const imageBaseUrl = 'https://assets.russ.fm'
    let albumImageUrl = null

    if (release.images_uri_release?.['hi-res']) {
      albumImageUrl = `${imageBaseUrl}${release.images_uri_release['hi-res']}`
    }

    const albumUri = release.uri_release ? `${this.baseUrl}${release.uri_release}` : null

    if (artist && album && albumUri) {
      const key = `${this.normalizeText(artist)}|||${this.normalizeText(album)}`
      info[key] = {
        album_image: albumImageUrl,
        album_link: albumUri,
        // Rich metadata for classification
        genres: release.genre_names || [],
        release_year: this.extractYear(release.date_release_year),
        date_added: release.date_added || null
      }
      originalCases[key] = { artist, album }
    }

    // Process artist data
    if (release.artists) {
      for (const artistData of release.artists) {
        const artistName = artistData.name
        const artistUriPath = artistData.uri_artist

        if (artistName && artistUriPath) {
          const artistKey = this.normalizeText(artistName)
          const artistUri = `${this.baseUrl}${artistUriPath}`

          const artistSlug = artistUriPath.trim().split('/').filter(Boolean).pop()
          const artistImageUrl = `${imageBaseUrl}/artist/${artistSlug}/${artistSlug}-hi-res.jpg`

          // Only update if not already set (preserve first occurrence with most data)
          if (!info[artistKey]) {
            info[artistKey] = {
              artist_image: artistImageUrl,
              artist_link: artistUri,
              // Rich metadata for classification
              biography: artistData.biography || null
            }
          } else if (!info[artistKey].biography && artistData.biography) {
            // Add biography if we have it and didn't before
            info[artistKey].biography = artistData.biography
          }
          originalCases[artistKey] = artistName
        }
      }
    }
  }

  /**
   * Extract year from date string (handles YYYY-MM-DD or YYYY formats)
   */
  extractYear(dateStr) {
    if (!dateStr) return null
    const match = dateStr.toString().match(/^(\d{4})/)
    return match ? parseInt(match[1], 10) : null
  }

  normalizeText(text) {
    if (!text) return ''
    return text
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      // Replace "&" with "and" for consistent matching
      .replace(/\s*&\s*/g, ' and ')
      // Normalize multiple spaces to single space
      .replace(/\s+/g, ' ')
  }
}
