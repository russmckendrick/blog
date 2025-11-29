# Creating Blog Posts

Complete guide to creating and publishing blog posts on Russ.Cloud.

## Quick Start

```bash
# Create new post (interactive)
pnpm run post
```

This will:
1. Prompt for title, description, tags, and ToC preference
2. Optionally generate an AI-powered cover image (if `FAL_KEY` is configured)
3. Generate MDX file: `src/content/blog/YYYY-MM-DD-slug.mdx`
4. Create assets directory: `src/assets/YYYY-MM-DD-slug/`
5. Set `draft: true` for safety

### AI Cover Generation

When `FAL_KEY` environment variable is set, the script will offer to generate an AI cover image:

```
Generate AI cover image? (y/n) [y]: y

🎨 Generating AI cover image...

────────────────────────────────────────────────────────────
📝 PROMPT REVIEW
────────────────────────────────────────────────────────────

🎨 Current image prompt:

   "A dramatic close-up of sleek aluminum surfaces..."

✓ Accept prompt? (y)es / (e)dit / (r)egenerate / (q)uit:
```

**Interactive options:**
- **(y)es** - Accept the prompt and generate the image
- **(e)dit** - Describe changes and GPT-4 will refine the prompt
- **(r)egenerate** - Generate a completely new prompt from scratch
- **(q)uit** - Skip AI generation and use placeholder

**Requirements:**
- `FAL_KEY` - FAL.ai API key (required)
- `OPENAI_API_KEY` - OpenAI API key (required for prompt generation)

## Frontmatter Reference

### Required Fields

```yaml
---
title: "Post Title"                          # Required
description: "SEO-optimized description"     # Required
pubDate: 2025-11-02                          # Required
tags: ["docker", "kubernetes", "devops"]     # Required (array, 2-5 recommended)
---
```

**Note**: See **[Using Tags](./using-tags.md)** for complete tag reference with all 30+ available tags.

### Optional Fields

```yaml
---
# Cover image
cover:
  image: "./cover.jpg"                       # Path to cover image
  alt: "Description for accessibility"       # Alt text

# Publishing
draft: false                                 # Hide from production (default: true)
lastModified: 2025-11-03                     # Last update date

# Features
showToc: true                                # Show table of contents
avatar: "docker"                             # Override default avatar

# Legacy (Hugo compatibility)
date: 2025-11-02                             # Alias for pubDate
ShowToc: true                                # Alias for showToc
updatedDate: 2025-11-03                      # Alias for lastModified
---
```

### Complete Example

```yaml
---
title: "Building Scalable Microservices with Docker"
description: "Learn how to design, build, and deploy scalable microservices using Docker containers, Docker Compose, and best practices for production environments."
pubDate: 2025-11-02
lastModified: 2025-11-02
draft: false
tags: ["docker", "microservices", "devops", "kubernetes"]
cover:
  image: "./docker-microservices-cover.jpg"
  alt: "Diagram showing Docker containers orchestrating microservices"
showToc: true
avatar: "docker"
---
```

## File Naming

**Format**: `YYYY-MM-DD-slug.mdx`

**Examples**:
- `2025-11-02-building-scalable-microservices.mdx`
- `2025-11-02-docker-tips.mdx`

**Rules**:
- Use lowercase
- Use hyphens (not underscores)
- Keep slugs URL-friendly
- Dates become URL paths: `/2025/11/02/building-scalable-microservices/`

## Content Structure

### Basic Post

```mdx
---
title: "My Post"
description: "Post description"
pubDate: 2025-11-02
tags: ["tag1", "tag2"]
---

# Main Heading

Introduction paragraph.

## Section Heading

Content with **bold** and *italic* text.

### Subsection

More content here.

## Code Examples

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

## Conclusion

Wrapping up the post.
```

### With Embed Components

```mdx
---
title: "Video Tutorial"
description: "Learn with embedded videos"
pubDate: 2025-11-02
tags: ["tutorial"]
---

# Video Tutorial

Watch this quick introduction:

<YouTube id="dQw4w9WgXcQ" />

## Key Points

<NoteCallout title="Important">
Remember to save your work frequently!
</NoteCallout>

## Screenshots

<Img src="/assets/2025-11-02-video-tutorial/screenshot.jpg" alt="Application dashboard" />
```

## Using Images

### Cover Images

Place in assets directory:
```
src/assets/2025-11-02-my-post/
└── cover.jpg
```

Reference in frontmatter:
```yaml
cover:
  image: "./cover.jpg"
  alt: "Descriptive alt text"
```

### Inline Images

Use the `Img` component:

```mdx
<Img
  src="/assets/2025-11-02-my-post/screenshot.jpg"
  alt="Screenshot of the application"
/>
```

**With zoom disabled**:
```mdx
<Img
  src="/assets/screenshot.jpg"
  alt="Screenshot"
  zoom={false}
/>
```

**External images**:
```mdx
<Img
  src="https://example.com/image.jpg"
  alt="External image"
/>
```

### Image Galleries

```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/2025-11-02-post/photo1.jpg", alt: "Photo 1" },
      { src: "/assets/2025-11-02-post/photo2.jpg", alt: "Photo 2" },
      { src: "/assets/2025-11-02-post/photo3.jpg", alt: "Photo 3" }
    ]
  }}
  options={{
    thumbnail: true,
    download: false
  }}
/>
```

## Using Callouts

```mdx
<NoteCallout title="Note">
This is important information.
</NoteCallout>

<TipCallout title="Pro Tip">
Here's a helpful suggestion!
</TipCallout>

<WarningCallout title="Warning">
Be careful with this approach.
</WarningCallout>

<ImportantCallout title="Important">
Critical information goes here.
</ImportantCallout>

<InfoCallout title="Info">
Additional context or information.
</InfoCallout>

<CautionCallout title="Caution">
Proceed with care.
</CautionCallout>
```

## Embedding Media

### YouTube Videos

```mdx
<YouTube id="dQw4w9WgXcQ" />

<!-- With start/end time -->
<YouTube id="dQw4w9WgXcQ" params="start=30&end=120" />
```

### Audio Files

```mdx
<Audio mp3="/audio/podcast.mp3" />

<!-- Multiple formats -->
<Audio
  mp3="/audio/song.mp3"
  ogg="/audio/song.ogg"
  wav="/audio/song.wav"
/>
```

### Apple Music

```mdx
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" />
```

### Social Media

```mdx
<!-- Instagram -->
<Instagram permalink="https://www.instagram.com/p/ABC123/" />

<!-- Reddit -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" />

<!-- Giphy -->
<Giphy id="3o7btPCcdNniyf0ArS" />
```

### Link Previews

```mdx
<LinkPreview id="https://www.anthropic.com/news/claude-4" />

<!-- Without image -->
<LinkPreview id="https://example.com" hideMedia />
```

See [Using Embeds](./using-embeds.md) for complete component reference.

## Code Blocks

### Basic Code

````mdx
```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

### With Title

````mdx
```javascript title="greet.js"
function greet(name) {
  console.log(`Hello, ${name}!`);
}
```
````

### Highlighting Lines

````mdx
```javascript {2,4}
function greet(name) {
  // This line is highlighted
  console.log(`Hello, ${name}!`);
  // This line is also highlighted
}
```
````

## Table of Contents

Enable in frontmatter:

```yaml
---
showToc: true
---
```

Automatically generates ToC from h2 and h3 headings:

```mdx
## Introduction       # Included in ToC
### Getting Started   # Included in ToC
## Main Content      # Included in ToC
#### Details         # Not included
```

## Avatars

### Automatic Selection

Avatars are automatically selected based on the first tag:

| Tag | Avatar |
|-----|--------|
| docker, containers, kubernetes | docker.svg |
| ai | ai.svg |
| ansible | ansible.svg |
| cloud, aws | cloud.svg |
| azure | azure.svg |
| devops, automation | devops.svg |
| code, linux, terraform | terminal.svg |
| python | python.svg |
| security | hacker.svg |
| listened | headphones.svg |

### Manual Override

```yaml
---
avatar: "terminal"  # Override automatic selection
---
```

Available avatars: See [CLAUDE.md](../../CLAUDE.md#avatar-system) for full list.

## SEO Best Practices

### Write Unique Descriptions

**Good**:
```yaml
description: "Step-by-step guide to containerizing a Python application with Docker, including Dockerfile creation, multi-stage builds, and deployment strategies."
```

**Bad**:
```yaml
description: "Docker tutorial"  # Too generic
description: "Learn Docker"     # Not descriptive
```

### Add Image Alt Text

**Good**:
```mdx
<Img src="/assets/screenshot.jpg" alt="Docker dashboard showing running containers and resource usage" />
```

**Bad**:
```mdx
<Img src="/assets/screenshot.jpg" alt="Screenshot" />
```

### Use Descriptive Headings

Use headings to structure content:
```mdx
## Prerequisites
## Installation Steps
## Configuration
## Testing
## Troubleshooting
```

### Update lastModified

When updating posts:
```yaml
lastModified: 2025-11-03  # Signals freshness to search engines
```

## Publishing Workflow

### 1. Create Post

```bash
pnpm run post
```

### 2. Write Content

Edit `src/content/blog/YYYY-MM-DD-slug.mdx`

### 3. Add Images

Place in `src/assets/YYYY-MM-DD-slug/`

### 4. Preview Locally

```bash
pnpm run dev
```

Visit: `http://localhost:4321/YYYY/MM/DD/slug/`

### 5. Check Quality

```bash
npx astro check
```

Fix any TypeScript or Astro errors.

### 6. Set Draft False

```yaml
draft: false
```

### 7. Commit and Push

```bash
git add .
git commit -m "Add post: Title"
git push
```

### 8. Verify Deployment

- Wait for GitHub Actions to complete (~3-5 min)
- Visit: `https://www.russ.cloud/YYYY/MM/DD/slug/`
- Check OpenGraph preview: Share on social media or use https://metatags.io/

## Content Guidelines

### Writing Style

- Clear and concise
- Use active voice
- Break up long paragraphs
- Use headings for structure
- Add code examples where relevant

### Formatting

- Use **bold** for emphasis
- Use `code` for inline code/commands
- Use code blocks for multi-line code
- Use callouts for important info
- Add images to illustrate concepts

### Links

**Internal links**:
```mdx
[Related Post](/2025/10/15/related-post/)
```

**External links** (automatic icon):
```mdx
[Anthropic](https://anthropic.com)
```

**External without icon**:
```mdx
[Anthropic[noExternalIcon]](https://anthropic.com)
```

## Common Issues

### Post Not Showing

**Check**:
1. `draft: false` in frontmatter
2. File in `src/content/blog/`
3. Valid frontmatter (run `npx astro check`)
4. File named correctly (`YYYY-MM-DD-slug.mdx`)

### Images Not Loading

**Dev mode**: Cloudflare transformations don't work (normal)

**Production**:
- Check image path is correct
- Verify image exists in `src/assets/` or `public/assets/`
- Check alt text is provided

### Type Errors

```bash
# After changing frontmatter fields
pnpm run astro -- sync
```

### Embed Components Not Working

**Check**:
1. Component imported in `mdx-components.ts`
2. Correct syntax (e.g., `<YouTube id="..." />`)
3. Required props provided
4. No unclosed tags

## Next Steps

- **[Using Tags](./using-tags.md)** - Complete tag system reference (30+ tags)
- **[Using Embeds](./using-embeds.md)** - Comprehensive embed component guide
- **[Embed Reference](../reference/embed-components.md)** - Full component API
- **[SEO Implementation](../architecture/seo-implementation.md)** - SEO best practices

---

**Last Updated**: November 2025
