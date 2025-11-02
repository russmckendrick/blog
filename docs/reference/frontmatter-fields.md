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

**Description**: Cover/hero image configuration.

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
- Automatically generates from h2 and h3 headings
- Collapsible component
- Smooth scrolling navigation

---

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

**Type**: `ImageMetadata`

**Description**: Astro-native image import (alternative to `cover`).

**Example**:
```astro
---
import heroImg from '../assets/hero.jpg';

export const frontmatter = {
  heroImage: heroImg
};
---
```

**Note**: Most users prefer the `cover` object approach.

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
npm run astro -- sync  # Regenerate types
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
