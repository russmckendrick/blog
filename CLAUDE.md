# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start Astro development server (http://localhost:4321) with hot reloading
- `npm run build` - Build production site to `./dist/`
- `npm run preview` - Preview production build locally
- `npx astro check` - Run type-safe Astro diagnostics (run before PRs)
- `npm run astro -- sync` - Regenerate types after adding/changing frontmatter fields

### Content Creation
- `npm run post` - Interactive script to create a new blog post with proper structure
  - Prompts for title, description, tags, and ToC preference
  - Automatically creates MDX file with frontmatter in `src/content/blog/`
  - Creates corresponding assets directory in `src/assets/`
  - Generates filename in format: `YYYY-MM-DD-slug.mdx`
  - Sets `draft: true` by default

- `npm run tunes` - Generate weekly music blog post from Last.fm data (see [Tunes Generator](#tunes-blog-post-generator))
  - Fetches Last.fm listening stats for the previous week
  - AI-powered album research and content generation
  - Downloads artist/album artwork from russ.fm
  - Creates MDX post with galleries in `src/content/tunes/`
  - Options: `--week_start=YYYY-MM-DD` (custom week), `--debug` (single album)

### Image Optimization
- `npm run optimize` - Optimize all images in `src/assets/` and `public/assets/` in place
  - Compresses JPG, PNG, WebP, and AVIF formats
  - Uses quality 85 with progressive JPEGs
  - Only replaces originals if optimization saves space
  - Shows progress and savings for each image
  - Displays total space saved summary
- `npm run optimize <path>` - Optimize images in a specific directory
  - Supports both relative (to project root) and absolute paths
  - Example: `npm run optimize src/assets/2025-10-01-my-post`

### Content Migration
- `scripts/convert-to-mdx.sh` - Script for migrating legacy posts to MDX format

## Build & Deployment

### GitHub Actions Workflow
The site uses GitHub Actions for optimized builds and deployment to Cloudflare Pages:
- **Workflow**: `.github/workflows/deploy.yml` - Main build and deploy workflow
- **Trigger**: Runs on push to `main` and on pull requests
- **Performance**: First build ~20min, subsequent builds ~2-5min (with caching)
- **Caching Strategy**:
  - Caches `node_modules/` for faster dependency installation
  - Caches `node_modules/.astro/` for processed images (prevents reprocessing 9,320+ image variations)
  - Cache key based on `src/**` and `public/**` file hashes
- **Deployment**: Uses Wrangler CLI to deploy to Cloudflare Pages

### Build Performance
- **Source images**: 173 images in `src/assets/`
- **Generated variations**: ~9,320 image operations (53 per source image)
- **Formats**: webp, avif, png at multiple responsive sizes
- **Optimization**: Smart caching dramatically reduces subsequent build times

### Setup Requirements
To use the GitHub Actions workflow, configure these repository secrets:
- `CLOUDFLARE_API_TOKEN` - API token with Cloudflare Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

See `BUILD_OPTIMIZATION.md` for detailed setup instructions and performance analysis.

## Architecture Overview

### OpenGraph Image Generation

The site automatically generates custom OpenGraph (OG) images for all blog posts using `astro-og-canvas`:
- **Endpoint**: `src/pages/og/[...route].ts` - Dynamic route that generates OG images
- **Images**: Generated at build time and saved to `dist/og/[post-slug].png`
- **Dimensions**: 1200x630 (standard OG image size)
- **Design**: Features site logo, gradient background (gray-900 to gray-800), blue accent border, and Inter font family
- **Integration**: Blog posts automatically reference their OG image in meta tags via the `ogImageSlug` prop
- **Caching**: Images are cached in `node_modules/.astro-og-canvas` across builds for performance

The OG images are automatically linked in the HTML meta tags for both OpenGraph and Twitter Card metadata.

### Image Processing & Delivery

The site uses **Cloudflare Image Transformations** for on-demand image optimization and delivery:

**Architecture**:
- **No build-time processing**: Images are NOT processed during `npm run build`
- **CDN-level transformations**: Cloudflare intercepts `/cdn-cgi/image/` URLs automatically
- **On-demand optimization**: Images are resized/optimized on first request, then cached globally
- **Automatic format selection**: Serves AVIF → WebP → original based on browser support

**Implementation**:
- Helper utility: `src/utils/cloudflare-images.ts`
- URL pattern: `/cdn-cgi/image/width=800,quality=85,format=auto/assets/image.jpg`
- Quality presets: `CF_IMAGE_PRESETS` (hero, thumbnail, gallery, avatar)
- **No adapter needed**: Works with fully static sites

**Benefits**:
- Build time reduced from 20+ minutes to 2-3 minutes
- No Sharp processing (9,320+ image operations eliminated)
- Global CDN delivery (280+ Cloudflare edge locations)
- Free tier: 5,000 unique transformations/month

**Components using Cloudflare Images**:
- `PostCard.astro`: Card thumbnails with responsive srcset
- `BlogPost.astro`: Hero images for blog posts
- `Img.astro`: Embed component for inline images with LightGallery zoom
- All components use `getCFImageUrl()` and `generateCFSrcSet()` helpers

**Transformation options**: width, height, quality (1-100), format (auto/webp/avif/jpeg), fit (scale-down/contain/cover/crop/pad), gravity (auto/left/right/top/bottom/center), sharpen (0-10), blur (0-250), metadata (keep/copyright/none)

**Docs**: https://developers.cloudflare.com/images/transform-images/transform-via-url/

### SEO Management

The site uses `astro-seo-plugin` for comprehensive SEO optimization:
- **Component**: `AstroSEO` component imported in `src/components/layout/BaseHead.astro`
- **Features**: Manages meta tags, OpenGraph tags, Twitter Card tags, canonical URLs, and robots directives
- **Social**: Configured with Twitter handle `@russmckendrick` for creator attribution
- **Verification**: Includes Mastodon verification link (`rel="me"`)
- **Sitemap**: Automatically generated via `@astrojs/sitemap` integration, excludes `/draft/` pages
- **robots.txt**: Generated via `astro-robots-txt` integration with proper disallow rules
- **RSS Feed**: Available at `/rss.xml` with correct date-based URLs matching site structure

#### Structured Data (Schema.org)

The site implements rich structured data for enhanced search engine visibility:

**Automatic Schema (All Blog Posts):**
- **BlogPosting**: Automatically added to every blog post with title, description, dates, author, and keywords
- **BreadcrumbList**: Automatically generated from the breadcrumb navigation (Home → Year → Post)
- **Person**: Author information with social links and expertise areas
- **Organization**: Publisher information for the blog

**Optional Schema (Add Manually to Posts):**
- **FAQ Schema** (`createFAQSchema`): For posts with Q&A sections - generates rich snippets with expandable questions
- **HowTo Schema** (`createHowToSchema`): For tutorial posts - generates step-by-step rich snippets with images

**Usage Example - Adding FAQ Schema:**
```astro
---
import { Schema } from 'astro-seo-schema';
import { createFAQSchema } from '../utils/schema';

const faqSchema = createFAQSchema([
  {
    question: "How do I install Docker on Ubuntu?",
    answer: "First update your package index with 'sudo apt update', then install prerequisites..."
  },
  {
    question: "What is Cloudflare Tunnel?",
    answer: "Cloudflare Tunnel is a secure way to connect your web services to Cloudflare..."
  }
], Astro.url.toString());
---
<Schema item={faqSchema} />
```

**Usage Example - Adding HowTo Schema:**
```astro
---
import { createHowToSchema } from '../utils/schema';

const howToSchema = createHowToSchema({
  name: "Install n8n locally using Cloudflare",
  description: "Complete guide to setting up n8n with Docker and Cloudflare Tunnel",
  url: Astro.url.toString(),
  totalTime: "PT30M", // ISO 8601 duration format (30 minutes)
  image: ogImage,
  steps: [
    { name: "Install Docker", text: "Update apt and install Docker prerequisites..." },
    { name: "Setup Cloudflare Tunnel", text: "Create a new tunnel in Cloudflare Zero Trust..." },
    { name: "Configure n8n", text: "Create docker-compose.yml with PostgreSQL and n8n..." }
  ]
});
---
<Schema item={howToSchema} />
```

**Schema.org Resources:**
- All schema utilities are in `src/utils/schema.ts`
- Uses `schema-dts` for TypeScript type safety
- Validate schemas with [Google Rich Results Test](https://search.google.com/test/rich-results)
- Test structured data with [Schema.org Validator](https://validator.schema.org/)

### Content Collections
This site uses Astro's content collections system for type-safe content management:
- **Blog collection** (`src/content/blog/`): Main blog posts in `.md` or `.mdx` format
  - Configured in `src/content.config.ts` with Zod schema for frontmatter validation
  - Supports both Astro-native and Hugo-style frontmatter fields (e.g., `date`/`pubDate`, `cover` object)
  - Automatically transforms dates and normalizes field names for backward compatibility
- **Tunes collection** (`src/content/tunes/`): Music-related content with album metadata

### URL Structure and Routing
Blog posts use a date-based URL pattern: `/[year]/[month]/[day]/[slug]`
- Dynamic route implemented in `src/pages/[year]/[month]/[day]/[slug].astro`
- Slugs are generated from post titles via `createUrlFriendlySlug()` in `src/utils/url.ts`
- The `getStaticPaths()` function extracts date components and generates all static routes at build time

### MDX Component System
Global MDX components are available in all blog posts without imports:
- Components defined in `mdx-components.ts` (root level) are automatically available
- Embed components live in `src/components/embeds/`
- Callout components in `src/components/embeds/callouts/`: Info, Note, Tip, Warning, Important, Caution, General
- All components are injected via the `components` prop in the dynamic blog post route (`src/pages/[year]/[month]/[day]/[slug].astro`)
- See `EMBED_USAGE.md` for detailed component usage examples

**Available Embed Components:**
- **Media**: YouTube, Instagram, Giphy, Reddit, Img, LightGallery
- **Audio/Music**: Audio (MP3/OGG/WAV), AppleMusic
- **Content**: LinkPreview, ChatMessage
- **Callouts**: 8 types (Note, Tip, Info, Important, Warning, Caution, General, Callout)

**LightGallery Meta File Plugin:**
The LightGallery component includes a custom plugin that automatically loads image captions from `.meta` files:
- **Format**: `.meta` files are JSON files with the structure `{"Title": "Caption text"}`
- **Location**: Place `.meta` files alongside images (e.g., `/assets/image.jpg` + `/assets/image.jpg.meta`)
- **Auto-enabled**: Plugin is enabled by default on all LightGallery instances
- **Hugo-compatible**: Maintains compatibility with Hugo's `.meta` file system from the previous site architecture
- **Props**:
  - `enableMetaPlugin={true}` - Enable/disable the plugin (default: `true`)
  - `debugMeta={false}` - Enable console logging for debugging (default: `false`)
- **Implementation**: Plugin fetches `.meta` files via `fetch()` and sets `data-sub-html` attributes on gallery items
- **File location**: `src/utils/lightgallery-meta-plugin.ts` (standalone module) and inline in `src/components/embeds/LightGalleryNew.astro`

**Adding New Embed Components:**
1. Create component in `src/components/embeds/YourComponent.astro`
2. Export from `src/components/embeds/index.ts`
3. Add to imports in `mdx-components.ts` (root) and export in `components` object
4. Add to imports in `src/pages/[year]/[month]/[day]/[slug].astro` and add to `components` object
5. Update `EMBED_USAGE.md` with usage examples and features
6. Add example to `src/content/blog/2025-09-29-kitchen-sink.mdx`

**Embed Component Guidelines:**
- Use Tailwind classes directly (no `@apply` in Tailwind v4)
- Support dark mode via `.dark` class selector
- Use `is:global` for styles that need to affect markdown content
- For theme-aware embeds, watch `document.documentElement` for class changes
- Set `data-theme` attribute for Expressive Code integration when needed
- Keep components responsive with max-width constraints
- Use `my-6` for consistent vertical spacing

### Styling System
- Tailwind CSS 4.x via `@tailwindcss/vite` plugin (configured in `astro.config.mjs`)
- Tailwind Typography plugin (`@tailwindcss/typography`) for prose styling
- Global styles in `src/styles/global.css`
- Dark mode via `.dark` class on `<html>` element (toggled by theme switcher in Header)
- Theme also sets `data-theme="dark"` or `data-theme="light"` for Expressive Code integration
- **Important**: Tailwind v4 has strict `@apply` rules - prefer standard CSS properties or inline Tailwind classes

### Code Highlighting
- Uses `astro-expressive-code` with GitHub Dark/Light themes
- Syntax highlighting disabled in markdown (`syntaxHighlight: false`) - handled by Expressive Code
- Theme selection via `data-theme` CSS selector (`[data-theme='dark']` or `[data-theme='light']`)
- Custom styling: Fira Code font, 0.5rem border radius
- Code blocks automatically styled with `my-6` spacing via global CSS
- **Note**: Expressive Code must be placed before `mdx()` in integrations array

### Site Configuration
- Site URL and integrations in `astro.config.mjs`
- Site metadata, social links, and navigation in `src/consts.ts`
- Tag metadata with colors and emojis defined in `TAG_METADATA` constant in `src/consts.ts`
- Sitemap automatically excludes `/draft/` pages
- Search functionality via Pagefind integration

### Page Transitions (Astro View Transitions)
The site uses Astro's native View Transitions API for smooth page navigation:

**Implementation** (`src/layouts/BaseLayout.astro`):
- **Component**: `<ViewTransitions />` added in the `<head>` section
- **Animation**: Uses default fade transition (customizable via `transition:animate` directives)
- **Fallback**: Automatic fallback for browsers without View Transitions API support
- **Accessibility**: Respects `prefers-reduced-motion` automatically
- **Performance**: Faster than JavaScript-based solutions, uses browser-native APIs

**Available Transition Animations**:
- `fade` - Default smooth crossfade (currently in use)
- `slide` - Content slides in from right/left based on navigation direction
- `initial` - Uses browser's default View Transition styling
- `none` - Disables animations entirely

**Customizing Transitions**:
Add `transition:animate` directive to elements for custom animations:
```astro
<main transition:animate="slide">
  <slot />
</main>
```

For custom animations, define keyframes in `src/styles/global.css`:
```css
@keyframes custom-fade {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Critical Pattern - DOM Cleanup for Third-Party Libraries**:
When using JavaScript libraries that append elements to `document.body` (like LightGallery), you MUST implement cleanup using View Transitions lifecycle events:

```javascript
// In BaseLayout.astro (global cleanup for all pages)
function cleanupLibrary() {
  // Remove persisted DOM elements
  document.querySelectorAll('.library-element').forEach(el => el.remove());
}

document.addEventListener('astro:before-swap', cleanupLibrary);
```

**Why This Matters**:
- Astro View Transitions only replace the page content (typically `<main>`)
- Elements appended to `document.body` are NOT automatically removed
- Without cleanup, artifacts from previous pages will persist and cause visual bugs
- Always place cleanup logic in `BaseLayout.astro` so it runs for all transitions

**LightGallery Cleanup Implementation**:
The site implements comprehensive LightGallery cleanup in `BaseLayout.astro`:
- Removes `.lg-outer`, `.lg-backdrop`, `.lg-container` elements
- Removes the unified gallery container (`#unified-lightgallery`)
- Cleans up all elements with `lg-` class/ID prefixes
- Resets gallery initialization flags
- Uses `astro:before-swap` event for cleanup timing

**Lifecycle Events**:
- `astro:before-preparation` - Before fetching new page
- `astro:after-preparation` - After new page HTML loaded
- `astro:before-swap` - Before old page replaced (use for cleanup)
- `astro:after-swap` - After new page inserted
- `astro:page-load` - After navigation complete (use for re-initialization)

**Best Practices**:
1. Place global cleanup hooks in `BaseLayout.astro`
2. Use `astro:before-swap` for cleanup (runs before old content removed)
3. Use `astro:page-load` for re-initialization (runs after new page ready)
4. Add `transition:persist` to elements that should maintain state across navigations
5. Test navigation between pages with different content to verify cleanup
6. Check browser console for orphaned DOM elements during development

**Persisting State Across Transitions**:
Use `transition:persist` to maintain component state (e.g., video players, forms):
```astro
<video transition:persist controls>
  <source src="video.mp4" />
</video>
```

**Script Behavior**:
- Inline scripts re-execute on every page navigation
- Bundled module scripts only execute once (on initial load)
- Use `astro:page-load` event to re-run initialization code:
```javascript
document.addEventListener('astro:page-load', () => {
  // Re-initialize components here
});
```

### Build Optimization
The site uses `@playform/compress` for production build optimization:
- **Integration**: `@playform/compress` compresses all static assets in the build output
- **Position**: Added last in the integrations array for optimal compression
- **Asset Types Compressed**:
  - CSS (via csso/lightningcss)
  - HTML (via html-minifier-terser)
  - JavaScript (via terser)
  - JSON (via native JSON.stringify)
  - Images (via sharp): avif, gif, heic, heif, jpeg, jpg, png, raw, tiff, webp
  - SVG (via svgo)
- **Configuration**: Uses default settings for all compression types
- **Note**: Only compresses statically generated build output and pre-rendered routes, not runtime requests

### Layout Structure
- `BaseLayout.astro`: Base HTML structure with head and footer
- `BlogPost.astro`: Blog-specific layout with hero images, date display, and tag styling
- Header/Footer components in `src/components/layout/`

### Tags System
- Tags page at `/tags/` displays all tags with post counts
- Animated tag cloud using Web Animations API with staggered fade-in effects
- Each tag has custom colors defined in `TAG_METADATA` (src/consts.ts)
- Tag colors: light/dark mode variants with inset rings
- Tag pages at `/tags/[tag]/[page]/` for browsing posts by tag
- Pagination built-in for tag archives

### Table of Contents
- Automatically generated from markdown headings (h2 and h3)
- Enabled per-post via `showToc: true` in frontmatter
- Collapsible component with smooth scrolling
- Displays at the top of post content, before the article body
- Component: `src/components/blog/TableOfContents.astro`
- Supports both `showToc` and `ShowToc` frontmatter fields (Hugo compatibility)
- Headings automatically get scroll margin to account for fixed header
- Dark mode support with theme-aware styling

## Important Frontmatter Fields

Blog posts support both native Astro and Hugo-style frontmatter:
- `title` (required): Post title
- `description` (required): Post description - ensure each post has a unique, SEO-optimized description
- `date` or `pubDate`: Publication date (date takes precedence for Hugo compatibility)
- `updatedDate`: Date when the post was last updated
- `lastModified`: Alternative field for last modified date (takes precedence over updatedDate)
- `tags`: Array of tag strings
- `heroImage`: Astro image import for hero banner
- `cover.image`: Hugo-style cover image path
- `cover.alt`: Alt text for cover image (falls back to title if not provided)
- `draft`: Boolean to exclude from production builds
- `showToc` or `ShowToc`: Display table of contents
- `avatar`: Avatar name for post author (optional)

### Avatar System

The blog supports custom avatars for posts with 19 unique avatar designs available in both PNG and SVG formats:

**Available Avatars:**
- `arms-folded` - Professional pose with arms crossed
- `arms-to-side` - Casual standing pose
- `coffee` - Holding a coffee cup (great for casual posts)
- `dark-mode` - Wearing sunglasses (perfect for technical deep-dives)
- `founder` - Business professional look
- `glitch` - Digital glitch effect
- `hacker` - Hoodie and laptop (ideal for security/hacking posts)
- `headphones` - Listening to music (perfect for tunes posts)
- `hipster` - Trendy casual style
- `jobs` - Steve Jobs style (turtleneck)
- `matrix` - Matrix-inspired digital theme
- `noir` - Film noir black and white aesthetic
- `pixil` - Pixelated retro gaming style
- `snug` - Cozy comfortable pose
- `speaker` - Presenting or speaking
- `suit` - Formal business attire
- `terminal` - Command-line focused (DevOps/coding)
- `thumbs-down` - Negative feedback pose
- `thumbs-up` - Positive feedback pose

**Usage in Frontmatter:**
```yaml
---
title: "My Docker Tutorial"
description: "Learn Docker the easy way"
tags: ["docker", "devops"]
avatar: "terminal"  # Just the name, no extension needed
---
```

**Format Support:**
- Specify avatar name without extension (defaults to `.svg`)
- Or include extension: `avatar: "coffee.png"` or `avatar: "coffee.svg"`
- Avatars are loaded from `/public/images/avatars/`
- Falls back to default `/images/avatar.svg` if not specified

**Visual Features:**
- **Blog posts**: Large 80-96px avatar with colored ring matching primary tag
- **Post cards**: Medium 40-56px avatar in metadata section
- **Effects**: Gradient glow on hover, smooth scale transitions
- **Schema.org**: Avatar automatically included in author structured data

**Recommended Pairings:**
- Technical/DevOps posts: `terminal`, `hacker`, `matrix`, `dark-mode`
- Music posts: `headphones`, `speaker`
- Casual/personal posts: `coffee`, `snug`, `arms-to-side`
- Professional/business: `suit`, `founder`, `arms-folded`
- Tutorial feedback: `thumbs-up`, `thumbs-down`

**SEO Best Practices**:
- Always provide unique `description` for each post (used in meta tags and OpenGraph)
- Add `cover.alt` text for hero images to improve accessibility and image SEO
- Use `lastModified` or `updatedDate` when updating posts to help search engines understand content freshness
- LightGallery images support `alt` attribute - use it for better accessibility

After changing the schema in `src/content.config.ts`, run `npm run astro -- sync` to regenerate TypeScript types.

## File Naming Conventions
- Components: PascalCase (`Header.astro`, `PostCard.astro`)
- Routes: kebab-case (`about.astro`) or bracketed for dynamic segments (`[slug].astro`)
- Blog posts: lowercase with hyphens (`2024-12-27-post-title.md`)
- Keep blog post filenames consistent with URL slug format

## Content Workflow
1. Create new posts in `src/content/blog/` as `.md` or `.mdx`
2. Use lowercase filenames with hyphens for consistent URL slugs
3. Run `npm run astro -- sync` after adding new frontmatter fields
4. For embeds, use components from `src/components/embeds/` (see `EMBED_USAGE.md`)
5. Test in dev mode across light/dark themes and responsive breakpoints
6. Verify with `npx astro check` before committing

## External Links
External links in markdown are automatically enhanced via `rehypeExternalLinks` plugin (`src/utils/rehype-external-links.ts`):
- Adds `target="_blank"` and `rel="nofollow noopener noreferrer"` attributes
- Adds arrow icon (↗) after link text
- Supports `[noExternalIcon]` marker to suppress icon
- Supports `[noSpace]` marker to remove spacing before icon
- Markers are automatically stripped from displayed text
- Icon styling in `src/styles/global.css` with hover animation

## Tunes Blog Post Generator

Automated weekly music blog post generation using Last.fm data and AI content generation. See `scripts/TUNES_README.md` for full documentation.

### Quick Start
```bash
# Generate post for previous week
npm run tunes

# Custom week
npm run tunes -- --week_start=2025-09-25

# Debug mode (single album only)
npm run tunes -- --debug
```

### Environment Variables Required
```bash
# Last.fm
LASTFM_USER=your-username
LASTFM_API_KEY=your-api-key

# Collection metadata
COLLECTION_URL=https://www.russ.fm

# AI Provider (choose one)
OPENAI_API_KEY=your-key
# OR
ANTHROPIC_API_KEY=your-key

# Optional: Web search for album facts
TAVILY_API_KEY=your-key
```

### What It Does
1. Fetches weekly listening stats from Last.fm (top 11 artists/albums)
2. Retrieves album/artist metadata (images, links) from russ.fm collection
3. AI researches each album and writes engaging blog sections
4. Downloads high-res artwork to `src/assets/[date]-listened-to-this-week/`
5. Generates MDX post with LightGallery components in `src/content/tunes/`

### Output Structure
- **Content**: `src/content/tunes/YYYY-MM-DD-listened-to-this-week/index.mdx`
- **Images**: `src/assets/YYYY-MM-DD-listened-to-this-week/{artists,albums}/`
- **Features**: Frontmatter, artist/album galleries, AI-generated sections, Top N lists with play counts

### Tech Stack
- **LangChain.js** - AI orchestration
- **OpenAI GPT-4 / Anthropic Claude** - Content generation
- **Tavily API** - Optional web search for factual research
- **Last.fm API** - Listening statistics
- **russ.fm** - Collection metadata and images

### Key Files
- `scripts/generate-tunes-post.js` - Main orchestrator
- `scripts/lib/lastfm-client.js` - Last.fm API
- `scripts/lib/collection-manager.js` - russ.fm metadata
- `scripts/lib/content-generator.js` - AI content (LangChain)
- `scripts/lib/image-handler.js` - Image downloads
- `scripts/lib/blog-post-renderer.js` - MDX rendering

## Existing Guidelines
Additional repository guidelines are documented in `AGENTS.md`, including:
- Module organization (pages in `src/pages`, components in `src/components`, utils in `src/utils`)
- Coding style (2-space indentation, semicolon-free, PascalCase components)
- Commit message conventions (imperative, single-sentence)
- Testing approach (manual verification + `npx astro check`)