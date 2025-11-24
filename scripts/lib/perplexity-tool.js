import { Tool } from '@langchain/core/tools'
import { ChatOpenAI } from '@langchain/openai'

/**
 * LangChain Tool wrapper for Perplexity AI
 * Uses Perplexity's search-augmented LLM to research music topics
 */
export class PerplexityMusicSearchTool extends Tool {
  constructor(apiKey) {
    super()
    this.name = 'perplexity_music_search'
    this.description = `Searches for comprehensive information about music albums using Perplexity AI.
    This tool combines web search with AI analysis to provide detailed, factual information about albums, artists, recording history, and cultural impact.
    Input should be a query about an album or artist (e.g., "Around the World in a Day by Prince recording history and critical reception").
    Returns a comprehensive research summary from multiple sources.`

    // Perplexity uses OpenAI-compatible API but needs proper configuration
    this.perplexity = new ChatOpenAI({
      modelName: 'sonar-pro', // Perplexity's advanced search model (supports complex queries)
      apiKey: apiKey, // Use apiKey instead of openAIApiKey for custom base URLs
      configuration: {
        baseURL: 'https://api.perplexity.ai'
      },
      temperature: 0.2, // Lower temp for factual research
    })
  }

  async _call(query) {
    try {
      const researchPrompt = `Research the following music topic and provide comprehensive, factual information from authoritative music sources:

${query}

Focus on:
- Album/artist background and recording history
- Critical reception and reviews from music journalism
- Musical style, innovations, and cultural context
- Legacy and influence on other artists
- Interesting facts and anecdotes

Provide detailed, well-organized information suitable for writing an engaging music blog post. Include specific facts like release dates, producers, studios, chart performance, and critical quotes when available.`

      const response = await this.perplexity.invoke(researchPrompt)

      return response.content || 'No information found.'
    } catch (error) {
      console.error(`Perplexity search error: ${error.message}`)
      return `Search error: ${error.message}`
    }
  }
}
