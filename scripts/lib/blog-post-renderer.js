import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export class BlogPostRenderer {
  constructor(templatePath = null) {
    this.templatePath = templatePath || path.join(__dirname, '..', 'tunes-template.mdx')
  }

  async loadTemplate() {
    try {
      return await fs.readFile(this.templatePath, 'utf-8')
    } catch (error) {
      console.error(`Error loading template: ${error.message}`)
      throw error
    }
  }
  normalizeText(text) {
    if (!text) return ''
    return text.normalize('NFKD').toLowerCase().trim()
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

  async render({
    postPath,
    dateStr,
    weekNumber,
    topArtists,
    topAlbums,
    collectionInfo,
    title,
    summary,
    blogSections,
    randomNumber,
    albumsFolder,
    artistsFolder
  }) {
    // Build top artists section
    const topArtistsSection = topArtists.map(([artist, count]) => {
      const artistData = this.lookupArtistData(artist, collectionInfo)
      if (artistData?.link) {
        return `- [${artist}](${artistData.link}) (${count} plays)`
      }
      return `- ${artist} (${count} plays)`
    }).join('\n')

    // Build top albums section
    const topAlbumsSection = topAlbums.map(([[artist, album], count]) => {
      const albumData = this.lookupAlbumData(artist, album, collectionInfo)
      const artistData = this.lookupArtistData(artist, collectionInfo)

      let albumPart = album
      let artistPart = artist

      if (albumData?.link) {
        albumPart = `[${album}](${albumData.link})`
      }
      if (artistData?.link) {
        artistPart = `[${artist}](${artistData.link})`
      }

      return `- ${albumPart} by ${artistPart}`
    }).join('\n')

    // Load template
    const template = await this.loadTemplate()

    // Build complete MDX content from template (replace all occurrences)
    const content = template
      .replace(/\{\{title\}\}/g, title)
      .replace(/\{\{description\}\}/g, summary)
      .replace(/\{\{pubDate\}\}/g, dateStr)
      .replace(/\{\{coverImage\}\}/g, randomNumber)
      .replace(/\{\{albumSections\}\}/g, blogSections)
      .replace(/\{\{weekNumber\}\}/g, weekNumber)
      .replace(/\{\{topArtists\}\}/g, topArtistsSection)
      .replace(/\{\{topAlbums\}\}/g, topAlbumsSection)

    // Write the file
    await fs.writeFile(postPath, content)
    console.log(`  ✓ Blog post written to: ${postPath}`)
  }
}
