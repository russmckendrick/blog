import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ConfigLoader } from './config-loader.js'
import { normalizeForFilename, lookupArtistData, lookupAlbumData, escapeQuotes } from './text-utils.js'
import { SearchCache } from './search-cache.js'
import { ExaMusicSearchTool } from './exa-tool.js'
import { PerplexityMusicSearchTool } from './perplexity-tool.js'
import { AlbumClassifier } from './album-classifier.js'
import { QuestionComposer } from './question-composer.js'

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

    // Initialize classifier and question composer for dynamic questions
    if (config) {
      this.classifier = new AlbumClassifier(this.llm, config.config || config)
      this.questionComposer = new QuestionComposer(config.config || config)
    }

    // Initialize search tools for agent (priority: Perplexity > Exa > Tavily)
    this.tools = []
    this.searchProvider = 'none'
    this.perplexityTool = null

    if (process.env.PERPLEXITY_API_KEY) {
      this.perplexityTool = new PerplexityMusicSearchTool(
        process.env.PERPLEXITY_API_KEY,
        config?.config || config
      )
      this.tools.push(this.perplexityTool)
      this.searchProvider = 'Perplexity AI (search + LLM)'
      console.log('Using Perplexity AI - search-augmented LLM for research')
    } else if (process.env.EXA_API_KEY) {
      this.tools.push(new ExaMusicSearchTool(
        process.env.EXA_API_KEY,
        config?.config || config
      ))
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
        // Get collection metadata for this album
        const albumData = lookupAlbumData(artist, album, collectionInfo)
        const artistData = lookupArtistData(artist, collectionInfo)

        // Build collection context for classification
        const collectionContext = {
          genres: albumData?.genres || [],
          release_year: albumData?.release_year || null,
          biography: artistData?.biography || null
        }

        const section = await this.researchAlbum(artist, album, collectionContext)
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

  async researchAlbum(artist, album, collectionContext = {}) {
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
      // ========================================
      // PHASE 1: Classify the album
      // ========================================
      let classification = null
      let formattedQuestions = ''
      let focusAreas = ''

      if (this.classifier && this.questionComposer) {
        classification = await this.classifier.classify(artist, album, collectionContext)

        // PHASE 2: Compose dynamic questions based on classification
        const questions = this.questionComposer.composeQuestions(classification)
        formattedQuestions = this.questionComposer.formatQuestionsForPrompt(questions)
        focusAreas = this.questionComposer.getFocusAreas(classification)

        console.log(`    Generated ${questions.length} contextual questions`)

        // Set focus areas for search tools
        if (this.perplexityTool) {
          this.perplexityTool.setFocusAreas(focusAreas)
        }
      }

      // ========================================
      // PHASE 3: Research with dynamic context
      // ========================================
      console.log(`    Agent researching ${album} by ${artist}...`)

      // Build system prompt from config or use default
      const systemPrompt = this.buildSystemPrompt(artist, album, classification, formattedQuestions)
      const userMessage = this.buildUserMessage(artist, album, formattedQuestions)

      // Bind tools to LLM for tool-calling
      const llmWithTools = this.llm.bindTools(this.tools)

      // Initial message to trigger tool use
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
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

  /**
   * Build system prompt from config template or use default
   */
  buildSystemPrompt(artist, album, classification, formattedQuestions) {
    // Try to use config-based prompt
    if (this.config && classification) {
      const context = {
        artist,
        album,
        genre_primary: classification.genre?.primary || 'unknown',
        genre_secondary: (classification.genre?.secondary || []).join(', ') || 'none',
        era_decade: classification.era?.decade || 'unknown',
        era_label: classification.era?.era_label || 'unknown',
        album_type: classification.type?.format || 'studio',
        artist_category: classification.artist_type?.category || 'band',
        significance_label: this.getSignificanceLabel(classification),
        research_questions: formattedQuestions
      }

      const configPrompt = this.config.getAgentSystemPrompt
        ? this.config.getAgentSystemPrompt(context)
        : null

      if (configPrompt) {
        return configPrompt
      }
    }

    // Default system prompt (backwards compatible)
    return `## Your Role: Music Research Agent

You are an expert Music Blogger writing sections of a weekly music blog post. You have:
- A passion for music of all genres
- Expertise in music history, recording techniques, and cultural context
- A talent for making complex music topics accessible and engaging
- Enthusiasm for sharing interesting facts and stories with readers

${classification ? `## Album Context
You are researching: "${album}" by ${artist}
Classification: ${classification.genre?.primary || 'unknown'} / ${classification.era?.decade || 'unknown'}
` : ''}
${formattedQuestions ? `## Research Questions
Focus your research on answering these contextual questions:

${formattedQuestions}
` : ''}
## Tools Available
You have access to a music search tool that researches albums using authoritative sources.
Use this tool to research albums before writing about them.

## Your Task
1. **FIRST**: Use the search tool to research "${album}" by ${artist}
   - Search for: album reviews, critical analysis, recording details, legacy, cultural impact
   - Read the search results carefully

2. **THEN**: Write a well-structured blog section (350-450 words) with:
   - H2 header: Album title by Artist (with emoji)
   - 3-4 H3 subsections that address the research questions
   - Interesting facts, stories, and context throughout
   - Markdown format with emojis in headers
   - NOT using H1 headers (only H2 and H3)

## Voice and Style
Write as if you're a knowledgeable friend excitedly telling someone about a great album.

DO write like this:
- "Released in 1975, Wish You Were Here explores themes of absence and longing..."
- "The recording journey was marked by innovation and experimentation..."
- "What makes this album stand out is its fusion of..."

DON'T write like this:
- "Sources indicate that critics note..." (too academic)
- "The supplied research shows..." (too meta)
- Brief summaries (too shallow)

Remember: FIRST use the search tool to research, THEN write your section based on what you found.`
  }

  /**
   * Build user message from config template or use default
   */
  buildUserMessage(artist, album, formattedQuestions) {
    // Try to use config-based message
    if (this.config && formattedQuestions) {
      const context = {
        artist,
        album,
        research_questions: formattedQuestions
      }

      const configMessage = this.config.getAgentUserMessage
        ? this.config.getAgentUserMessage(context)
        : null

      if (configMessage) {
        return configMessage
      }
    }

    // Default user message
    return `Research and write a comprehensive blog section about "${album}" by ${artist}. Start by using the search tool to gather information.${formattedQuestions ? `\n\nFocus on these questions:\n${formattedQuestions}` : ''}`
  }

  /**
   * Get a human-readable significance label from classification
   */
  getSignificanceLabel(classification) {
    const parts = []
    if (classification.type?.is_debut) parts.push('debut')
    if (classification.type?.is_farewell) parts.push('farewell')
    if (classification.type?.is_comeback) parts.push('comeback')
    if (classification.type?.is_concept) parts.push('concept')
    if (classification.significance?.cultural_impact === 'landmark') parts.push('landmark')
    if (classification.significance?.cultural_impact === 'influential') parts.push('influential')
    return parts.length > 0 ? parts.join(', ') : 'notable release'
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
    // Try to use config-based fallback
    if (this.config) {
      const context = { artist, album }
      const configFallback = this.config.getFallbackSection
        ? this.config.getFallbackSection(context)
        : null

      if (configFallback) {
        return configFallback
      }
    }

    // Default fallback
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
