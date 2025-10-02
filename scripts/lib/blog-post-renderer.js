import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { lookupArtistData, lookupAlbumData } from './text-utils.js'

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
      const artistData = lookupArtistData(artist, collectionInfo)
      if (artistData?.link) {
        return `- [${artist}](${artistData.link}) (${count} plays)`
      }
      return `- ${artist} (${count} plays)`
    }).join('\n')

    // Build top albums section
    const topAlbumsSection = topAlbums.map(([[artist, album], count]) => {
      const albumData = lookupAlbumData(artist, album, collectionInfo)
      const artistData = lookupArtistData(artist, collectionInfo)

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
