import { SearchCache } from './search-cache.js'

/**
 * Album Classifier - Classifies albums by genre, era, type, etc.
 *
 * Uses a hybrid approach:
 * 1. First tries to infer classification from collection metadata
 * 2. Falls back to LLM classification when metadata is insufficient
 *
 * Classification is cached for 90 days (configurable) since album metadata rarely changes.
 */
export class AlbumClassifier {
  constructor(llm, config) {
    this.llm = llm
    this.config = config
    this.cache = new SearchCache('scripts/.classification-cache')
    this.cacheDays = config?.settings?.classification_cache_days || 90
  }

  /**
   * Classify an album based on artist and album name + collection metadata
   * @param {string} artist - Artist name
   * @param {string} album - Album name
   * @param {Object} collectionData - Metadata from russ.fm collection (genres, release_year, biography)
   * @returns {Object} Classification object
   */
  async classify(artist, album, collectionData = {}) {
    // Initialize cache
    await this.cache.init()

    // Check cache first (classifications change less often than research)
    const cacheKey = 'classification'
    const cached = await this.cache.get(artist, album, cacheKey)
    if (cached) {
      console.log(`    ✓ Using cached classification for ${album}`)
      return cached
    }

    // Try metadata inference first
    const inferred = this.inferFromMetadata(artist, album, collectionData)

    if (inferred.confidence >= 0.7) {
      console.log(`    ✓ Inferred classification from metadata (confidence: ${(inferred.confidence * 100).toFixed(0)}%)`)
      await this.cache.set(artist, album, inferred.classification, cacheKey)
      return inferred.classification
    }

    // Fall back to LLM classification
    try {
      console.log(`    Classifying via LLM (metadata confidence: ${(inferred.confidence * 100).toFixed(0)}%)...`)
      const classification = await this.classifyWithLLM(artist, album, collectionData, inferred.classification)

      // Cache the result
      await this.cache.set(artist, album, classification, cacheKey)

      const genreDisplay = classification.genre?.primary || 'unknown'
      const eraDisplay = classification.era?.decade || 'unknown'
      console.log(`    ✓ Classified as: ${genreDisplay} / ${eraDisplay}`)

      return classification

    } catch (error) {
      console.warn(`    ⚠ LLM classification failed: ${error.message}`)
      // Return the best we have from metadata inference
      await this.cache.set(artist, album, inferred.classification, cacheKey)
      return inferred.classification
    }
  }

  /**
   * Infer classification from collection metadata and album name patterns
   */
  inferFromMetadata(artist, album, collectionData) {
    const patterns = this.config?.classification?.metadata_patterns || {}
    let confidence = 0.3 // Base confidence
    const classification = this.getDefaultClassification()

    const albumLower = album.toLowerCase()
    const artistLower = artist.toLowerCase()

    // --- Genre inference from collection data ---
    if (collectionData.genres && collectionData.genres.length > 0) {
      const primaryGenre = this.mapGenreToConfig(collectionData.genres[0])
      const secondaryGenres = collectionData.genres.slice(1).map(g => this.mapGenreToConfig(g))

      classification.genre = {
        primary: primaryGenre,
        secondary: secondaryGenres.filter(g => g !== primaryGenre),
        subgenre: collectionData.genres[0] // Keep original as subgenre
      }
      confidence += 0.25
    }

    // --- Era inference from release year ---
    if (collectionData.release_year) {
      const year = collectionData.release_year
      const decade = this.yearToDecade(year)
      const eraLabel = this.yearToEraLabel(year)

      classification.era = {
        decade,
        year_released: year,
        era_label: eraLabel
      }
      confidence += 0.2
    }

    // --- Album type inference from name patterns ---

    // Check for compilation keywords
    if (patterns.compilation_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.format = 'compilation'
      confidence += 0.15
    }

    // Check for live keywords
    if (patterns.live_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.format = 'live'
      confidence += 0.15
    }

    // Check for soundtrack keywords
    if (patterns.soundtrack_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.format = 'soundtrack'
      confidence += 0.15
    }

    // Check for reissue keywords
    if (patterns.reissue_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.is_reissue = true
      confidence += 0.05
    }

    // Check for EP keywords
    if (patterns.ep_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.format = 'ep'
      confidence += 0.15
    }

    // Check for box set keywords
    if (patterns.box_set_keywords?.some(k => albumLower.includes(k.toLowerCase()))) {
      classification.type.format = 'box-set'
      confidence += 0.15
    }

    // --- Artist type inference ---

    // Check for "Various" artist (various artists compilation)
    if (artistLower === 'various' || artistLower === 'various artists') {
      classification.artist_type.category = 'various-artists'
      if (classification.type.format === 'studio') {
        classification.type.format = 'compilation'
      }
      confidence += 0.1
    }

    // --- Biography-based hints ---
    if (collectionData.biography) {
      const bioLower = collectionData.biography.toLowerCase()

      // Try to detect if band or solo
      if (bioLower.includes(' band ') || bioLower.includes(' group ') || bioLower.includes(' duo ') || bioLower.includes(' trio ')) {
        classification.artist_type.category = 'band'
      } else if (bioLower.includes(' singer ') || bioLower.includes(' songwriter ') || bioLower.includes(' musician ') || bioLower.includes(' composer ')) {
        classification.artist_type.category = 'solo'
      }
    }

    // Cap confidence at 0.95
    confidence = Math.min(confidence, 0.95)

    return { classification, confidence }
  }

  /**
   * Classify using LLM when metadata inference is insufficient
   */
  async classifyWithLLM(artist, album, collectionData, partialClassification) {
    const systemPrompt = this.config?.classification?.system_prompt || this.getDefaultSystemPrompt()

    // Build context from available metadata
    const genres = collectionData.genres?.join(', ') || 'Unknown'
    const releaseYear = collectionData.release_year || 'Unknown'
    const biography = collectionData.biography || 'No biography available'

    const instructionTemplate = this.config?.classification?.instruction || this.getDefaultInstruction()
    const instruction = this.interpolate(instructionTemplate, {
      artist,
      album,
      genres,
      release_year: releaseYear,
      biography: biography.substring(0, 500) // Limit biography length
    })

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: instruction }
    ])

    // Parse JSON response
    const classification = this.parseClassification(response.content)

    // Merge with partial classification (prefer LLM results but keep metadata-derived values as fallback)
    return this.mergeClassifications(classification, partialClassification)
  }

  /**
   * Parse JSON from LLM response, handling markdown code blocks
   */
  parseClassification(content) {
    // Remove markdown code blocks if present
    let jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    try {
      return JSON.parse(jsonStr)
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch (e2) {
          throw new Error('Could not parse classification JSON')
        }
      }
      throw new Error('Could not parse classification JSON')
    }
  }

  /**
   * Merge LLM classification with partial metadata-derived classification
   */
  mergeClassifications(llmClassification, metadataClassification) {
    return {
      genre: {
        primary: llmClassification.genre?.primary || metadataClassification.genre?.primary || 'rock',
        secondary: llmClassification.genre?.secondary || metadataClassification.genre?.secondary || [],
        subgenre: llmClassification.genre?.subgenre || metadataClassification.genre?.subgenre || null
      },
      era: {
        decade: llmClassification.era?.decade || metadataClassification.era?.decade || '2020s',
        year_released: metadataClassification.era?.year_released || llmClassification.era?.year_released || null, // Prefer metadata for year
        era_label: llmClassification.era?.era_label || metadataClassification.era?.era_label || 'modern'
      },
      type: {
        format: metadataClassification.type?.format !== 'studio'
          ? metadataClassification.type?.format  // Prefer detected format from metadata
          : (llmClassification.type?.format || 'studio'),
        is_debut: llmClassification.type?.is_debut || false,
        is_farewell: llmClassification.type?.is_farewell || false,
        is_comeback: llmClassification.type?.is_comeback || false,
        is_concept: llmClassification.type?.is_concept || false,
        is_reissue: metadataClassification.type?.is_reissue || llmClassification.type?.is_reissue || false
      },
      artist_type: {
        category: metadataClassification.artist_type?.category !== 'band'
          ? metadataClassification.artist_type?.category  // Prefer detected category
          : (llmClassification.artist_type?.category || 'band'),
        is_side_project: llmClassification.artist_type?.is_side_project || false,
        career_stage: llmClassification.artist_type?.career_stage || 'peak'
      },
      significance: {
        critical_acclaim: llmClassification.significance?.critical_acclaim || 'mixed',
        commercial_success: llmClassification.significance?.commercial_success || 'moderate',
        cultural_impact: llmClassification.significance?.cultural_impact || 'notable'
      },
      themes: llmClassification.themes || []
    }
  }

  /**
   * Get default classification when all else fails
   */
  getDefaultClassification() {
    return {
      genre: { primary: 'rock', secondary: [], subgenre: null },
      era: { decade: '2020s', year_released: null, era_label: 'modern' },
      type: { format: 'studio', is_debut: false, is_farewell: false, is_comeback: false, is_concept: false, is_reissue: false },
      artist_type: { category: 'band', is_side_project: false, career_stage: 'peak' },
      significance: { critical_acclaim: 'mixed', commercial_success: 'moderate', cultural_impact: 'notable' },
      themes: []
    }
  }

  /**
   * Map genre from collection to config genre key
   */
  mapGenreToConfig(genre) {
    if (!genre) return 'rock'

    const genreMap = {
      // Direct mappings
      'rock': 'rock',
      'pop': 'pop',
      'electronic': 'electronic',
      'jazz': 'jazz',
      'classical': 'classical',
      'folk': 'folk',
      'country': 'country',
      'blues': 'blues',
      'reggae': 'reggae',
      'soul': 'soul',
      'punk': 'punk',
      'metal': 'metal',
      'ambient': 'ambient',
      'disco': 'disco',
      'funk': 'funk',
      'ska': 'ska',

      // Compound/variant mappings
      'alternative rock': 'alternative',
      'indie rock': 'indie',
      'progressive rock': 'prog',
      'hard rock': 'rock',
      'classic rock': 'rock',
      'psychedelic rock': 'rock',
      'synth-pop': 'synth-pop',
      'new wave': 'new-wave',
      'post-punk': 'new-wave',
      'hip hop': 'hip-hop',
      'hip-hop': 'hip-hop',
      'rap': 'hip-hop',
      'r&b': 'r&b',
      'rhythm and blues': 'r&b',
      'funk / soul': 'funk',
      'heavy metal': 'metal',
      'world': 'world',
      'latin': 'world',
      'folk, world, & country': 'folk'
    }

    const normalized = genre.toLowerCase().trim()
    return genreMap[normalized] || 'rock'
  }

  /**
   * Convert year to decade string
   */
  yearToDecade(year) {
    if (!year || year < 1950) return '2020s'
    const decadeStart = Math.floor(year / 10) * 10
    return `${decadeStart}s`
  }

  /**
   * Convert year to era label
   */
  yearToEraLabel(year) {
    if (!year) return 'modern'
    if (year < 1955) return 'pre-rock'
    if (year < 1970) return 'classic-rock'
    if (year < 1978) return 'classic-rock'
    if (year < 1985) return 'punk-era'
    if (year < 1990) return 'new-wave'
    if (year < 1998) return 'grunge-era'
    if (year < 2005) return 'britpop'
    return 'modern'
  }

  /**
   * Simple string interpolation
   */
  interpolate(template, context) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return context[key] !== undefined ? context[key] : match
    })
  }

  getDefaultSystemPrompt() {
    return `You are a music classification expert. Your task is to analyze an album and categorize it across multiple dimensions. Be precise and consistent. Return your classification as valid JSON with no additional text or markdown.`
  }

  getDefaultInstruction() {
    return `Classify the album "{album}" by {artist}. Return a JSON object with: genre, era, type, artist_type, significance, and themes.`
  }
}
