/**
 * Question Composer - Composes dynamic research questions from album classification
 *
 * Takes album classification and returns contextually appropriate questions
 * by combining base questions with dimension-specific questions.
 */
export class QuestionComposer {
  constructor(config) {
    this.questions = config?.questions || {}
  }

  /**
   * Compose research questions based on album classification
   * @param {Object} classification - The classification result
   * @returns {string[]} Array of research questions
   */
  composeQuestions(classification) {
    const questions = []

    // Always include base questions
    questions.push(...(this.questions.base || []))

    // Add era-specific questions
    const eraQuestions = this.getEraQuestions(classification.era)
    questions.push(...eraQuestions)

    // Add genre-specific questions
    const genreQuestions = this.getGenreQuestions(classification.genre)
    questions.push(...genreQuestions)

    // Add type-specific questions
    const typeQuestions = this.getTypeQuestions(classification.type)
    questions.push(...typeQuestions)

    // Add artist-type questions
    const artistQuestions = this.getArtistTypeQuestions(classification.artist_type)
    questions.push(...artistQuestions)

    // Add significance questions
    const significanceQuestions = this.getSignificanceQuestions(classification)
    questions.push(...significanceQuestions)

    // Deduplicate and limit to reasonable number
    const uniqueQuestions = [...new Set(questions)]
    return uniqueQuestions.slice(0, 8) // Limit to 8 questions max
  }

  /**
   * Get era-specific questions based on decade
   */
  getEraQuestions(era) {
    if (!era?.decade) return []
    const eraConfig = this.questions.era || {}
    return eraConfig[era.decade] || []
  }

  /**
   * Get genre-specific questions
   */
  getGenreQuestions(genre) {
    if (!genre?.primary) return []
    const genreConfig = this.questions.genre || {}

    // Normalize genre to match config keys
    const normalizedGenre = this.normalizeGenre(genre.primary)
    return genreConfig[normalizedGenre] || genreConfig.default || []
  }

  /**
   * Get album type questions
   */
  getTypeQuestions(type) {
    if (!type?.format) return []
    const typeConfig = this.questions.type || {}
    return typeConfig[type.format] || typeConfig.default || []
  }

  /**
   * Get artist type questions
   */
  getArtistTypeQuestions(artistType) {
    if (!artistType?.category) return []
    const artistConfig = this.questions.artist_type || {}
    return artistConfig[artistType.category] || artistConfig.default || []
  }

  /**
   * Get significance questions based on album characteristics
   */
  getSignificanceQuestions(classification) {
    const questions = []
    const sigConfig = this.questions.significance || {}

    // Add questions based on album characteristics
    if (classification.type?.is_debut) {
      questions.push(...(sigConfig.debut || []))
    }
    if (classification.type?.is_farewell) {
      questions.push(...(sigConfig.farewell || []))
    }
    if (classification.type?.is_comeback) {
      questions.push(...(sigConfig.comeback || []))
    }
    if (classification.type?.is_concept) {
      questions.push(...(sigConfig.concept || []))
    }

    // Add questions based on cultural impact
    const impact = classification.significance?.cultural_impact
    if (impact === 'landmark') {
      questions.push(...(sigConfig.landmark || []))
    } else if (impact === 'influential') {
      questions.push(...(sigConfig.influential || []))
    } else if (classification.significance?.commercial_success === 'cult') {
      questions.push(...(sigConfig.cult || []))
    }

    // If no specific significance questions, add default
    if (questions.length === 0) {
      questions.push(...(sigConfig.default || []))
    }

    return questions
  }

  /**
   * Normalize genre string to match config keys
   */
  normalizeGenre(genre) {
    if (!genre) return 'default'

    const genreMap = {
      // Rock variants
      'rock': 'rock',
      'alternative rock': 'alternative',
      'indie rock': 'indie',
      'hard rock': 'rock',
      'classic rock': 'rock',
      'progressive rock': 'prog',
      'prog rock': 'prog',
      'post-rock': 'rock',
      'garage rock': 'rock',
      'psychedelic rock': 'rock',
      'art rock': 'prog',

      // Electronic variants
      'electronic': 'electronic',
      'electronica': 'electronic',
      'edm': 'electronic',
      'techno': 'electronic',
      'house': 'electronic',
      'trance': 'electronic',
      'idm': 'electronic',

      // Jazz variants
      'jazz': 'jazz',
      'jazz fusion': 'jazz',
      'bebop': 'jazz',
      'smooth jazz': 'jazz',

      // Pop variants
      'pop': 'pop',
      'pop rock': 'pop',
      'dance-pop': 'pop',
      'electropop': 'synth-pop',
      'indie pop': 'indie',
      'dream pop': 'indie',
      'art pop': 'pop',

      // Synth-pop / New wave
      'synth-pop': 'synth-pop',
      'synthpop': 'synth-pop',
      'synthwave': 'synth-pop',
      'new wave': 'new-wave',
      'new-wave': 'new-wave',
      'post-punk': 'new-wave',

      // Hip-hop variants
      'hip-hop': 'hip-hop',
      'hip hop': 'hip-hop',
      'rap': 'hip-hop',
      'trap': 'hip-hop',

      // Metal variants
      'metal': 'metal',
      'heavy metal': 'metal',
      'thrash metal': 'metal',
      'death metal': 'metal',
      'black metal': 'metal',
      'doom metal': 'metal',
      'progressive metal': 'metal',
      'nu metal': 'metal',

      // Folk variants
      'folk': 'folk',
      'folk rock': 'folk',
      'indie folk': 'folk',
      'americana': 'country',

      // Soul / R&B variants
      'soul': 'soul',
      'neo-soul': 'soul',
      'r&b': 'r&b',
      'rnb': 'r&b',
      'rhythm and blues': 'r&b',
      'motown': 'soul',

      // Punk variants
      'punk': 'punk',
      'punk rock': 'punk',
      'hardcore punk': 'punk',
      'pop punk': 'punk',
      'emo': 'punk',

      // Other genres
      'classical': 'classical',
      'country': 'country',
      'reggae': 'reggae',
      'dub': 'reggae',
      'ska': 'ska',
      'ambient': 'ambient',
      'indie': 'indie',
      'alternative': 'alternative',
      'blues': 'blues',
      'disco': 'disco',
      'funk': 'funk',
      'funk / soul': 'funk',
      'world': 'world',
      'world music': 'world',
      'latin': 'world',
      'afrobeat': 'world',

      // Progressive
      'prog': 'prog',
      'progressive': 'prog'
    }

    const normalized = genre.toLowerCase().trim()
    return genreMap[normalized] || 'default'
  }

  /**
   * Format questions as a numbered list for prompts
   */
  formatQuestionsForPrompt(questions) {
    return questions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n')
  }

  /**
   * Get focus areas string for search tool prompts
   */
  getFocusAreas(classification) {
    const areas = []

    if (classification.genre?.primary) {
      areas.push(`Genre context: ${classification.genre.primary}`)
      if (classification.genre.secondary?.length > 0) {
        areas.push(`Related genres: ${classification.genre.secondary.join(', ')}`)
      }
    }

    if (classification.era?.decade) {
      areas.push(`Era: ${classification.era.decade}${classification.era.era_label ? ` (${classification.era.era_label})` : ''}`)
    }

    if (classification.type?.format && classification.type.format !== 'studio') {
      areas.push(`Album format: ${classification.type.format}`)
    }

    if (classification.type?.is_debut) {
      areas.push(`Debut album - focus on artist emergence and first impressions`)
    }
    if (classification.type?.is_concept) {
      areas.push(`Concept album - explore thematic narrative`)
    }
    if (classification.type?.is_comeback) {
      areas.push(`Comeback album - compare to earlier work`)
    }

    if (classification.significance?.cultural_impact === 'landmark') {
      areas.push(`Landmark album - emphasize historical importance and influence`)
    } else if (classification.significance?.cultural_impact === 'influential') {
      areas.push(`Influential album - trace its impact on later artists`)
    }

    if (classification.themes?.length > 0) {
      areas.push(`Key themes: ${classification.themes.join(', ')}`)
    }

    return areas.length > 0
      ? '- ' + areas.join('\n- ')
      : 'General album background and critical reception'
  }
}
