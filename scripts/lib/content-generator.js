import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ConfigLoader } from './config-loader.js'
import { normalizeForFilename, lookupArtistData, lookupAlbumData, escapeQuotes } from './text-utils.js'
import { SearchCache } from './search-cache.js'
import { ExaMusicSearchTool } from './exa-tool.js'
import { PerplexityMusicSearchTool } from './perplexity-tool.js'

export class ContentGenerator {
  constructor(config = null) {
    this.config = config
    this.searchCache = new SearchCache()

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

    // Initialize search tools for agent (priority: Perplexity > Exa > Tavily)
    this.tools = []
    this.searchProvider = 'none'

    if (process.env.PERPLEXITY_API_KEY) {
      this.tools.push(new PerplexityMusicSearchTool(process.env.PERPLEXITY_API_KEY))
      this.searchProvider = 'Perplexity AI (search + LLM)'
      console.log('Using Perplexity AI - search-augmented LLM for research')
    } else if (process.env.EXA_API_KEY) {
      this.tools.push(new ExaMusicSearchTool(process.env.EXA_API_KEY))
      this.searchProvider = 'Exa AI (semantic search)'
      console.log('Using Exa AI with LangChain agent architecture')
    } else if (process.env.TAVILY_API_KEY) {
      import('@langchain/community/tools/tavily_search')
        .then(({ TavilySearchResults }) => {
          this.tools.push(new TavilySearchResults({ maxResults: 5 }))
          this.searchProvider = 'Tavily (agent-based)'
          console.log('Using Tavily with LangChain agent architecture')
        })
        .catch(() => {
          console.log('Tavily search not available')
        })
    } else {
      console.log('No search API configured (set PERPLEXITY_API_KEY, EXA_API_KEY or TAVILY_API_KEY)')
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
    const albumData = lookupAlbumData(artist, album, collectionInfo)
    const artistData = lookupArtistData(artist, collectionInfo)

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
          const albumImagePath = `/assets/${dateStr}-listened-to-this-week/albums/${normalizeForFilename(album)}.jpg`
          const altText = escapeQuotes(`${album} by ${artist}`)
          enrichedLines.push('')
          enrichedLines.push(`<Img src="${albumImagePath}" alt="${altText}" fullWidth="true" />`)
          enrichedLines.push('')
        }
      }

      // After the middle H3 header, add artist image
      if (headerFound && i === middleH3Index && artistData?.image) {
        const artistImagePath = `/assets/${dateStr}-listened-to-this-week/artists/${normalizeForFilename(artist)}.jpg`
        const altText = escapeQuotes(artist)
        enrichedLines.push('')
        enrichedLines.push(`<Img src="${artistImagePath}" alt="${altText}" fullWidth="true" />`)
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

  async researchAlbum(artist, album) {
    // Initialize cache if not done yet
    await this.searchCache.init()

    // Check cache first
    const cacheKey = `${this.searchProvider}-tool`
    const cachedResearch = await this.searchCache.get(artist, album, cacheKey)
    if (cachedResearch) {
      console.log(`    ✓ Using cached research for ${album}`)
      return cachedResearch
    }

    // If no tools available, use fallback
    if (this.tools.length === 0) {
      console.log(`    No search tools available, using fallback`)
      return this.generateFallbackSection(artist, album)
    }

    try {
      // Use LLM with tool-calling (like CrewAI agent with tools)
      console.log(`    Agent researching ${album} by ${artist}...`)

      const systemPrompt = `## Your Role: Music Research Agent

You are an expert Music Blogger writing sections of a weekly music blog post. You have:
- A passion for music of all genres
- Expertise in music history, recording techniques, and cultural context
- A talent for making complex music topics accessible and engaging
- Enthusiasm for sharing interesting facts and stories with readers

## Tools Available
You have access to a music search tool that researches albums using authoritative sources.

Use this tool to research albums before writing about them.

## Your Task
1. **FIRST**: Use the search tool to research "${album}" by ${artist}
   - Search for: album reviews, critical analysis, recording details, legacy, cultural impact
   - Read the search results carefully

2. **THEN**: Write a well-structured blog section (350-450 words) with:
   - H2 header: Album title by Artist (with emoji)
   - 3-4 H3 subsections covering: recording/creation, musical style, cultural impact, and legacy
   - Interesting facts, stories, and context throughout
   - Markdown format with emojis in headers
   - NOT using H1 headers (only H2 and H3)

## Voice and Style
✅ DO write like this:
- "Released in 1975, Wish You Were Here explores themes of absence and longing..."
- "The recording journey was marked by innovation and experimentation..."
- "What makes this album stand out is its fusion of..."

❌ DON'T write like this:
- "Sources indicate that critics note..." (too academic)
- "The supplied research shows..." (too meta)
- Brief summaries (too shallow)

Write as if you're a knowledgeable friend excitedly telling someone about a great album.

Remember: FIRST use the search tool to research, THEN write your section based on what you found.`

      // Bind tools to LLM for tool-calling
      const llmWithTools = this.llm.bindTools(this.tools)

      // Initial message to trigger tool use
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Research and write a comprehensive blog section about "${album}" by ${artist}. Start by using the search tool to gather information.` }
      ]

      // First call - LLM should call the tool
      let response = await llmWithTools.invoke(messages)

      // Process tool calls if any
      while (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`    Agent using search tool...`)

        // Add AI response to messages
        messages.push(response)

        // Execute tool calls
        for (const toolCall of response.tool_calls) {
          console.log(`    → Tool: ${toolCall.name}`)
          console.log(`    → Query: ${toolCall.args.query || toolCall.args.input || '(no query)'}`)

          const tool = this.tools.find(t => t.name === toolCall.name)
          if (tool) {
            const toolResult = await tool._call(toolCall.args.query || toolCall.args.input || '')
            console.log(`    → Found ${toolResult.split('\n\n---\n\n').length} sources`)

            messages.push({
              role: 'tool',
              content: toolResult,
              tool_call_id: toolCall.id
            })
          }
        }

        // Get next response from LLM (should write the section now)
        console.log(`    Agent processing results...`)
        response = await llmWithTools.invoke(messages)
      }

      console.log(`    ✓ Agent completed research and writing`)

      const finalContent = this.sanitizeOutput(response.content)

      // Cache the result
      if (finalContent) {
        await this.searchCache.set(artist, album, finalContent, cacheKey)
      }

      return finalContent
    } catch (error) {
      console.log(`    Research error for ${album}: ${error.message}`)
      console.log(`    Error details:`, error)
      return this.generateFallbackSection(artist, album)
    }
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
