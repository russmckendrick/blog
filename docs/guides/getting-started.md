# Getting Started

Quick guide to setting up your development environment and working with the Russ.Cloud blog.

## Prerequisites

- **Node.js**: 20.x or later ([Download](https://nodejs.org/))
- **npm**: 10.x or later (comes with Node.js)
- **Git**: For version control
- **Code Editor**: VS Code recommended with Astro extension

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/russmckendrick/blog.git
cd blog
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Astro 5.x
- Tailwind CSS 4.x
- MDX support
- All integrations

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:4321` in your browser.

**Note**: Images won't be transformed in dev mode (Cloudflare transformations only work in production).

## Project Structure

```
blog/
├── docs/              # Documentation (you are here)
├── src/
│   ├── assets/        # Source images
│   ├── components/    # Astro components
│   │   ├── blog/      # Blog-specific components
│   │   ├── embeds/    # MDX embed components
│   │   └── layout/    # Layout components
│   ├── content/       # Content collections
│   │   ├── blog/      # Blog posts (MDX)
│   │   └── tunes/     # Music posts (MDX)
│   ├── layouts/       # Page layouts
│   ├── pages/         # Route pages
│   ├── styles/        # Global styles
│   └── utils/         # Utility functions
├── public/            # Static assets
├── scripts/           # Build and generation scripts
├── astro.config.mjs   # Astro configuration
├── tailwind.config.mjs # Tailwind configuration
└── package.json       # Dependencies and scripts
```

## Common Commands

### Development

```bash
# Start dev server (http://localhost:4321)
npm run dev

# Build production site to ./dist/
npm run build

# Preview production build locally
npm run preview
```

### Content Creation

```bash
# Create new blog post (interactive)
npm run post

# Generate weekly music post from Last.fm
npm run tunes

# Generate for specific week
npm run tunes -- --week_start=2025-09-25

# Debug mode (single album)
npm run tunes -- --debug
```

### Image Optimization

```bash
# Optimize all images in src/assets/ and public/assets/
npm run optimize

# Optimize specific directory
npm run optimize src/assets/2025-10-01-my-post
```

### Quality Checks

```bash
# Run TypeScript and Astro diagnostics
npx astro check

# Regenerate content types after frontmatter changes
npm run astro -- sync
```

## Configuration Files

### astro.config.mjs

Main Astro configuration:
- Site URL
- Integrations (sitemap, RSS, MDX, etc.)
- Build settings

### tailwind.config.mjs

Tailwind CSS configuration:
- Custom colors
- Typography settings
- Dark mode config

### src/content.config.ts

Content collections schema:
- Blog post frontmatter validation
- Tunes post schema
- Type generation

## Environment Variables

For tunes generation, create `.env`:

```bash
# Required for tunes
LASTFM_USER=your-username
LASTFM_API_KEY=your-api-key
COLLECTION_URL=https://www.russ.fm

# AI Provider (choose one)
OPENAI_API_KEY=your-key
# OR
ANTHROPIC_API_KEY=your-key

# Optional
TAVILY_API_KEY=your-key
```

Get API keys:
- Last.fm: https://www.last.fm/api/account/create
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Tavily: https://tavily.com/

## Development Workflow

### 1. Create a New Post

```bash
npm run post
```

This will:
1. Prompt for title, description, tags
2. Create MDX file in `src/content/blog/`
3. Create assets directory in `src/assets/`
4. Set `draft: true` for safety

### 2. Write Content

Edit the generated MDX file:

```mdx
---
title: "My Post Title"
description: "A great description"
pubDate: 2025-11-02
draft: true
tags: ["docker", "kubernetes"]
cover:
  image: "./cover.jpg"
  alt: "Cover image description"
---

# My Post

Content goes here with markdown and MDX components.

<YouTube id="dQw4w9WgXcQ" />

<NoteCallout title="Note">
Important information here!
</NoteCallout>
```

### 3. Add Images

Place images in the assets directory:
```
src/assets/2025-11-02-my-post/
├── cover.jpg
├── screenshot1.jpg
└── screenshot2.jpg
```

Use in content:
```mdx
<Img src="/assets/2025-11-02-my-post/screenshot1.jpg" alt="Screenshot" />
```

### 4. Preview

```bash
npm run dev
```

Navigate to your post at:
```
http://localhost:4321/2025/11/02/my-post/
```

### 5. Publish

When ready to publish:

1. Set `draft: false` in frontmatter
2. Run `npx astro check` to verify
3. Commit and push to deploy

## VS Code Setup

### Recommended Extensions

- **Astro** (astro-build.astro-vscode) - Syntax highlighting and IntelliSense
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **MDX** - MDX syntax support
- **Prettier** - Code formatting

### Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[astro]": {
    "editor.defaultFormatter": "astro-build.astro-vscode"
  },
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*?[\"'`]([^\"'`]*).*?[\"'`]", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

## Next Steps

- **[Creating Posts](./creating-posts.md)** - Detailed guide to writing blog posts
- **[Using Embeds](./using-embeds.md)** - How to use embed components
- **[Tunes Generator](./tunes-generator.md)** - Generate music posts
- **[Architecture Overview](../architecture/overview.md)** - Understand the system

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules/.astro dist
npm run build
```

### Type Errors

```bash
# Regenerate types
npm run astro -- sync
npx astro check
```

### Images Not Loading

- In dev mode: Cloudflare transformations don't work (this is normal)
- In production: Check image paths and deployment

### Port Already in Use

```bash
# Kill process on port 4321
lsof -ti:4321 | xargs kill

# Or use different port
npm run dev -- --port 3000
```

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/russmckendrick/blog/issues)
- **Docs**: Check [CLAUDE.md](../../CLAUDE.md) for detailed info
- **Examples**: See [kitchen-sink.mdx](../../src/content/blog/2025-09-29-kitchen-sink.mdx)

---

**Last Updated**: November 2025
