# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a Hugo-based blog hosted at https://www.russ.cloud/, focusing on technical content related to DevOps, automation, cloud computing, and infrastructure-as-code.

## Build & Development Commands

### Hugo Site Management
```bash
# Build the site locally (generates static files in /public)
hugo

# Start development server with live reload
hugo server

# Start development server including draft posts
hugo server -D

# Build for production with minification
hugo --minify
```

### Python Utilities
The repository includes several Python utility scripts for content management:

```bash
# Generate automated blog posts (requires API keys)
python generate_blog_post.py

# Fix frontmatter in posts
python hugo_util_frontmatter_clearner.py

# Update shortcodes across posts
python hugo_util_shortcode_updater.py

# Generate alt text for images
python hugo_util_alt_text_generator.py

# Wrap code blocks with proper styling
python hugo_util_code_block_wrapper.py
```

## Architecture & Structure

### Content Organization
- **`content/posts/`**: Main blog posts, organized by date with format `YYYY-MM-DD_slug/`
- **`content/tunes/`**: Auto-generated weekly listening posts from Last.fm data
- **`content/about/`**: About page content
- **`content/tags/`**: Tag taxonomy pages
- **`static/`**: Static assets (images, icons, etc.)
- **`public/`**: Generated site output (not versioned)

### Theme Configuration
- Uses multiple Hugo themes: `hugo-papermod-russcloud`, `PaperMod`, `hugo-shortcode-gallery`, `hugo-shortcode-russcloud`
- Custom theme modifications in theme directories
- Site configuration in `config.yml` with extensive customization

### Key Features
- Automated weekly listening posts generated via Python scripts
- Custom shortcodes for images, galleries, terminals
- WebP image optimization
- Custom redirects handling via `_redirects` file generation
- Full-text search functionality
- Multiple content types (posts, tunes, about)

### Post Structure
Each post follows the pattern:
```
content/posts/YYYY-MM-DD_title-slug/
├── index.md          # Main content with frontmatter
├── cover.png         # Cover image (if applicable)
└── images/           # Additional post images
```

### Frontmatter Schema
Posts use YAML frontmatter with these key fields:
- `title`: Post title
- `description`: Meta description
- `author`: Post author
- `date`: Publication date (ISO format)
- `tags`: Array of tags for categorization
- `cover`: Cover image configuration
- `showToc`: Table of contents display
- `TocOpen`: TOC expansion state

### Automation & Scripts
- **Auto-generated content**: Weekly listening posts created via Last.fm API integration
- **Image optimization**: WebP conversion and responsive images
- **Content processing**: Various Python utilities for bulk operations
- **Build process**: Hugo generates static site deployed to Cloudflare Pages

### Custom Shortcodes
- `{{< img >}}`: Responsive image with WebP generation
- `{{< terminal >}}`: Terminal-styled code blocks
- `{{< gallery >}}`: Image galleries with lightbox
- `{{< notice >}}`: Styled notice/alert boxes

## Development Notes

- The site uses a 600-second timeout for builds due to large image processing
- Custom themes are heavily modified versions of PaperMod
- Python scripts require various API keys (Last.fm, OpenAI, etc.) via environment variables
- Images are processed into WebP format automatically for performance
- The site includes extensive SEO optimization and performance tuning