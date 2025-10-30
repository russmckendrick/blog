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

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run post`            | Create a new blog post with proper structure     |
| `npm run optimize`        | Optimize all images in `src/assets/` and `public/assets/` |
| `npm run optimize <path>` | Optimize images in a specific directory          |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

### Creating a New Blog Post

Run `npm run post` to create a new blog post with the proper structure. The interactive script will:

1. Prompt you for:
   - Post title
   - Description
   - Tags (comma-separated)
   - Table of contents preference (y/n)

2. Automatically generate:
   - MDX file in `src/content/blog/` with format: `YYYY-MM-DD-slug.mdx`
   - Assets directory in `src/assets/YYYY-MM-DD-slug/`
   - Complete frontmatter with all required fields
   - Draft status set to `true` for safety

3. Provide you with:
   - File locations for the post and cover image
   - The future URL path for the post
   - Next steps to publish

**Example:**
```bash
npm run post

# Prompts:
# Post title: My Awesome Post
# Description: A description of my post
# Tags: docker, kubernetes, devops
# Show table of contents? (y/n): y

# Creates:
# - src/content/blog/2025-10-01-my-awesome-post.mdx
# - src/assets/2025-10-01-my-awesome-post/ (for cover image)
# - Post URL: /2025/10/01/my-awesome-post
```

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Detailed development guidelines and architecture overview
- [docs/EMBED_USAGE.md](./docs/EMBED_USAGE.md) - Complete guide to all available embed components
- [docs/TUNES_README.md](./docs/TUNES_README.md) - Details on the "Weekly Tunes" generator
- [docs/migrations](./docs/migrations) - Notes on the migrations ran when moving from Hugo

## 👀 Want to learn more?

Check out [Astro documentation](https://docs.astro.build) for more information about the framework.