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
  - [lightGallery](https://www.lightgalleryjs.com) for images and galleries

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
| `pnpm run post`            | Create a new blog post scaffold                  |
| `pnpm run tunes`           | Generate weekly music blog post from Last.fm     |
| `pnpm run wrapped`         | Generate year-end wrapped music post             |
| `pnpm run medium`          | Cross-publish blog post to Medium                |
| `pnpm run optimize`        | Optimize all images in `src/assets/` and `public/assets/` |
| `pnpm run optimize <path>` | Optimize images in a specific directory          |
| `pnpm run analyze-links`   | Audit internal linking between posts             |
| `pnpm run extract-colors`  | Refresh hero gradient color data                 |
| `pnpm run cache-link-previews` | Cache OG images for `LinkPreview` embeds    |
| `pnpm run refresh-link-previews` | Refresh stale cached link preview images |
| `pnpm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm run astro -- --help` | Get help using the Astro CLI                     |

### Creating a New Blog Post

Creating a post is a two-step workflow: scaffold first, then generate the
cover from the finished content.

**1. Scaffold the post** with `pnpm run post`. The interactive script prompts
for title, description, tags, and ToC preference, then creates:

- MDX file in `src/content/blog/` with format: `YYYY-MM-DD-slug.mdx`
- Assets directory in `src/assets/YYYY-MM-DD-slug/`
- A placeholder cover image
- Complete frontmatter with all required fields, `draft: true` for safety

**2. Generate the cover** once the post is written:

```bash
node scripts/generate-cover.js YYYY-MM-DD-slug.mdx
```

The script reads the full post content, has GPT-5.4 design an image prompt
that represents that specific post (creative freedom over style and concept
with a default lean toward photographic realism - the only hard rules are no
text of any kind, no software UIs, no branding, and no watermarks; covers
are pure visual interpretation), shows you the prompt for review/refinement,
and generates the cover with OpenAI `gpt-image-2` via FAL:

```bash
# 📝 PROMPT REVIEW
# 🎨 Current image prompt: "..."
# ✓ Accept prompt? (y)es / (c)hat / (d)irect replace / (r)egenerate / (q)uit: y

# Writes:
# - src/assets/2025-10-01-my-awesome-post/blog-cover-2025-10-01-my-awesome-post.png
# - src/assets/2025-10-01-my-awesome-post/blog-cover-2025-10-01-my-awesome-post-small.png
```

Useful flags: `--dry-run` (print the prompt only), `--prompt="..."` (bring
your own prompt, skips the LLM step), `--hint="..."` (steer the prompt model),
`--text=<file|->` (use draft text for a post not written yet), and
`--bulk[=N|all]` (pick from the most recent posts and regenerate covers for
the selected ones in one run).

**Environment variables for cover generation:**
- `FAL_KEY` - FAL.ai API key (required)
- `OPENAI_API_KEY` - OpenAI API key (required unless `--prompt` is given)

## 📚 Documentation

Comprehensive documentation is available in the [docs/](./docs/) folder:

### Quick Links

- **[AGENTS.md](./AGENTS.md)** - Development guide for AI coding agents (detailed architecture and workflows)
- **[docs/README.md](./docs/README.md)** - Documentation index and navigation

### User Guides

- **[Getting Started](./docs/guides/getting-started.md)** - Setup and development environment
- **[Creating Posts](./docs/guides/creating-posts.md)** - How to write and publish blog posts
- **[Using Tags](./docs/guides/using-tags.md)** - Complete tag system reference (30+ tags)
- **[Using Embeds](./docs/guides/using-embeds.md)** - Embed components quick reference
- **[Style Guide](./docs/guides/style-guide.md)** - UI and interaction conventions
- **[Tunes Generator](./docs/guides/tunes-generator.md)** - Automated weekly music posts
- **[Medium Publisher](./docs/guides/medium-publisher.md)** - Cross-publish posts to Medium

### Architecture

- **[System Overview](./docs/architecture/overview.md)** - Architecture with diagrams
- **[Image Delivery](./docs/architecture/image-delivery.md)** - Cloudflare Image Transformations
- **[SEO Implementation](./docs/architecture/seo-implementation.md)** - SEO strategy and structured data

### Reference

- **[Embed Components](./docs/reference/embed-components.md)** - Complete embed component API
- **[Frontmatter Fields](./docs/reference/frontmatter-fields.md)** - Blog post schema reference
- **[LightGallery Meta](./docs/reference/lightgallery-meta.md)** - Image caption system
- **[Scripts Reference](./docs/reference/scripts.md)** - Scripts, templates, caches, and helper modules

## 👀 Want to learn more?

Check out [Astro documentation](https://docs.astro.build) for more information about the framework.

## Build stats

[![Build and Deploy to Cloudflare Workers](https://github.com/russmckendrick/blog/actions/workflows/deploy.yml/badge.svg)](https://github.com/russmckendrick/blog/actions/workflows/deploy.yml)
[![Generate Weekly Listened to Blog Post](https://github.com/russmckendrick/blog/actions/workflows/weekly-tunes.yml/badge.svg)](https://github.com/russmckendrick/blog/actions/workflows/weekly-tunes.yml)
