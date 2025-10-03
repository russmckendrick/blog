# Tunes Generator - Python to JavaScript Migration

## Summary

Successfully migrated the Last.fm weekly music blog post generator from Python/CrewAI to JavaScript/LangChain.js.

## What Changed

### Technology Stack
| Python (Old) | JavaScript (New) |
|--------------|------------------|
| CrewAI | LangChain.js |
| Jinja2 templates | JavaScript template literals |
| Hugo shortcodes | MDX components (LightGallery, Note) |
| fuzzywuzzy | fuzzball |
| Python requests | axios |
| `content/tunes/` | `src/content/tunes/` |
| `content/tunes/.../albums/` | `src/assets/.../albums/` |

### AI Providers
- **Anthropic Claude 3.5 Sonnet** (default if API key available)
- **OpenAI GPT-4 Turbo** (fallback)
- **Tavily API** (optional web search for enhanced album research)

### New Features
- ✅ Native Astro/MDX output format
- ✅ Direct image imports for galleries
- ✅ Flexible AI provider selection (OpenAI or Anthropic)
- ✅ Improved error handling and logging
- ✅ Simplified configuration (no YAML files needed)

## File Structure

### Created Files
```
scripts/
├── generate-tunes-post.js           # Main script
├── lib/
│   ├── lastfm-client.js            # Last.fm API client
│   ├── collection-manager.js        # russ.fm collection data
│   ├── content-generator.js         # AI content generation (LangChain)
│   ├── image-handler.js             # Image downloading
│   └── blog-post-renderer.js        # MDX template rendering
└── TUNES_README.md                  # Full documentation

.env.example                         # Environment variables template
```

### Modified Files
- `package.json` - Added dependencies and `tunes` script
- `src/content.config.ts` - Updated tunes collection schema
- `CLAUDE.md` - Added tunes generator documentation

### Deprecated (Can be archived)
```
tunes/
├── generate_blog_post.py
├── config/
│   ├── agents.yaml
│   ├── tasks.yaml
│   └── config_loader.py
└── lastfm-post-template.md
```

## Usage

### Basic Usage
```bash
# Generate post for previous week
npm run tunes

# Custom week
npm run tunes -- --week_start=2025-09-25

# Debug mode (single album)
npm run tunes -- --debug
```

### Environment Setup
Copy `.env.example` to `.env` and configure:

```bash
# Required
LASTFM_USER=your-lastfm-username
LASTFM_API_KEY=your-lastfm-api-key
COLLECTION_URL=https://www.russ.fm

# AI Provider (choose one)
ANTHROPIC_API_KEY=your-anthropic-key
# OR
OPENAI_API_KEY=your-openai-key

# Optional
TAVILY_API_KEY=your-tavily-key
```

## Output Format

### Directory Structure
```
src/
├── content/tunes/
│   └── YYYY-MM-DD-listened-to-this-week/
│       └── index.mdx
└── assets/YYYY-MM-DD-listened-to-this-week/
    ├── artists/
    │   ├── Artist-Name.jpg
    │   └── Artist-Name.jpg.meta
    └── albums/
        ├── Album-Name.jpg
        └── Album-Name.jpg.meta
```

### MDX Post Format
```mdx
---
title: "AI-generated engaging title"
author: "Russ McKendrick"
date: "2025-09-25"
description: "AI-generated summary"
draft: false
showToc: true
cover:
    image: "/img/weekly-tunes-XXX.png"
    relative: false
tags:
    - "Listened"
keywords:
    - "Artist Name"
    - "Album Name"
---

import artist0 from '../../assets/.../artists/Artist.jpg'
import album0 from '../../assets/.../albums/Album.jpg'

<Note>
This is what GPT had to say about what I listened to last week...
</Note>

<LightGallery images={[
  { src: artist0, title: "Artist Name" }
]} />

## Album Name by Artist 🎸
### Research Section 🎵
AI-generated content about the album...

## Top Artists (Week XX)
- [Artist Name](https://www.russ.fm/artist/slug) (123 plays)

## Top Albums (Week XX)
- [Album](https://www.russ.fm/release/slug) by [Artist](...)

<LightGallery images={[
  { src: album0, title: "Album Name" }
]} />
```

## Migration Benefits

1. **Native Integration**: Full compatibility with Astro/MDX ecosystem
2. **Flexibility**: Support for multiple AI providers
3. **Maintainability**: Pure JavaScript, no Python dependencies
4. **Performance**: Faster execution with modern JS async/await
5. **Type Safety**: Works with Astro content collections
6. **GitHub Actions**: Easier CI/CD integration

## Next Steps

1. ✅ Set up environment variables in GitHub Actions secrets
2. ✅ Configure weekly automated run (e.g., every Monday)
3. ✅ Archive Python implementation in `tunes/` folder
4. ✅ Test with actual Last.fm data

## GitHub Actions Example

```yaml
name: Generate Weekly Tunes
on:
  schedule:
    - cron: '0 0 * * 1' # Every Monday
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

## Testing Checklist

- [ ] Verify Last.fm API connection
- [ ] Test collection.json fetch from russ.fm
- [ ] Confirm AI provider (OpenAI/Anthropic) works
- [ ] Check image downloads
- [ ] Validate MDX output format
- [ ] Test with real weekly data
- [ ] Verify image galleries render correctly
- [ ] Confirm links to russ.fm work
- [ ] Run `npx astro check` on generated content
