# Creating Blog Posts

Complete guide to creating and publishing blog posts on Russ.Cloud.

## Quick Start

```bash
# Create new post (interactive)
pnpm run post
```

This will:
1. Prompt for title, description, tags, and ToC preference
2. Copy the placeholder cover image into the assets directory
3. Generate MDX file: `src/content/blog/YYYY-MM-DD-slug.mdx`
4. Create assets directory: `src/assets/YYYY-MM-DD-slug/`
5. Set `draft: true` for safety

The real cover is generated **after** the post is written, from the post itself.

### AI Cover Generation

Once the post content exists, generate a cover from it:

```bash
node scripts/generate-cover.js YYYY-MM-DD-slug.mdx
```

The script reads the full post body (frontmatter, embeds, and code blocks are
stripped down to the prose), has GPT-5.4 design an image prompt that represents
that specific post, and generates the image with OpenAI `gpt-image-2` (via
FAL, at 2560×1440). No
style constraints are imposed - the model has creative freedom over style,
medium, mood, and concept, with a default lean toward photographic realism
(illustration only when the post calls for it), and nothing is appended to
its prompt. The only hard rules are defect guards: no text or lettering of
any kind and no text-bearing props - signs, shopfronts, labels, documents -
unless described as blank (image models write gibberish on anything that
usually carries text), no software interfaces (fake app windows, dashboards,
terminal screens), no branding real or invented, and no watermarks. Covers
are pure visual interpretation of the post.

The proposed prompt is shown for review before any image is generated:

```
────────────────────────────────────────────────────────────
📝 PROMPT REVIEW
────────────────────────────────────────────────────────────

🎨 Current image prompt:

   "A hand-inked etching of a terminal window unfolding into..."

✓ Accept prompt? (y)es / (c)hat / (d)irect replace / (r)egenerate / (q)uit:
```

**Interactive options:**
- **(y)es** - Accept the prompt and generate the image
- **(c)hat** - Guide the image in conversation: ask to add, remove, or
  replace elements one message at a time (e.g. "replace the engineer with a
  traditional english butler"), with the revised prompt shown after each
  turn. The chat sees the post and the whole conversation, so requests can
  build on each other. Type `done` to keep the result or `cancel` to revert
  everything from the chat. (`e` still works as an alias.)
- **(d)irect replace** - Paste your own prompt (supports multiline)
- **(r)egenerate** - Design a completely new prompt from the post
- **(q)uit** - Cancel without generating

**Useful flags:**
- `--dry-run` - print the designed prompt without generating an image
- `--prompt="..."` - bring your own prompt and skip the LLM step entirely
- `--hint="..."` - one-line steer for the prompt model (e.g. `--hint="focus on the recording feature"`)
- `--text=<file|->` - use draft text instead of a post file (for posts not written yet; requires `--output`)
- `--bulk[=N|all]` - list the N most recent posts (default 20), pick which to regenerate (e.g. `1,3,5-8` or `all`), and run each through the normal flow
- `--no-interactive`, `-y` - auto-accept the first prompt

**Bulk regeneration** composes with the other flags - `--bulk --dry-run -y`
previews the prompts a batch would produce without generating any images, and
one post failing (or being skipped with `q`) doesn't stop the rest of the run.
Prompts already used in the batch are passed to each subsequent post as
do-not-repeat context, so a run can't converge on one setting or composition.

The full-size image and a 1400×800 `-small` variant are written to
`src/assets/YYYY-MM-DD-slug/`, and a `cover:` block is added to the
frontmatter if one is missing. Re-running the script regenerates the cover for
a post in place.

**Requirements:**
- `FAL_KEY` - FAL.ai API key (required to generate the image)
- `OPENAI_API_KEY` - OpenAI API key (required unless `--prompt` is given)

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

**Tip**: Tags are also the join key for the glossary cross-linking feature - posts automatically surface related glossary entries (any whose tags overlap) as a "Glossary" list in the right-hand sidebar below the table of contents on wide screens, and glossary pages list the matching posts. Accurate, consistent tagging is all that is needed; no extra frontmatter fields are required.

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

For local images in `public/assets/`, intrinsic dimensions are usually detected automatically. For external images or unusual sources, add `height` and/or `aspectRatio` to reserve space and avoid layout shift:

```mdx
<Img
  src="https://example.com/image.jpg"
  alt="Remote screenshot"
  width={1200}
  aspectRatio="16 / 9"
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

On wide screens (2xl / 1536px+), a sticky sidebar ToC appears to the right of the content with active section highlighting on scroll. The inline collapsible ToC is hidden at this breakpoint. On tunes pages, the sticky sidebar only shows h2 headings to keep the list manageable.

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

### 3. Generate the Cover

```bash
node scripts/generate-cover.js YYYY-MM-DD-slug.mdx
```

Generates a cover from the finished post content (see [AI Cover Generation](#ai-cover-generation)).

### 4. Add Images

Place in `src/assets/YYYY-MM-DD-slug/`

### 5. Preview Locally

```bash
pnpm run dev
```

Visit: `http://localhost:4321/YYYY/MM/DD/slug/`

### 6. Check Quality

```bash
npx astro check
```

Fix any TypeScript or Astro errors.

### 7. Set Draft False

```yaml
draft: false
```

### 8. Commit and Push

```bash
git add .
git commit -m "Add post: Title"
git push
```

### 9. Verify Deployment

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

## Adding a Book

Books live in their own collection at `src/content/books/`. Each book is a single MDX file whose name (without the extension) becomes the URL slug at `/books/{slug}/`.

### 1. Create the file

```bash
touch src/content/books/my-new-book.mdx
```

### 2. Fill in the frontmatter

```yaml
---
title: "Mastering Whatever, Fifth Edition"
description: "One-sentence summary used for cards, meta description, and the OG image."
cover: "/assets/about/images/15.jpg"   # served from public/
alt: "Mastering Whatever, Fifth Edition"
publisher: "Packt Publishing"
buyLink: "https://www.packtpub.com/..."  # omit for out-of-print titles
year: 2026
topic: "Docker"                          # free-form, surfaces in the breadcrumb
tags: ["docker", "devops", "containers", "book"]   # lowercase; matches blog tags via normalizeTagSlug
pubDate: 2026-05-01
order: 15                                # explicit display order on /books/
---
```

### 3. Write the body

The MDX body becomes the right-column content on the detail page. Aim for one to two short paragraphs covering what the book teaches and who it is for. The buy button, metadata table, and related-posts list are added automatically.

### 4. Verify

```bash
pnpm run astro -- sync
npx astro check
pnpm run dev
# Visit /books/ and /books/my-new-book/
```

The Book and BreadcrumbList JSON-LD plus the OG image at `/books/my-new-book-og.png` are generated automatically. Out-of-print titles (no `buyLink`) render "No longer in print." in place of the buy button.

## Next Steps

- **[Using Tags](./using-tags.md)** - Complete tag system reference (30+ tags)
- **[Using Embeds](./using-embeds.md)** - Comprehensive embed component guide
- **[Embed Reference](../reference/embed-components.md)** - Full component API
- **[SEO Implementation](../architecture/seo-implementation.md)** - SEO best practices

---

**Last Updated**: May 2026
