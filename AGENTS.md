# CLAUDE.md

Guidance for Claude Code when working with this Astro blog repository.

## Commands

### Development
- `pnpm run dev` - Start dev server (http://localhost:4321)
- `pnpm run build` - Build to `./dist/`
- `pnpm run preview` - Preview production build
- `npx astro check` - Run type-safe diagnostics (run before PRs)
- `pnpm run astro -- sync` - Regenerate types after frontmatter changes

### Content Creation
- `pnpm run post` - Create new blog post (prompts for title, description, tags, optional AI cover via FAL.ai)
- `node scripts/fal-cover-generator.js` - Standalone AI cover generator (requires `FAL_KEY`, `OPENAI_API_KEY`)
- `pnpm run tunes` - Generate weekly music post from Last.fm (see [Tunes Generator](#tunes-blog-post-generator))
- `pnpm run wrapped` - Generate year-end Wrapped post (see [Year Wrapped Generator](#year-wrapped-generator))
- `pnpm run medium` - Cross-publish blog post to Medium (see [Medium Publisher](#medium-publisher))

### Image & Build Tools
- `pnpm run optimize [path]` - Optimize images (JPG, PNG, WebP, AVIF) with quality 60
- `pnpm run extract-colors` - Extract hero colors for dynamic gradients (auto-runs in prebuild)
- `pnpm run cache-link-previews` - Download OG images for LinkPreview components (auto-runs in prebuild)
- `pnpm run refresh-link-previews` - Re-download stale images (older than 7 days)

## Build & Deployment

GitHub Actions (`.github/workflows/deploy.yml`) deploys to Cloudflare Pages on push to `main`.
- **Caching**: `node_modules/` and `node_modules/.astro/` for faster builds
- **Secrets required**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Architecture Overview

### Image Processing
Uses **Cloudflare Image Transformations** (not build-time processing):
- URL pattern: `/cdn-cgi/image/width=800,quality=85,format=auto/assets/image.jpg`
- Helper: `src/utils/cloudflare-images.ts` (`getCFImageUrl()`, `generateCFSrcSet()`)
- Presets: hero, thumbnail, thumbnailPriority, gallery, avatar, linkPreview

### OpenGraph Images
Auto-generated via `astro-og-canvas`:
- Endpoint: `src/pages/[year]/[month]/[day]/[slug]-og.png.ts`
- Dimensions: 1200x630, cached in `node_modules/.astro-og-canvas`

### Link Preview Image Caching
OG images for `<LinkPreview>` components are downloaded at build time:
- Script: `scripts/cache-link-preview-images.js` (runs in prebuild)
- Images: `public/assets/link-previews/` (committed to repo)
- Manifest: `src/data/link-preview-cache.json`
- Helper: `src/utils/link-preview.ts`
- Weekly refresh via `.github/workflows/refresh-link-previews.yml`

### Dynamic Hero Gradients
- `scripts/extract-hero-colors.js` extracts colors using Sharp
- `src/data/hero-colors.json` stores palettes
- `src/utils/hero-colors.ts` provides runtime utilities
- CSS uses `color-mix()` for soft gradient washes

### SEO & Structured Data
- `astro-seo-plugin` manages meta/OG tags in `src/components/layout/BaseHead.astro`
- Schema.org utilities in `src/utils/schema.ts`: `createFAQSchema()`, `createHowToSchema()`
- Sitemap via `@astrojs/sitemap`, RSS at `/rss.xml`

### Content Collections
- **Blog**: `src/content/blog/` (.md/.mdx) with Zod schema in `src/content.config.ts`
- **Tunes**: `src/content/tunes/` for music posts
- URL pattern: `/[year]/[month]/[day]/[slug]`

### MDX Components
Global components in `mdx-components.ts` auto-injected to all posts:
- **Media**: YouTube, Instagram, Giphy, Reddit, Img, LightGallery
- **Audio**: Audio (MP3/OGG/WAV), AppleMusic
- **Content**: LinkPreview, ChatMessage, Mermaid (interactive diagrams)
- **Callouts**: Note, Tip, Info, Important, Warning, Caution, General

**Adding components**: Create in `src/components/embeds/`, export from `index.ts`, add to `mdx-components.ts` and `[slug].astro`. See `EMBED_USAGE.md`.

### Styling
- Tailwind CSS 4.x via `@tailwindcss/vite`
- Dark mode via `.dark` class + `data-theme` attribute
- Code highlighting: `astro-expressive-code` with GitHub themes
- Global styles: `src/styles/global.css`

### Accessibility (WCAG 2.1 AA)
- Expressive Code plugin: `src/utils/expressive-code-a11y-plugin.ts`
- All image links get `aria-label` from alt text
- Icon-only buttons require `aria-label`
- Runtime fallback in `BaseLayout.astro` for dynamic content

### Page Transitions
Astro View Transitions with cleanup for third-party libraries (LightGallery):
```javascript
document.addEventListener('astro:before-swap', () => {
  document.querySelectorAll('.lg-outer, .lg-backdrop').forEach(el => el.remove());
});
```

### Build Optimization
`@playform/compress` compresses CSS, HTML, JS, JSON, images, and SVG.

## Frontmatter Fields

```yaml
title: "Required"
description: "Required - unique, SEO-optimized"
date: 2024-12-27  # or pubDate
tags: ["docker", "devops"]
cover:
  image: "./cover.png"
  alt: "Description"
draft: true  # excludes from production
showToc: true  # enable table of contents
avatar: "terminal"  # optional, auto-selected from primary tag
```

### Avatar System
Auto-selected from primary tag via `TAG_AVATAR_MAP` in `src/consts.ts`:
- `docker`/`containers` → docker.svg
- `code`/`linux` → terminal.svg
- `listened` → headphones.svg
- Falls back to `/images/avatar.svg`

## Tunes Blog Post Generator

Generates weekly music posts from Last.fm data with AI content.

```bash
pnpm run tunes                        # Previous week
pnpm run tunes -- --week_start=2025-09-25  # Custom week
pnpm run tunes -- --debug             # Single album
```

**Required env vars**: `LASTFM_USER`, `LASTFM_API_KEY`, `COLLECTION_URL`, `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`
**Optional**: `TAVILY_API_KEY` (web search), `FAL_KEY` (AI collages)

**Output**:
- Content: `src/content/tunes/YYYY-MM-DD-listened-to-this-week/index.mdx`
- Images: `public/assets/YYYY-MM-DD-listened-to-this-week/{artists,albums}/`
- Cover: Strip collage (default) or FAL.ai collage

**Key files**: `scripts/generate-tunes-post.js`, `scripts/strip-collage.js`, `scripts/fal-collage.js`

## Year Wrapped Generator

Spotify Wrapped-style year-end posts from Last.fm data.

```bash
pnpm run wrapped                      # Current year
pnpm run wrapped -- --year=2025       # Specific year
pnpm run wrapped -- --skip-research   # No AI
pnpm run wrapped -- --use-cache       # Reuse Last.fm data
```

**Features**: Stats dashboard, Artist/Album of the Year, Top 25/50 lists, monthly breakdown, listening age, hidden gems, new discoveries.

**Output**: `src/content/tunes/YYYY-year-in-music.mdx`

**Key files**: `scripts/generate-year-wrapped.js`, `scripts/lib/year-stats-calculator.js`

## Medium Publisher

Cross-publish blog posts to Medium with automatic MDX component transformation.

```bash
pnpm run medium                       # Interactive post selector
pnpm run medium <slug>                # Publish specific post
pnpm run medium <slug> --dry-run      # Preview without publishing
```

**Features**:
- Interactive post selector with pagination (arrow keys to navigate)
- Transforms MDX components (YouTube, Callouts, LinkPreview, Images, etc.)
- Sets canonical URL for SEO backlinks
- Adds original publish date in footer
- Opens original post in browser for easy image copying
- Publishes as draft for review before going live

**Component Transformations**:
| Component | Medium Output |
|-----------|---------------|
| YouTube | Auto-embedded URL |
| Instagram | Auto-embedded URL |
| LinkPreview | Rich text link with description |
| Callouts | Blockquote with emoji |
| Mermaid | Link to original (not supported) |
| Images | Absolute URLs |
| LightGallery | Extracted images |

**Required env vars**: `MEDIUM_TOKEN` (get from https://medium.com/me/settings/security)
**Optional**: `BLOG_URL` (default: https://www.russ.cloud), `GITHUB_TOKEN` (for Gist code blocks)

**Key files**: `scripts/publish-to-medium.js`, `scripts/lib/medium-client.js`, `scripts/lib/mdx-to-medium.js`

## Guidelines

- **Style**: 2-space indent, no semicolons, PascalCase components
- **Files**: Components in PascalCase, routes in kebab-case, posts as `YYYY-MM-DD-slug.md`
- **Testing**: `npx astro check` before commits
- **External links**: Auto-enhanced via `src/utils/rehype-external-links.ts` (adds `target="_blank"`, arrow icon)
- **Security**: Use `sanitize-html` for HTML sanitization, never regex

See `docs/README.md` for additional guidelines.
