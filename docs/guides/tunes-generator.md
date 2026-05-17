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
   pnpm install
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

   # Required for AI-generated tunes covers
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
pnpm run tunes
```

This generates a post for the previous week (7 days ago to now).

### Custom Week

```bash
pnpm run tunes -- --week_start=2025-09-25
```

### Debug Mode (Single Album)

```bash
pnpm run tunes -- --debug
```

### Testing Mode

Redirects all output to an `output/` folder (gitignored) instead of the normal `src/` and `public/` paths, useful for reviewing generated content without affecting the site:

```bash
# Testing with 5 items
pnpm run tunes -- --testing --take=5

# Testing with 10 items
pnpm run tunes -- --testing --take=10

# Combine with other flags
pnpm run tunes -- --testing --take=3 --lane=auto
```

Output structure in testing mode:
```
output/YYYY-MM-DD-listened-to-this-week/
  ├── YYYY-MM-DD-listened-to-this-week.mdx
  ├── albums/
  ├── artists/
  ├── tunes-cover-YYYY-MM-DD-listened-to-this-week.png
  └── tunes-cover-YYYY-MM-DD-listened-to-this-week-small.png
```

### Take Count

Control how many items (artists/albums) to process, overriding both the config default and debug mode:

```bash
pnpm run tunes -- --take=5
```

## Output Structure

Posts are created in:
- **Content**: `src/content/tunes/YYYY-MM-DD-listened-to-this-week.mdx`
- **Downloaded album/artist images**: `public/assets/YYYY-MM-DD-listened-to-this-week/`
- **Generated cover images**: `src/assets/YYYY-MM-DD-listened-to-this-week/`

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
5. **Generate Cover**: Creates paired full-size and `-small` interpreted AI cover images from ranked album art and metadata
6. **Render MDX**: Creates formatted blog post with galleries and links

## Backfilling Older Posts

Older weekly tunes posts were created before album/artist galleries were consistently embedded. Use the sidecar backfill script to repair those posts from the local `collection.json` file:

```bash
# Preview the default older-post backfill
pnpm run backfill-tunes-images --dry-run --older

# Preview one post and check exactly which links/images would be repaired
pnpm run backfill-tunes-images --dry-run --file=src/content/tunes/2023-06-26-listened-to-this-week.mdx

# Apply the older-post backfill
pnpm run backfill-tunes-images --older
```

Default behaviour:
- Image and generated-gallery backfill targets weekly posts without existing `LightGallery` blocks.
- Link repair scans all weekly tunes posts and updates resolvable `Top Artists` and `Top Albums` russ.fm links.
- Generated galleries are image-only `LightGallery` blocks wrapped in stable markers so reruns replace them cleanly.
- Album galleries are inserted near the top of older posts, and artist galleries are appended near the bottom.
- The script reads local `collection.json`; it does not refresh the russ.fm collection cache.

Useful flags:
- `--links-only` repairs resolvable list links without downloading images.
- `--assets-only` downloads missing album/artist images without editing MDX.
- `--all` checks assets across every weekly tunes post.
- `--from=YYYY-MM-DD` and `--to=YYYY-MM-DD` limit the selected date range.
- `--no-link-repair` skips list link repair while still backfilling older galleries/assets.

## Architecture

For the full `scripts/` inventory, including helper modules, templates, and maintenance utilities, see [Scripts Reference](../reference/scripts.md).

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
- `fal-collage.js` - Lane-based interpreted AI tunes cover generator using FAL.ai edit models
- `regenerate-tunes-cover.js` - Manual test harness for regenerating one older weekly cover without changing MDX

### AI Models Used

- **Content generation**: OpenAI GPT-5.4 (default) or Anthropic Claude 3.5 Sonnet (fallback), with humaniser anti-pattern guidelines to produce natural UK English output
- **Visual blueprint (Stage A)**: OpenAI GPT-5.4 via Responses API (vision analysis of album covers)
- **Image generation**: FAL.ai nano-banana-2/edit (interpreted cover scene from prompt + source images)
- **Web search**: Tavily, Perplexity, or Exa API (optional, for factual album research)

## Cover Image Generation

The weekly tunes workflow generates interpreted AI cover images, not visible album-cover montages. Album artwork is treated as research material: the generator studies the images, week title, summary, artists, albums, genres, years, and recent cover memory, then asks the image model for one distinctive editorial scene.

**File**: `scripts/fal-collage.js`

The file keeps its historical name for compatibility, but it is now the only weekly tunes cover workflow.

### Outputs

Each run saves two PNGs:

- Full generated image: `src/assets/YYYY-MM-DD-listened-to-this-week/tunes-cover-YYYY-MM-DD-listened-to-this-week.png`
- Small site-sized image: `src/assets/YYYY-MM-DD-listened-to-this-week/tunes-cover-YYYY-MM-DD-listened-to-this-week-small.png`

The small image defaults to `1400x800`. The MDX `heroImage` path continues to point at the non-`small` file.

### Creative Lanes

Use `--lane` to guide the art direction:

| Lane | Direction |
|------|-----------|
| `auto` | AI director chooses a lane while avoiding recent-cover repetition |
| `documentary` | Grounded editorial photography and real-world music-adjacent detail |
| `still_life` | Objects, surfaces, paper, instruments, fabric, light, and texture |
| `architecture` | Built environments, interiors, venues, streets, or impossible spaces |
| `portrait` | One distinctive person or small group as the clear focal subject |
| `abstract` | Graphic rhythm, materials, colour, and texture over literal subjects |
| `surreal` | Dreamlike but coherent scene with controlled weirdness |

`--style` remains as a deprecated alias so old commands do not fail, but new usage should use `--lane`.

### How Cover Direction Works

1. Ranks album inputs from the week's top albums first.
2. Adds visually diverse alternates using lightweight local colour and text-density analysis.
3. Builds compact album and artist context from the post metadata and collection data.
4. Reads recent weekly cover titles/summaries so the AI director can avoid repeating the same visual grammar.
5. Uses OpenAI vision, when `OPENAI_API_KEY` is available, to produce a compact internal art brief.
6. Converts that brief into a natural-language FAL prompt with explicit constraints against visible cover grids, square panels, readable text, logos, and pasted cutouts.
7. Saves the full generated output plus the `-small` derivative.

If `OPENAI_API_KEY` is not available, the script uses a deterministic fallback art brief. `FAL_KEY` is required because there is no local image-generation fallback.

### Commands

```bash
# Future weekly posts use the interpreted cover path automatically
pnpm run tunes -- --lane=auto

# Testing mode keeps all generated files under output/
pnpm run tunes -- --testing --take=5 --lane=auto

# Regenerate one older week for local review without changing MDX frontmatter
node scripts/regenerate-tunes-cover.js --week=2026-04-20 --lane=auto --debug

# Send a one-off test image somewhere else
node scripts/regenerate-tunes-cover.js --week=2026-04-20 --lane=still_life --output=/tmp/tunes-test.png

# Direct low-level generator usage
node scripts/fal-collage.js --input=public/assets/2026-04-20-listened-to-this-week/albums --output=/tmp/tunes-cover.png --lane=architecture --debug
```

### Error Handling

- Validates `FAL_KEY` before making image-generation calls.
- Uses optional `FAL_TUNES_COVER_FALLBACK_MODEL` if the primary FAL model fails.
- Retries with alternate album input sets on content-policy failures.
- Fails clearly rather than falling back to a local cover compositor.

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

  humaniser_guidelines: |
    UK English only. Avoid AI vocabulary (delve, pivotal, vibrant, testament...),
    inflated significance, promotional language, em dash overuse, rule of three,
    negative parallelisms, vague attribution. Use concrete details and direct language.

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

### Humaniser Guidelines

The content generation system prompt includes anti-pattern guidelines based on [Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) to produce natural-sounding UK English output. These are defined in the `humaniser_guidelines` field under `agent:` in `scripts/tunes-config.yaml` and injected into the system prompt via the `{humaniser_guidelines}` placeholder.

The guidelines instruct the LLM to:
- Write in **UK English** throughout (colour, favourite, recognise, -ise/-isation endings)
- Avoid AI-overused vocabulary (delve, pivotal, vibrant, testament, showcase, tapestry, landscape, etc.)
- Avoid inflated significance ("serves as a testament to", "setting the stage for", "indelible mark")
- Avoid promotional language ("boasts", "nestled", "breathtaking", "renowned")
- Use simple copulas ("is/are/has") instead of elaborate substitutes ("serves as/stands as/features")
- Avoid superficial `-ing` padding, negative parallelisms, rule of three, em dash overuse
- Use concrete details and specific facts over vague attribution and excessive hedging

Edit the `humaniser_guidelines` field in `scripts/tunes-config.yaml` to adjust these rules.

### Template File

Edit `scripts/tunes-template.mdx` to change the MDX layout:

```mdx
---
title: "{{title}}"
description: "{{description}}"
pubDate: {{pubDate}}
heroImage: "../../assets/{{pubDate}}-listened-to-this-week/tunes-cover-{{pubDate}}-listened-to-this-week.png"
showToc: true
draft: false
tags: []
---

{{albumSections}}

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
- For older posts, run `pnpm run backfill-tunes-images --dry-run --older` to preview missing local artwork and unresolved collection matches

### AI generation fails
- Ensure either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is set
- Check API key validity and rate limits
- Web search (Tavily) is optional - script works without it

### Missing album links
- Some albums may not be in your russ.fm collection
- The script uses fuzzy matching - check console output for warnings
- Run `pnpm run backfill-tunes-images --links-only --dry-run` to preview resolvable missing russ.fm links across weekly tunes posts

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
      - run: pnpm install --frozen-lockfile
      - run: pnpm run tunes
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

## Year Wrapped Generator

Generate comprehensive year-end "Wrapped" posts inspired by [Spotify Wrapped](https://newsroom.spotify.com/2025-12-03/how-your-wrapped-is-made/), using Last.fm data and AI content generation.

### Quick Start

```bash
# Generate wrapped for current year
pnpm run wrapped

# Generate for specific year
pnpm run wrapped -- --year=2025

# Quick preview (skip AI research)
pnpm run wrapped -- --year=2025 --skip-research

# Debug mode (1 featured album only)
pnpm run wrapped -- --year=2025 --debug

# Use cached Last.fm data (faster for re-runs)
pnpm run wrapped -- --year=2025 --use-cache
```

### Features (Inspired by Spotify Wrapped)

**Statistics Dashboard:**
- Total scrobbles, hours listened, unique artists/albums
- Days of music, average plays per day
- Peak listening month

**Year-End Awards:**
- Artist of the Year with play counts and dominant months
- Album of the Year with detailed statistics
- Top 25 Artists and Top 50 Albums with russ.fm links

**Insights:**
- **Monthly Breakdown**: Visual activity chart showing listening patterns per month
- **Listening Age**: Which decade resonates most (based on album release years from collection)
- **Genre Breakdown**: Top 10 genres from collection metadata with percentages
- **Hidden Gems**: Albums that "overperformed" - high play counts relative to their ranking
- **New Discoveries**: Albums released in the target year that made it into rotation

**Featured Albums (Deep Dives):**
- Top 15 albums get AI-researched detailed sections
- Same content generation pipeline as weekly posts
- LightGallery integration for album/artist artwork
- Links to russ.fm collection

### Output Structure

```
src/content/tunes/
  2025-year-in-music.mdx          # Main MDX post

public/assets/2025-year-in-music/
  albums/                          # Album artwork
  artists/                         # Artist photos

src/assets/2025-year-in-music/
  wrapped-cover-2025.png          # AI-generated wrapped cover
```

### How It Works

1. **Aggregate Weekly Charts**: Fetches all 48-52 weekly charts for the calendar year
   - More accurate than Last.fm's `12month` rolling period
   - Provides exact January 1 - December 31 data
   - Builds monthly breakdown for listening patterns

2. **Calculate Statistics**:
   - Total scrobbles, unique artists/albums
   - Estimated listening hours (3.5 min avg per track)
   - Monthly breakdown with peak/quiet months
   - Quarterly analysis

3. **Generate Insights**: Spotify Wrapped-style calculations
   - Artist/Album of the Year with dominant months
   - Listening Age from collection release years
   - Hidden Gems using overperformance scoring
   - Genre breakdown from collection metadata

4. **Download Artwork**: Fetches from russ.fm collection
   - Top 20 artist images
   - Top 15 album covers (for featured sections)

5. **AI Research**: Uses existing ContentGenerator
   - Same two-phase classification + research pipeline
   - Search caching for efficiency
   - Fallback sections if research fails

6. **Generate Cover**: Uses the wrapped AI cover path with the top album images

7. **Render MDX**: Comprehensive year-end post
   - Stats dashboard with Tailwind styling
   - Monthly activity table with visual bars
   - Top 25/50 lists with russ.fm links
   - Featured album sections with galleries

### Architecture

**New Components:**

- `scripts/generate-year-wrapped.js` - Main orchestrator
- `scripts/lib/lastfm-year-client.js` - Extended Last.fm client
  - `getTopArtists(period, limit)` / `getTopAlbums(period, limit)` - Period-based queries
  - `getUserInfo()` - Total scrobbles, registration date
  - `getWeeklyChartList()` - Available chart ranges
  - `getYearlyArtistData(year)` / `getYearlyAlbumData(year)` - Aggregates weekly charts
  - `getYearWrappedData(year)` - Comprehensive year-end data
- `scripts/lib/year-stats-calculator.js` - Insights calculator
  - `getBasicStats()` - Total scrobbles, hours, averages
  - `getArtistOfTheYear()` / `getAlbumOfTheYear()` - Top items with analysis
  - `getListeningPatterns()` - Monthly/quarterly breakdown
  - `getListeningAge()` - Decade analysis from release years
  - `getHiddenGems()` - Overperforming albums
  - `getGenreBreakdown()` - Genre statistics
  - `getNewDiscoveries()` - Albums released in target year
- `scripts/year-wrapped-template.mdx` - MDX template

**Reused Components:**
- `ContentGenerator` - AI album research
- `ImageHandler` - Image downloads
- `CollectionManager` - russ.fm metadata
- `generateWrappedCover()` - AI cover image generation

### Data Caching

The script caches Last.fm data to avoid re-fetching 48+ weekly charts:

```bash
# Cache file location
scripts/.year-wrapped-cache-2025.json

# Use cached data (much faster)
pnpm run wrapped -- --year=2025 --use-cache

# Force fresh fetch (delete cache)
rm scripts/.year-wrapped-cache-2025.json
pnpm run wrapped -- --year=2025
```

### Configuration

The year wrapped generator uses the same environment variables as the weekly generator:

```bash
# Required
LASTFM_USER=your-username
LASTFM_API_KEY=your-api-key
COLLECTION_URL=https://www.russ.fm

# AI Provider (choose one)
OPENAI_API_KEY=your-key
# OR
ANTHROPIC_API_KEY=your-key

# Optional: Web search for album research
PERPLEXITY_API_KEY=your-key
# OR
EXA_API_KEY=your-key
# OR
TAVILY_API_KEY=your-key
```

### Customization

**Adjust counts** in `scripts/generate-year-wrapped.js`:

```javascript
const CONFIG = {
  featuredAlbums: 15,        // Albums to get AI deep dives
  topArtistsToShow: 25,      // Top artists in list
  topAlbumsToShow: 50,       // Top albums in list
  hiddenGemsToShow: 5,       // Hidden gems to highlight
  newDiscoveriesToShow: 10   // New releases to show
}
```

**Modify template** in `scripts/year-wrapped-template.mdx`:
- Adjust stats dashboard layout
- Change section ordering
- Add/remove sections
- Customize styling

### Troubleshooting

**Script takes too long:**
- Use `--use-cache` to reuse Last.fm data
- Use `--skip-research` to skip AI content generation
- Use `--debug` to process only 1 featured album

**Missing monthly data:**
- Last.fm API may not have complete data for current year
- December data may be incomplete if run before month ends

**No collection metadata:**
- Some albums may not be in russ.fm collection
- Genre/release year data only available for collection items

## Migration from Python

This is a JavaScript port of the original Python/CrewAI implementation. Key changes:

- ✅ CrewAI → LangChain.js
- ✅ Jinja2 → JavaScript template literals
- ✅ Hugo shortcodes → MDX components (LightGallery)
- ✅ `content/tunes/` → `src/content/tunes/`
- ✅ Fuzzy matching with fuzzball (fuzzywuzzy equivalent)
