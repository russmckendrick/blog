import { Tool } from '@langchain/core/tools'
import Exa from 'exa-js'

// Default domains if not provided in config
const DEFAULT_DOMAINS = [
  'pitchfork.com',
  'allmusic.com',
  'rollingstone.com',
  'theguardian.com',
  'nme.com',
  'metacritic.com',
  'albumoftheyear.org',
  'consequence.net',
  'stereogum.com'
]

/**
 * LangChain Tool wrapper for Exa AI search
 */
export class ExaMusicSearchTool extends Tool {
  constructor(apiKey, config = null) {
    super()
    this.config = config
    this.name = 'exa_music_search'

    // Use description from config or default
    const configDesc = config?.tools?.exa?.description
    this.description = configDesc || `Searches music journalism sites for album reviews, critical analysis, and historical context about music albums.
    Input should be a search query about an album or artist (e.g., "Around the World in a Day by Prince review analysis").
    Returns comprehensive excerpts from authoritative music journalism sources like Pitchfork, AllMusic, Rolling Stone, etc.`

    // Use domains from config or defaults
    this.domains = config?.tools?.exa?.domains || DEFAULT_DOMAINS

    this.exa = new Exa(apiKey)
  }

  async _call(query) {
    try {
      const searchResults = await this.exa.searchAndContents(query, {
        type: 'auto',
        numResults: 5,
        text: {
          maxCharacters: 3000
        },
        // Prioritize music journalism sites from config
        includeDomains: this.domains
      })

      if (!searchResults.results || searchResults.results.length === 0) {
        return 'No results found. Try a different search query.'
      }

      // Format results for LLM consumption
      const formattedResults = searchResults.results.map((result, idx) => {
        return `[Source ${idx + 1}]: ${result.title}
URL: ${result.url}
${result.text || 'No content available'}`
      }).join('\n\n---\n\n')

      return `Found ${searchResults.results.length} sources from music journalism:\n\n${formattedResults}`
    } catch (error) {
      return `Search error: ${error.message}`
    }
  }
}
