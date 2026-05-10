# Frontmatter Fields Reference

Complete reference for blog post frontmatter fields.

## Schema Definition

**File**: `src/content.config.ts`

The blog uses Zod schema validation for type-safe frontmatter.

## Required Fields

### title

**Type**: `string`

**Required**: Yes

**Description**: Post title displayed in headers, meta tags, and cards.

**Example**:
```yaml
title: "Installing Docker on Ubuntu 24.04"
```

**Best Practices**:
- Keep under 60 characters for SEO
- Be descriptive and specific
- Use title case

---

### description

**Type**: `string`

**Required**: Yes

**Description**: Post description used in meta tags, OpenGraph, and post cards. Critical for SEO.

**Example**:
```yaml
description: "Step-by-step guide to installing Docker on Ubuntu 24.04, including repository setup, package installation, and post-install configuration."
```

**Best Practices**:
- 50-160 characters optimal for SEO
- Unique for each post
- Accurately describe content
- Include relevant keywords

---

### pubDate

**Type**: `Date`

**Required**: Yes

**Description**: Publication date. Used for sorting, URLs, and sitemaps.

**Example**:
```yaml
pubDate: 2025-11-02
```

**Formats Accepted**:
- ISO date: `2025-11-02`
- Full datetime: `2025-11-02T10:00:00Z`

---

### tags

**Type**: `string[]`

**Required**: Yes (can be empty array)

**Description**: Post tags for categorization and related posts.

**Example**:
```yaml
tags: ["docker", "ubuntu", "devops", "containers"]
```

**Available Tags**: See `TAG_METADATA` in `src/consts.ts`

**Best Practices**:
- Use 2-5 tags per post
- Use existing tags when possible
- First tag determines avatar (if not specified)
- Tags affect related posts algorithm

---

## Optional Fields

### draft

**Type**: `boolean`

**Default**: `false`

**Description**: Hide post from production builds.

**Example**:
```yaml
draft: true  # Post won't appear on live site
```

**Usage**:
- Set `true` while writing
- Set `false` to publish
- Draft posts appear in dev mode

---

### cover

**Type**: `object`

**Default**: `undefined`

**Description**: Cover/hero image configuration. **Blog collection only** — the tunes collection no longer accepts `cover`; tunes posts must use the flat `heroImage` field instead.

**Structure**:
```yaml
cover:
  image: string  # Path to image
  alt: string    # Alt text (optional)
```

**Example**:
```yaml
cover:
  image: "./docker-setup.jpg"
  alt: "Docker logo with Ubuntu background"
```

**Image Paths**:
- Relative: `"./image.jpg"` (in same assets folder)
- Absolute: `"/assets/2025-11-02-post/image.jpg"`

---

### lastModified

**Type**: `Date`

**Default**: `undefined`

**Description**: Last modification date. Used for SEO freshness signals.

**Example**:
```yaml
pubDate: 2025-11-02
lastModified: 2025-11-03
```

**When to Use**:
- Significant content updates
- Factual corrections
- Major rewrites

---

### showToc

**Type**: `boolean`

**Default**: `false`

**Description**: Show table of contents at top of post.

**Example**:
```yaml
showToc: true
```

**Behavior**:
- Automatically generates from h2 and h3 headings (h2 only on tunes pages)
- Inline collapsible component on smaller screens
- Sticky sidebar with active section highlighting on wide screens (2xl+)
- Smooth scrolling navigation

---

### faqs

Optional array of question/answer pairs. When present, the page emits a `FAQPage` JSON-LD schema in addition to the normal `BlogPosting` schema. The questions are not rendered visually - they live in the body markdown - so this is purely a structured-data signal for search engines.

```yaml
faqs:
  - question: "Do I need root to install Docker on Ubuntu?"
    answer: "Yes - installing the Docker engine itself requires sudo, but day-to-day commands can run rootless after you add your user to the docker group."
  - question: "Which Ubuntu LTS versions are supported?"
    answer: "Docker supports the two most recent LTS releases. As of 2026 that is 22.04 and 24.04."
```

### howto

Optional structured how-to definition. When present, the page emits a `HowTo` JSON-LD schema. Use for tutorial posts that have a clear ordered set of steps.

```yaml
howto:
  totalTime: "PT30M"
  steps:
    - name: "Install the Docker engine"
      text: "Add Docker's apt repository and install the docker-ce package."
    - name: "Configure user permissions"
      text: "Add your user to the docker group so you can run commands without sudo."
```

`totalTime` uses ISO 8601 duration format. Both fields are optional in the rest of the post - the schema is purely additive.

### avatar

**Type**: `string`

**Default**: Auto-selected based on first tag

**Description**: Override default avatar selection.

**Example**:
```yaml
avatar: "docker"
```

**Available Avatars**: See [CLAUDE.md](../../CLAUDE.md#avatar-system) for full list.

**Common Avatars**:
- `docker`, `terminal`, `keyboard`, `cloud`, `python`
- `coffee`, `headphones`, `speaker`, `hacker`
- `devops`, `data`, `network`, `ai`

**Extensions**: Specify with or without `.svg`/`.png`

---

## Legacy Fields (Hugo Compatibility)

### date

**Type**: `Date`

**Alias for**: `pubDate`

**Description**: Hugo-style publication date.

**Example**:
```yaml
date: 2025-11-02  # Same as pubDate
```

**Note**: `date` takes precedence over `pubDate` if both present.

---

### updatedDate

**Type**: `Date`

**Alias for**: `lastModified`

**Description**: Hugo-style update date.

**Example**:
```yaml
updatedDate: 2025-11-03  # Same as lastModified
```

**Note**: `lastModified` takes precedence over `updatedDate` if both present.

---

### ShowToc

**Type**: `boolean`

**Alias for**: `showToc`

**Description**: Hugo-style ToC flag (capitalized).

**Example**:
```yaml
ShowToc: true  # Same as showToc
```

---

### heroImage

**Type**: `ImageMetadata` or `string`

**Description**: Flat hero image path. Used by all tunes posts and accepted as an alternative to `cover` on blog posts.

**Example (tunes — canonical form)**:
```yaml
heroImage: "../../assets/2026-02-23-listened-to-this-week/cover.png"
```

**Example (blog with import)**:
```astro
---
import heroImg from '../assets/hero.jpg';

export const frontmatter = {
  heroImage: heroImg
};
---
```

**Note**: All tunes posts use `heroImage`. Blog posts can use either `heroImage` or the richer `cover` object (which adds `alt` and `caption`).

---

## Complete Example

```yaml
---
# Required fields
title: "Complete Guide to Docker on Ubuntu 24.04"
description: "Learn how to install, configure, and manage Docker containers on Ubuntu 24.04 with this comprehensive guide covering installation, networking, and best practices."
pubDate: 2025-11-02
tags: ["docker", "ubuntu", "devops", "containers", "linux"]

# Optional fields
draft: false
lastModified: 2025-11-03

# Cover image
cover:
  image: "./docker-ubuntu-hero.jpg"
  alt: "Docker and Ubuntu logos with command line interface"

# Features
showToc: true
avatar: "docker"
---
```

## Validation

### Type Checking

Frontmatter is validated at build time via Zod schema:

```bash
pnpm run astro -- sync  # Regenerate types
npx astro check         # Validate all posts
```

### Common Errors

**Missing required field**:
```
Error: "title" is required
```

**Invalid date format**:
```
Error: Expected date, received string
```

**Invalid tag**:
```
Warning: Tag "xyz" not found in TAG_METADATA
```

## Books collection

Books live at `src/content/books/{slug}.mdx`, where `{slug}` becomes the URL at `/books/{slug}/`. Each entry powers both the `/books/` index grid and a per-book detail page.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | string | yes | Display title used in the page header, OG image, and Book JSON-LD. |
| `description` | string | yes | One-sentence summary used for meta description, cards, and the OG image subtitle. |
| `cover` | string | yes | Path to the cover image, e.g. `"/assets/about/images/12.jpg"` (served from `public/`). |
| `alt` | string | yes | Alt text for the cover. |
| `publisher` | string | yes | E.g. `"Packt Publishing"` or `"The New Stack"`. Appears in the metadata table and the buy button. |
| `buyLink` | URL | no | External purchase link. Omit for out-of-print titles — the page renders "No longer in print." instead of a button. |
| `year` | number | no | Publication year shown in the metadata table. |
| `topic` | string | no | Free-form classification — `"Docker"`, `"Kubernetes"`, etc. Used in the breadcrumb sub-line. |
| `tags` | string[] | no | Lowercase tags. Used to find related blog posts via tag-overlap (normalised through `normalizeTagSlug`). |
| `pubDate` | date | yes | Used for sorting on the index and `datePublished` in the Book schema. |
| `order` | number | yes | Explicit display order on the `/books/` index. Lower first. |
| `draft` | boolean | no | Defaults to `false`. Drafts are excluded from the index and detail routes in production. |

The body of the file is rendered as MDX in the right column of the detail page. Each entry emits `Book` and `BreadcrumbList` JSON-LD, plus a per-book OG image at `/books/{slug}-og.png`.

## Glossary collection

Glossary entries live at `src/content/glossary/{term-slug}.mdx` and use a separate, simpler schema:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `term` | string | yes | Display name of the term (e.g. `"Infrastructure as Code"`). |
| `description` | string | yes | One-sentence definition used for meta description and the entry's intro. |
| `abbreviation` | string | no | Acronym, rendered alongside the term. |
| `category` | string | no | Free-form classification - `"Pattern"`, `"Methodology"`, etc. |
| `relatedTerms` | string[] | no | Slugs of other glossary entries (matched against the file id). Renders a related-terms list at the bottom of the page. |
| `tags` | string[] | no | Tags shared with the blog/tunes taxonomy. |
| `pubDate`, `updatedDate`, `heroImage`, `draft` | various | no | Behave the same as on the blog collection. |

Each entry emits `DefinedTerm` JSON-LD schema. The body of the file is the long-form definition, rendered as MDX.

## Schema Source

See the full schema definition in:
- **File**: `src/content.config.ts`
- **Type**: `blogSchema`

Example:
```typescript
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  tags: z.array(z.string()),
  draft: z.boolean().optional(),
  cover: z.object({
    image: z.string(),
    alt: z.string().optional()
  }).optional(),
  // ... more fields
});
```

## Related Documentation

- **[Creating Posts](../guides/creating-posts.md)** - How to create posts
- **[SEO Implementation](../architecture/seo-implementation.md)** - How frontmatter affects SEO
- **[CLAUDE.md](../../CLAUDE.md)** - Full development guide

---

**Last Updated**: November 2025
