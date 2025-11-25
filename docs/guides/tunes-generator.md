# Tunes Blog Post Generator

Automatically generates weekly music blog posts based on Last.fm listening data, with AI-powered album research and content generation.

## Features

- **Last.fm Integration**: Fetches weekly listening statistics (top artists and albums)
- **Collection Metadata**: Pulls album/artist images and links from russ.fm
- **AI Content Generation**: Uses LangChain with OpenAI or Anthropic to:
  - Generate engaging titles and summaries
  - Research albums and write detailed sections
  - Optional web search for factual information
- **Image Management**: Downloads and organizes artist/album artwork
- **MDX Output**: Generates properly formatted MDX files with Astro compatibility

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**

   Copy `.env.example` to `.env` and fill in your credentials:

   ```bash
   # Required
   LASTFM_USER=your-lastfm-username
   LASTFM_API_KEY=your-lastfm-api-key
   COLLECTION_URL=https://www.russ.fm

   # AI Provider (choose one)
   OPENAI_API_KEY=your-openai-api-key
   # OR
   ANTHROPIC_API_KEY=your-anthropic-api-key

   # Optional: Enhanced album research
   TAVILY_API_KEY=your-tavily-api-key

   # Optional: FAL.ai for AI-generated collages
   FAL_KEY=your-fal-ai-api-key
   ```

3. **Get API Keys**
   - **Last.fm**: https://www.last.fm/api/account/create
   - **OpenAI**: https://platform.openai.com/api-keys
   - **Anthropic**: https://console.anthropic.com/
   - **Tavily** (optional): https://tavily.com/
   - **FAL.ai** (optional): https://fal.ai/dashboard

## Usage

### Generate Weekly Post

```bash
npm run tunes
```

This generates a post for the previous week (7 days ago to now).

### Custom Week

```bash
npm run tunes -- --week_start=2025-09-25
```

### Debug Mode (Single Album)

```bash
npm run tunes -- --debug
```

## Output Structure

Posts are created in:
- **Content**: `src/content/tunes/YYYY-MM-DD-listened-to-this-week/index.mdx`
- **Images**: `src/assets/YYYY-MM-DD-listened-to-this-week/artists/` and `albums/`

### Generated Post Includes

- ✅ Frontmatter with title, description, date, hero image
- ✅ AI-generated album research sections with:
  - Album cover image (after H2 header)
  - Artist image (after first H3 subsection)
  - Emojis and markdown formatting
  - Links to russ.fm for album and artist
- ✅ Top artists list with play counts
- ✅ Top albums list with play counts

## How It Works

1. **Fetch Data**: Retrieves weekly charts from Last.fm API
2. **Get Metadata**: Downloads collection data from russ.fm (images, links, genres, release years)
3. **AI Research**: For each album (two-phase approach):
   - **Phase 1 - Classification**: Classifies the album by genre, era, type, artist type, and significance
     - Uses collection metadata (genres, release year, biography) when confident
     - Falls back to LLM classification when metadata is insufficient
   - **Phase 2 - Dynamic Questions**: Generates contextual research questions based on classification
     - Base questions (all albums) + era-specific + genre-specific + type-specific + significance questions
   - **Phase 3 - Research**: Uses search tools with contextual focus areas to gather information
   - AI generates engaging blog section (350-450 words) tailored to the album's characteristics
4. **Download Images**: Fetches high-res artist/album artwork
5. **Render MDX**: Creates formatted blog post with galleries and links

## Architecture

### Core Components

- `generate-tunes-post.js` - Main orchestrator
- `lib/lastfm-client.js` - Last.fm API client
- `lib/collection-manager.js` - russ.fm data fetcher/processor (genres, release years, biographies)
- `lib/content-generator.js` - AI content generation with two-phase classification/research
- `lib/album-classifier.js` - Hybrid metadata/LLM album classification
- `lib/question-composer.js` - Dynamic question composition from classification
- `lib/config-loader.js` - YAML configuration loader
- `lib/image-handler.js` - Image downloading
- `lib/blog-post-renderer.js` - MDX template renderer
- `lib/perplexity-tool.js` - Perplexity AI search tool (config-driven)
- `lib/exa-tool.js` - Exa AI search tool (config-driven)
- `strip-collage.js` - Local Sharp-based torn-paper collage generator
- `fal-collage.js` - AI-powered collage using FAL.ai Gemini 3 Pro Image (alternative)

### AI Models Used

- **Anthropic**: Claude 3.5 Sonnet (default if key available)
- **OpenAI**: GPT-4 Turbo (fallback)
- **Web Search**: Tavily API (optional, for factual research)
- **Image Generation**: FAL.ai Gemini 3 Pro Image (optional, for AI-powered collages)

## Cover Collage Generation

The tunes generator creates custom cover images for each weekly post. Two collage generators are available:

### Strip Collage (Default)

**File**: `scripts/strip-collage.js`

A local Sharp-based generator that creates torn-paper strip collages:
- **Style**: Vertical strips with torn edges and slight rotation (±4°)
- **Source**: Uses original album artwork colors (no tinting)
- **Coverage**: Full edge-to-edge with intelligent seam guards
- **Deduplication**: Each album appears exactly once
- **Performance**: Fast, runs locally without API calls
- **Deterministic**: Uses post date as seed for consistent regeneration

**Usage in generate-tunes-post.js:**
```javascript
import { createStripCollage } from './strip-collage.js'

await createStripCollage(albumImagePaths, coverOutputPath, {
  seed: dateSeed,
  width: 1400,
  height: 800
})
```

### FAL.ai Collage (AI-Powered Alternative)

**File**: `scripts/fal-collage.js`
**Config**: `scripts/fal-collage-config.json`

An AI-powered generator using FAL.ai's Gemini 3 Pro Image model:
- **Style**: AI-generated artistic fusion of album covers
- **Selection**: Analyzes all albums and selects 2-6 most vibrant/colorful covers
- **Algorithm**: Color variance analysis (saturation 40% + variance 30% + text penalty 30%)
- **Smart Prompts**: Uses GPT-4 Vision to analyze covers and generate context-aware prompts
- **Blacklist**: Configurable album/artist filtering to avoid content policy violations
- **Output**: 2K resolution (2048px) PNG with seamless blending
- **API**: Requires `FAL_KEY` and `OPENAI_API_KEY` environment variables
- **Cost**: Uses FAL.ai and OpenAI API credits

**Selection Process:**
1. Filters out blacklisted albums/artists (from config)
2. Analyzes each image (resized to 256×256 for performance)
3. Detects text using edge detection (top/bottom 20% of cover)
4. Calculates color vibrancy (RGB variance + saturation)
5. Scores: `(saturation × 0.4) + (√variance × 0.3) + (textPenalty × 0.3)`
6. Selects top 2-6 highest-scoring images
7. Preprocesses images to crop text regions (top 15%, bottom 15%, sides 5%)
8. Uses GPT-4 Vision to analyze covers and generate custom blend prompt
9. Sends to FAL.ai Gemini 3 Pro Image model for AI blending

**Configuration (`scripts/fal-collage-config.json`):**
```json
{
  "model": {
    "name": "fal-ai/nano-banana-pro/edit",
    "fallback": "fal-ai/reve/fast/remix"
  },
  "output": {
    "aspectRatio": "16:9",
    "numImages": 1,
    "format": "png",
    "resolution": "2K"
  },
  "blacklist": {
    "albums": ["Is This It", "Album Name"],
    "artists": ["Artist Name"]
  },
  "scoring": {
    "saturationWeight": 0.4,
    "varianceWeight": 0.3,
    "textPenaltyWeight": 0.3
  },
  "prompts": {
    "default": "Create a vibrant music blog header...",
    "gptVisionSystemPrompt": "You are an expert art director..."
  },
  "retry": {
    "maxAttempts": 3
  }
}
```

**Usage in generate-tunes-post.js:**
```javascript
import { createFALCollage } from './fal-collage.js'

await createFALCollage(albumImagePaths, coverOutputPath, {
  seed: dateSeed,
  width: 1400,
  height: 800,
  debug: true
})
```

**Test the FAL.ai collage:**
```bash
# Set FAL_KEY in .env first
DEBUG_COLLAGE=1 node scripts/fal-collage.js
```

**Error Handling:**
- Throws errors on API failures (no fallback to strip-collage by default)
- Validates FAL_KEY presence before making API calls
- Provides detailed error messages for debugging

**When to Use:**
- **Strip Collage**: Default choice, fast, free, consistent style
- **FAL.ai Collage**: Experimental AI-generated look, requires API credits, varies each time

## Customization

### Configuration File

Edit `scripts/tunes-config.yaml` to customize all aspects of content generation:

```yaml
# General Settings
settings:
  number_of_items: 20              # Number of top items (artists/albums)
  cover_image_min: 1               # Cover image range
  cover_image_max: 23
  classification_cache_days: 90    # How long to cache album classifications

# Classification Configuration (for dynamic questions)
classification:
  metadata_patterns:               # Keywords to detect album types
    compilation_keywords: ["greatest hits", "best of", ...]
    live_keywords: ["live", "in concert", "unplugged", ...]
    soundtrack_keywords: ["soundtrack", "ost", ...]
  system_prompt: "..."             # LLM prompt for classification
  instruction: "..."               # Classification instructions

# Dynamic Question Templates
questions:
  base:                            # Questions for ALL albums
    - "What is the recording history and creation process?"
    - "What is the musical style and what makes it distinctive?"
    - "What was the critical and commercial reception?"
    - "What is the lasting legacy and influence?"

  era:                             # Era-specific questions
    "1960s": ["How did this relate to the cultural revolution?", ...]
    "1980s": ["How did synthesizers influence this album?", ...]
    "1990s": ["How did this relate to alternative rock explosion?", ...]
    # ... more decades

  genre:                           # Genre-specific questions
    rock: ["How does the guitar work define the sound?", ...]
    electronic: ["What synthesizers and techniques are notable?", ...]
    jazz: ["What improvisation techniques are evident?", ...]
    # ... 20+ genres

  type:                            # Album type questions
    studio: ["What was the studio environment like?", ...]
    live: ["What makes this live recording significant?", ...]
    compilation: ["What narrative does the track selection create?", ...]

  artist_type:                     # Artist type questions
    solo: ["How does this reflect the artist's personal vision?", ...]
    band: ["How did band dynamics shape the album?", ...]

  significance:                    # Significance questions
    debut: ["How did this debut announce a new voice?", ...]
    landmark: ["Why is this considered a landmark album?", ...]
    cult: ["What makes this a cult favorite?", ...]

# Agent Configuration (replaces hardcoded system prompts)
agent:
  system_prompt: |
    ## Your Role: Music Research Agent
    You are researching: "{album}" by {artist}
    Classification: {genre_primary} / {era_decade}
    ## Research Questions
    {research_questions}
    ...

  voice_guidelines: |
    Write as a knowledgeable friend sharing album insights.
    DO: "Released in 1975, this explores themes of..."
    DON'T: "Sources indicate..." (too academic)

  user_message: |
    Research and write about "{album}" by {artist}.
    Focus on: {research_questions}

# Tool Configuration
tools:
  perplexity:
    description: "Searches for music album information..."
    research_prompt: "Research {query}. Focus areas: {focus_areas}"
  exa:
    description: "Searches music journalism sites..."
    domains: [pitchfork.com, allmusic.com, rollingstone.com, ...]

# Title and Summary Prompts
prompts:
  title:
    system: "You are a creative music journalist..."
    instruction: "Create an engaging title for {artists}, {albums}..."
  summary:
    system: "You are a music curator..."
    instruction: "Create a summary for week {week_number}..."

# Fallback Content (when research fails)
fallback:
  section: |
    ## {album} by {artist} 🎵
    ### A Musical Journey 🎶
    ...
```

### Dynamic Question System

The generator now uses a two-phase approach for better content:

1. **Classification Phase**: Each album is classified by:
   - **Genre**: rock, electronic, jazz, pop, hip-hop, metal, folk, etc. (20+ genres)
   - **Era**: 1950s through 2020s with era labels (classic-rock, punk-era, grunge-era, etc.)
   - **Type**: studio, live, compilation, soundtrack, EP, box-set
   - **Artist Type**: solo, band, collaboration, supergroup, various-artists
   - **Significance**: debut, farewell, comeback, concept, landmark, influential, cult

2. **Question Composition**: Based on classification, 6-8 contextual questions are selected:
   - 4 base questions (all albums)
   - Era-specific questions (e.g., "How did it relate to grunge movement?" for 1990s)
   - Genre-specific questions (e.g., "What guitar tones define the sound?" for metal)
   - Type-specific questions (e.g., "What makes this live recording significant?")
   - Significance questions (e.g., "Why is this considered a landmark album?")

**Example**: For "Nevermind" by Nirvana (rock/1990s/studio/band/landmark):
```
1. What is the recording history and creation process?
2. What is the musical style and what makes it distinctive?
3. What was the critical and commercial reception?
4. What is the lasting legacy and influence?
5. How did this album relate to the alternative rock explosion? (era: 1990s)
6. How does the guitar work define the album's sound? (genre: rock)
7. Why is this considered a landmark album? (significance: landmark)
```

### Classification Sources

The classifier uses a hybrid approach:
- **Collection Metadata** (russ.fm): genres, release year, artist biography
- **Album Name Patterns**: detects "Best Of", "Live at", "Soundtrack", etc.
- **LLM Fallback**: when metadata confidence is below 70%

Classifications are cached for 90 days (configurable) since album metadata rarely changes.

### Template File

Edit `scripts/tunes-template.mdx` to change the MDX layout:

```mdx
---
title: "{{title}}"
description: "{{description}}"
pubDate: {{pubDate}}
heroImage: "./covers/weekly-tunes-{{coverImage}}.png"
draft: false
tags: []
---

<NoteCallout title="Note">
...content...
</NoteCallout>

<!-- Customize layout here -->
```

### Available Template Variables

- `{{title}}` - Generated title
- `{{description}}` - Generated summary
- `{{pubDate}}` - Publication date
- `{{coverImage}}` - Random cover number
- `{{albumSections}}` - AI-generated album content with integrated images and links
- `{{weekNumber}}` - Week number
- `{{topArtists}}` - Top artists list with links
- `{{topAlbums}}` - Top albums list with links

**Note**: Album sections automatically include:
- Album cover image (using `<Img>` component) after H2 header
- Artist image (using `<Img>` component) after first H3 subsection
- Links to russ.fm at the bottom of each section

## Troubleshooting

### No images downloading
- Check that `COLLECTION_URL` is correct
- Verify russ.fm collection.json is accessible
- Images are cached locally in `collection.json` for 1 hour

### AI generation fails
- Ensure either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set
- Check API key validity and rate limits
- Web search (Tavily) is optional - script works without it

### Missing album links
- Some albums may not be in your russ.fm collection
- The script uses fuzzy matching - check console output for warnings

## GitHub Actions Integration

The script is designed to run via GitHub Actions. Example workflow:

```yaml
name: Generate Weekly Tunes
on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday at midnight
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run tunes
        env:
          LASTFM_USER: ${{ secrets.LASTFM_USER }}
          LASTFM_API_KEY: ${{ secrets.LASTFM_API_KEY }}
          COLLECTION_URL: ${{ secrets.COLLECTION_URL }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          TAVILY_API_KEY: ${{ secrets.TAVILY_API_KEY }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "🎵 Add weekly tunes post"
```

## Migration from Python

This is a JavaScript port of the original Python/CrewAI implementation. Key changes:

- ✅ CrewAI → LangChain.js
- ✅ Jinja2 → JavaScript template literals
- ✅ Hugo shortcodes → MDX components (LightGallery)
- ✅ `content/tunes/` → `src/content/tunes/`
- ✅ Fuzzy matching with fuzzball (fuzzywuzzy equivalent)
