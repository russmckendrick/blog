# Russ.Cloud Blog

This is the code for https://www.russ.cloud/

## Tools

- Built using [Astro](https://astro.build/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Uses:
  - [Tailwind CSS v4](https://tailwindcss.com/) for styling
  - [Expressive Code](https://expressive-code.com/) for syntax highlighting
  - [astro-og-canvas](https://github.com/delucis/astro-og-canvas) for OpenGraph image generation
  - [Pagefind](https://pagefind.app/) for search
  - Icons by [Tabler Icons](https://tabler.io/icons)

## Features

- ✅ Nearly perfect Lighthouse performance
- ✅ SEO-friendly with canonical URLs and OpenGraph data
- ✅ Auto-generated OpenGraph images for all blog posts
- ✅ Sitemap support with draft exclusion
- ✅ robots.txt generation
- ✅ RSS Feed support
- ✅ Markdown & MDX support
- ✅ Content Collections with type-safe frontmatter
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Tag system with custom colors and emojis
- ✅ Cloudflare Pages redirects via `_redirects` file

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
├── public/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   └── pages/
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

The `src/components/` directory contains Astro components, including layout components, embed components, and UI elements.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Blog posts are stored in `src/content/blog/` as `.md` or `.mdx` files. Use `getCollection()` to retrieve posts and type-check your frontmatter using the schema defined in `src/content.config.ts`. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                           |
| :------------------------- | :----------------------------------------------- |
| `pnpm install`             | Installs dependencies                            |
| `pnpm run dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm run build`           | Build your production site to `./dist/`          |
| `pnpm run preview`         | Preview your build locally, before deploying     |
| `pnpm run post`            | Create a new blog post with AI cover generation  |
| `pnpm run tunes`           | Generate weekly music blog post from Last.fm     |
| `pnpm run optimize`        | Optimize all images in `src/assets/` and `public/assets/` |
| `pnpm run optimize <path>` | Optimize images in a specific directory          |
| `pnpm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro -- --help` | Get help using the Astro CLI                     |

### Creating a New Blog Post

Run `pnpm run post` to create a new blog post. The interactive script will:

1. Prompt you for:
   - Post title
   - Description
   - Tags (comma-separated)
   - Table of contents preference (y/n)
   - AI cover generation (if `FAL_KEY` is configured)

2. If AI cover generation is enabled:
   - Generate a creative image prompt using GPT-4
   - Show you the prompt for review/refinement
   - Generate a unique cover image using FAL.ai

3. Automatically generate:
   - MDX file in `src/content/blog/` with format: `YYYY-MM-DD-slug.mdx`
   - Assets directory in `src/assets/YYYY-MM-DD-slug/`
   - AI-generated or placeholder cover image
   - Complete frontmatter with all required fields
   - Draft status set to `true` for safety

**Example:**
```bash
pnpm run post

# Prompts:
# Post title: My Awesome Post
# Description: A description of my post
# Tags: docker, kubernetes, devops
# Show table of contents? (y/n): y
# Generate AI cover image? (y/n): y
#
# 📝 PROMPT REVIEW
# 🎨 Current image prompt: "..."
# ✓ Accept prompt? (y)es / (e)dit / (r)egenerate / (q)uit: y

# Creates:
# - src/content/blog/2025-10-01-my-awesome-post.mdx
# - src/assets/2025-10-01-my-awesome-post/blog-cover-*.png (AI-generated)
# - Post URL: /2025/10/01/my-awesome-post
```

**Environment variables for AI cover generation:**
- `FAL_KEY` - FAL.ai API key (required)
- `OPENAI_API_KEY` - OpenAI API key (required for prompt generation)

## 📚 Documentation

Comprehensive documentation is available in the [docs/](./docs/) folder:

### Quick Links

- **[CLAUDE.md](./CLAUDE.md)** - Development guide for Claude Code (detailed architecture and workflows)
- **[docs/README.md](./docs/README.md)** - Documentation index and navigation

### User Guides

- **[Getting Started](./docs/guides/getting-started.md)** - Setup and development environment
- **[Creating Posts](./docs/guides/creating-posts.md)** - How to write and publish blog posts
- **[Using Tags](./docs/guides/using-tags.md)** - Complete tag system reference (30+ tags)
- **[Using Embeds](./docs/guides/using-embeds.md)** - Embed components quick reference
- **[Tunes Generator](./docs/guides/tunes-generator.md)** - Automated weekly music posts

### Architecture

- **[System Overview](./docs/architecture/overview.md)** - Architecture with diagrams
- **[Image Delivery](./docs/architecture/image-delivery.md)** - Cloudflare Image Transformations
- **[SEO Implementation](./docs/architecture/seo-implementation.md)** - SEO strategy and structured data

### Reference

- **[Embed Components](./docs/reference/embed-components.md)** - Complete embed component API
- **[Frontmatter Fields](./docs/reference/frontmatter-fields.md)** - Blog post schema reference
- **[LightGallery Meta](./docs/reference/lightgallery-meta.md)** - Image caption system

## 👀 Want to learn more?

Check out [Astro documentation](https://docs.astro.build) for more information about the framework.

## Build stats

[![Build and Deploy to Cloudflare Workers](https://github.com/russmckendrick/blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/russmckendrick/blog/actions/workflows/deploy.yml)
[![Generate Weekly Listened to Blog Post](https://github.com/russmckendrick/blog/actions/workflows/weekly-tunes.yml/badge.svg)](https://github.com/russmckendrick/blog/actions/workflows/weekly-tunes.yml)