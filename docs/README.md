# Russ.Cloud Blog Documentation

Welcome to the comprehensive documentation for the Russ.Cloud blog. This documentation is organized into guides, architecture references, and component documentation to help you understand and work with the blog codebase.

## Quick Links

- **Main README**: [../README.md](../README.md) - Project overview and quick start
- **Development Guide**: [../CLAUDE.md](../CLAUDE.md) - Detailed development guidelines for Claude Code

## Documentation Structure

### 📚 Guides

User-facing guides for common tasks and workflows:

- **[Getting Started](./guides/getting-started.md)** - Set up your development environment
- **[Creating Posts](./guides/creating-posts.md)** - Write and publish blog posts
- **[Using Tags](./guides/using-tags.md)** - Complete tag system reference (30+ tags)
- **[Using Embed Components](./guides/using-embeds.md)** - Add media, callouts, and interactive elements
- **[Design System](./guides/design-system.md)** - "The Curated Journal" design tokens, typography, and component patterns
- **[Style Guide](./guides/style-guide.md)** - UI, navigation, spacing, and interaction conventions
- **[Tunes Generator](./guides/tunes-generator.md)** - Generate automated weekly music posts and year-end wrapped
- **[Medium Publisher](./guides/medium-publisher.md)** - Cross-publish blog posts to Medium
- **[Accessibility](./guides/accessibility.md)** - WCAG 2.1 Level AA compliance and aria-label implementation

### 🏗️ Architecture

Technical architecture and design documentation:

- **[System Overview](./architecture/overview.md)** - High-level architecture with diagrams
- **[Image Delivery](./architecture/image-delivery.md)** - Cloudflare Image Transformations architecture
- **[SEO Implementation](./architecture/seo-implementation.md)** - SEO strategy and structured data
- **[Build & Deployment](./architecture/build-deployment.md)** - CI/CD pipeline and deployment

### 📖 Reference

Component and API reference documentation:

- **[Embed Components](./reference/embed-components.md)** - Complete embed component reference
- **[Frontmatter Fields](./reference/frontmatter-fields.md)** - Blog post frontmatter schema
- **[LightGallery Meta Plugin](./reference/lightgallery-meta.md)** - Image caption system
- **[Scripts Reference](./reference/scripts.md)** - Inventory of `scripts/`, helper modules, templates, and caches

### 🗄️ Archive

Historical documents and migration notes:

- **[Migration Notes](./archive/)** - Hugo to Astro migration documentation
- **[Implementation History](./archive/)** - Completed feature implementations

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/russmckendrick/blog/issues)
- **Questions**: Check [CLAUDE.md](../CLAUDE.md) for detailed development info
- **Examples**: See [src/content/blog/2025-09-29-kitchen-sink.mdx](../src/content/blog/) for component examples

## Contributing

See the development guides in [architecture/](./architecture/) and [../CLAUDE.md](../CLAUDE.md) for contribution guidelines.

## Quick Reference

### Common Commands

```bash
# Development
pnpm run dev             # Start dev server at localhost:4321
pnpm run build           # Build production site
pnpm run preview         # Preview production build

# Content
pnpm run post            # Create new blog post
pnpm run tunes           # Generate weekly music post
pnpm run wrapped         # Generate year-end wrapped post
pnpm run medium          # Cross-publish to Medium

# Images
pnpm run optimize        # Optimize all images
pnpm run optimize <path> # Optimize specific directory
pnpm run extract-colors  # Refresh hero gradient color data
pnpm run cache-link-previews     # Cache LinkPreview OG images
pnpm run refresh-link-previews   # Refresh stale cached OG images

# Analysis
pnpm run analyze-links   # Audit internal links between posts

# Quality
npx astro check          # Run TypeScript and Astro checks
pnpm run astro -- sync   # Regenerate content types
```

### Project Stack

- **Framework**: [Astro](https://astro.build/) 5.x
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.x
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Images**: [Cloudflare Image Transformations](https://developers.cloudflare.com/images/transform-images/)
- **Search**: [Pagefind](https://pagefind.app/)
- **Analytics**: [Plausible](https://plausible.io/)

### Directory Structure

```
blog/
├── docs/              # Documentation (you are here)
├── src/
│   ├── assets/        # Source images (optimized by Cloudflare)
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
└── scripts/           # Build and generation scripts
```

## Documentation Updates

This documentation is maintained alongside the codebase. When making significant changes:

1. Update relevant architecture docs
2. Update component reference if adding/changing components
3. Update guides if workflows change
4. Keep examples in sync with actual code

**Last Updated**: March 2026
