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
2. **Get Metadata**: Downloads collection data from russ.fm (images, links)
3. **AI Research**: For each album:
   - Optional web search for facts
   - AI generates engaging blog section (800 words max)
4. **Download Images**: Fetches high-res artist/album artwork
5. **Render MDX**: Creates formatted blog post with galleries and links

## Architecture

### Core Components

- `generate-tunes-post.js` - Main orchestrator
- `lib/lastfm-client.js` - Last.fm API client
- `lib/collection-manager.js` - russ.fm data fetcher/processor
- `lib/content-generator.js` - AI content generation (LangChain)
- `lib/image-handler.js` - Image downloading
- `lib/blog-post-renderer.js` - MDX template renderer
- `strip-collage.js` - Local Sharp-based torn-paper collage generator
- `fal-collage.js` - AI-powered collage using FAL.ai WAN 2.5 (alternative)

### AI Models Used

- **Anthropic**: Claude 3.5 Sonnet (default if key available)
- **OpenAI**: GPT-4 Turbo (fallback)
- **Web Search**: Tavily API (optional, for factual research)
- **Image Generation**: FAL.ai WAN 2.5 (optional, for AI-powered collages)

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

An AI-powered generator using FAL.ai's WAN 2.5 image-to-image model:
- **Style**: AI-generated artistic fusion of album covers
- **Selection**: Analyzes all albums and selects 4 most vibrant/colorful covers
- **Algorithm**: Color variance analysis (saturation 60% + variance 40%)
- **Output**: 1400×800 PNG with seamless blending
- **API**: Requires `FAL_KEY` environment variable
- **Cost**: Uses FAL.ai API credits (check pricing at fal.ai)

**Selection Process:**
1. Analyzes each image (resized to 256×256 for performance)
2. Calculates RGB variance and saturation metrics
3. Scores each image: `(avgSaturation × 0.6) + (√variance × 0.4)`
4. Selects top 4 highest-scoring images

**Prompt Strategy:**
- **Main**: "Create a vibrant music blog header merging these album artworks into a cohesive artistic collage. Blend the cover art seamlessly without any text or typography."
- **Negative**: "text, typography, letters, words, watermark, low quality, defects"

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

Edit `scripts/tunes-config.yaml` to customize:

```yaml
settings:
  # Number of top items (artists/albums)
  number_of_items: 11

  # Cover image range
  cover_image_min: 1
  cover_image_max: 23

prompts:
  title:
    system: "AI system instructions for title generation"
    instruction: "Detailed prompt template with {variables}"

  summary:
    system: "AI system instructions for summary"
    instruction: "Detailed prompt template"

  album_research:
    system: "AI system instructions for album research"
    instruction: "Detailed prompt template"
```

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
