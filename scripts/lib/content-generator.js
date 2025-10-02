import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ConfigLoader } from './config-loader.js'

export class ContentGenerator {
  constructor(config = null) {
    this.config = config
    // Use whichever API key is available (prefer OpenAI if both are set)
    if (process.env.OPENAI_API_KEY) {
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini'
      const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '1')
      this.llm = new ChatOpenAI({
        modelName,
        temperature,
      })
      console.log(`Using OpenAI ${modelName} (temperature: ${temperature}) for content generation`)
    } else if (process.env.ANTHROPIC_API_KEY) {
      const modelName = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
      const temperature = parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7')
      this.llm = new ChatAnthropic({
        modelName,
        temperature,
      })
      console.log(`Using Anthropic ${modelName} (temperature: ${temperature}) for content generation`)
    } else {
      throw new Error('Either ANTHROPIC_API_KEY or OPENAI_API_KEY must be set')
    }

    // Initialize search tool if available
    this.searchTool = null
    if (process.env.TAVILY_API_KEY) {
      import('@langchain/community/tools/tavily_search')
        .then(({ TavilySearchResults }) => {
          this.searchTool = new TavilySearchResults({ maxResults: 3 })
        })
        .catch(() => console.log('Tavily search not available'))
    }
  }

  async generateTitleAndSummary(dateStr, weekNumber, topArtists, topAlbums) {
    const artistNames = topArtists.map(([name]) => name).join(', ')
    const albumNames = topAlbums.map(([[artist, album]]) => album).join(', ')

    const context = {
      artists: artistNames,
      albums: albumNames,
      week_number: weekNumber,
      date_str: dateStr
    }

    const titlePrompt = this.config
      ? this.config.getTitlePrompt(context)
      : this.getDefaultTitlePrompt(context)

    const summaryPrompt = this.config
      ? this.config.getSummaryPrompt(context)
      : this.getDefaultSummaryPrompt(context)

    try {
      const [titleResponse, summaryResponse] = await Promise.all([
        this.llm.invoke(titlePrompt),
        this.llm.invoke(summaryPrompt)
      ])

      const title = this.sanitizeOutput(titleResponse.content)
      const summary = this.sanitizeOutput(summaryResponse.content)

      console.log(`Generated title: ${title}`)
      console.log(`Generated summary: ${summary}`)

      return [title, summary]
    } catch (error) {
      console.error('Error generating title and summary:', error.message)
      return [
        'Weekly Music Roundup',
        'A weekly exploration of music highlights and discoveries.'
      ]
    }
  }

  async researchAlbums(topAlbums, collectionInfo, dateStr) {
    const sections = []

    for (const [[artist, album]] of topAlbums) {
      console.log(`  Researching: ${album} by ${artist}...`)
      try {
        const section = await this.researchAlbum(artist, album)
        const enrichedSection = this.addImagesAndLinks(section, artist, album, collectionInfo, dateStr)
        sections.push(enrichedSection)
      } catch (error) {
        console.error(`  Error researching ${album}: ${error.message}`)
        const fallback = this.generateFallbackSection(artist, album)
        const enrichedFallback = this.addImagesAndLinks(fallback, artist, album, collectionInfo, dateStr)
        sections.push(enrichedFallback)
      }
    }

    return sections.join('\n\n')
  }

  addImagesAndLinks(section, artist, album, collectionInfo, dateStr) {
    // Get album and artist data
    const albumData = this.lookupAlbumData(artist, album, collectionInfo)
    const artistData = this.lookupArtistData(artist, collectionInfo)

    // Split section into lines
    const lines = section.split('\n')
    const enrichedLines = []
    let headerFound = false
    const h3Headers = []

    // First pass: find all H3 headers
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('### ')) {
        h3Headers.push(i)
      }
    }

    // Calculate middle position - after the middle H3 section
    const middleH3Index = h3Headers.length > 1 ? h3Headers[Math.floor(h3Headers.length / 2)] : h3Headers[0]

    for (let i = 0; i < lines.length; i++) {
      enrichedLines.push(lines[i])

      // After the H2 header (## Album Title), add album image
      if (!headerFound && lines[i].startsWith('## ')) {
        headerFound = true
        if (albumData?.image) {
          const albumImagePath = `/assets/${dateStr}-listened-to-this-week/albums/${album.replace(/\s+/g, '-').replace(/\//g, '-')}.jpg`
          enrichedLines.push('')
          enrichedLines.push(`<Img src="${albumImagePath}" alt="${album} by ${artist}" />`)
          enrichedLines.push('')
        }
      }

      // After the middle H3 header, add artist image
      if (headerFound && i === middleH3Index && artistData?.image) {
        const artistImagePath = `/assets/${dateStr}-listened-to-this-week/artists/${artist.replace(/\s+/g, '-').replace(/\//g, '-')}.jpg`
        enrichedLines.push('')
        enrichedLines.push(`<Img src="${artistImagePath}" alt="${artist}" />`)
        enrichedLines.push('')
        // Only add once
        artistData.image = null
      }
    }

    // Add russ.fm links at the end
    const links = []
    if (albumData?.link) {
      links.push(`- View ${album} on [russ.fm](${albumData.link})`)
    }
    if (artistData?.link) {
      links.push(`- View ${artist} on [russ.fm](${artistData.link})`)
    }

    if (links.length > 0) {
      enrichedLines.push('')
      enrichedLines.push(...links)
    }

    return enrichedLines.join('\n')
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

  async researchAlbum(artist, album) {
    let webContext = ''

    // Try to search the web for album information
    if (this.searchTool) {
      try {
        const searchQuery = `${album} by ${artist} album review history facts`
        const searchResults = await this.searchTool.invoke(searchQuery)
        webContext = `Web search results:\n${searchResults}`
      } catch (error) {
        console.log(`    Search unavailable for ${album}, continuing without web context`)
      }
    }

    const context = {
      album,
      artist,
      web_context: webContext
    }

    const prompt = this.config
      ? this.config.getAlbumResearchPrompt(context)
      : this.getDefaultAlbumPrompt(context)

    const response = await this.llm.invoke(prompt)
    return this.sanitizeOutput(response.content)
  }

  getDefaultTitlePrompt(context) {
    return `Create a creative title for a weekly music blog post.
Artists: ${context.artists}
Albums: ${context.albums}
Maximum 70 characters, avoid special characters.
Return ONLY the title.`
  }

  getDefaultSummaryPrompt(context) {
    return `Create a summary for week ${context.week_number}.
Artists: ${context.artists}
Albums: ${context.albums}
Maximum 180 characters.
Return ONLY the summary.`
  }

  getDefaultAlbumPrompt(context) {
    return `Research and write about "${context.album}" by ${context.artist}.
${context.web_context}
Use H2 for title, H3 for sections, include emojis.
Return ONLY the blog section.`
  }

  generateFallbackSection(artist, album) {
    return `## ${album} by ${artist} 🎵

### A Musical Journey 🎸

${album} by ${artist} represents an important moment in their musical journey. This album showcases the artist's evolution and continues to resonate with listeners.

### Legacy 🌟

The impact of this work can still be felt in contemporary music, influencing new generations of artists and fans alike.`
  }

  sanitizeOutput(text) {
    if (typeof text !== 'string') {
      text = String(text)
    }
    // Remove quotes and clean up the text
    return text.replace(/['"]/g, '').trim()
  }
}
