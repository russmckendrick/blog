# Using Tags

Complete guide to the tag system in Russ.Cloud blog.

## Overview

The blog uses a comprehensive tag system with 30+ predefined tags. Each tag has:

- **Custom emoji** 🎨
- **Description** for tag pages
- **Avatar mapping** for post cards

All tags share a single editorial visual treatment (small mono caps with a hairline underline) - there are no per-tag colors.

Tags are defined in `src/consts.ts` and used throughout the site for categorization, navigation, and visual styling.

## Available Tags

### Technology & Cloud

| Tag | Display | Description |
|-----|---------|-------------|
| `ai` | AI 🤖 | All my posts about AI |
| `aws` | AWS ☁️ | All my posts about Amazon Web Services |
| `azure` | Azure ☁️ | All my posts about Microsoft Azure |
| `cloud` | Cloud ⛅️ | All my posts about various Cloud technologies |

### DevOps & Automation

| Tag | Display | Description |
|-----|---------|-------------|
| `ansible` | Ansible 👨‍💻 | All my posts about Ansible |
| `automation` | Automation 🤖 | All my posts about Automation |
| `devops` | DevOps 🦾 | All my posts about DevOps |
| `github` | GitHub 👨‍💻 | All my posts about GitHub related services |
| `infrastructure-as-code` | Infrastructure as Code 🤖 | All my posts about Infrastructure as Code |
| `packer` | Packer 📦 | All my posts about Packer |
| `terraform` | Terraform 👨‍💻 | All my posts about Terraform |

### Containers & Orchestration

| Tag | Display | Description |
|-----|---------|-------------|
| `containers` | Containers 🐳 | All my posts about Containers |
| `docker` | Docker 🐳 | All my posts about Docker |
| `kubernetes` | Kubernetes 🐳 | All my posts about Kubernetes |
| `podman` | Podman 🦭 | All my posts about Podman |

### Programming & Development

| Tag | Display | Description |
|-----|---------|-------------|
| `code` | Code 🐛 | All my posts about various bits of code and projects |
| `python` | Python 🐍 | All my posts about Python |
| `web` | Web 🌍 | All my posts about this and other web sites |

### Operating Systems

| Tag | Display | Description |
|-----|---------|-------------|
| `linux` | Linux 🐧 | All my posts about various Linux technologies |
| `macos` | macOS 🍏 | All my posts about various macOS technologies |

### Content & Media

| Tag | Display | Description |
|-----|---------|-------------|
| `author` | Author 📚 | All the posts about the books I have written |
| `book` | Book 📚 | All the posts about the books I have written and am reading |
| `listened` | Listened 🎧 | What did I listen to in a week? |
| `vinyl` | Vinyl 🎧 | All my posts about Vinyl records I am listening to |

### Other Topics

| Tag | Display | Description |
|-----|---------|-------------|
| `blog` | Blog 🤷‍♂️ | Some general Posts |
| `conference` | Conference 📢 | All my posts about attending conferences |
| `life` | Life 👨‍🏫 | Some general Posts |
| `security` | Security 🔐 | All my posts about security |
| `tools` | Tools 🧰 | All my posts about various tools |

## Using Tags in Posts

### Basic Usage

Tags are specified in the frontmatter as an array of strings:

```yaml
---
title: "My Docker Tutorial"
description: "Learn Docker basics"
pubDate: 2025-11-02
tags: ["docker", "containers", "devops"]
---
```

### Best Practices

**1. Use 2-5 tags per post**

```yaml
# Good: Focused and relevant
tags: ["docker", "kubernetes", "devops"]

# Avoid: Too many tags
tags: ["docker", "containers", "kubernetes", "devops", "cloud", "aws", "linux", "automation", "tools"]

# Avoid: Too few (unless truly general)
tags: ["blog"]
```

**2. Order tags by relevance**

The first tag is special - it determines the default avatar:

```yaml
# Docker avatar will be used
tags: ["docker", "linux", "devops"]

# Linux avatar will be used
tags: ["linux", "docker", "devops"]
```

**3. Use existing tags when possible**

```yaml
# Good: Use predefined tags
tags: ["docker", "kubernetes"]

# Avoid: Creating new tags unnecessarily
tags: ["container-tech", "k8s-stuff"]
```

**4. Be consistent**

```yaml
# Good: Consistent tag usage
tags: ["docker"]  # Use the defined tag

# Avoid: Variations
tags: ["Docker"]  # Wrong case
tags: ["docker-containers"]  # Wrong format
```

## How Tags Affect Your Posts

### 1. Avatar Selection

The **first tag** in your tags array automatically determines the post avatar (unless you specify a custom avatar):

```yaml
---
tags: ["docker", "linux"]  # Uses Docker avatar (🐳)
---
```

**Tag-to-Avatar Mappings:**

| Tag | Avatar |
|-----|--------|
| `docker`, `containers`, `kubernetes`, `podman` | docker.svg 🐳 |
| `ai` | nerd.svg 🤓 |
| `ansible` | ansible.svg |
| `aws`, `cloud` | cloud.svg ☁️ |
| `azure` | azure.svg |
| `python` | python.svg 🐍 |
| `linux`, `code`, `terraform` | terminal.svg 💻 |
| `devops`, `automation` | devops.svg 🦾 |
| `security` | hacker.svg 👾 |
| `listened`, `vinyl` | headphones.svg / record-01.svg 🎧 |
| `macos` | laptop-02.svg 🍏 |
| `author`, `book` | book.svg 📚 |

**Override avatar manually:**

```yaml
---
tags: ["docker", "linux"]
avatar: "terminal"  # Use terminal avatar instead of docker
---
```

### 2. Related Posts

Tags power the related posts algorithm:

- Posts with shared tags appear in "Related Posts" section
- More shared tags = higher similarity score
- Helps readers discover similar content

**Example:**

```yaml
# Post A
tags: ["docker", "kubernetes", "devops"]

# Post B
tags: ["kubernetes", "cloud", "aws"]
# Shared tag: kubernetes → Post B appears as related to Post A
```

### 3. Tag Pages

Each tag has its own archive page at `/tags/[tag]/`:

- `/tags/docker/` - All Docker posts
- `/tags/kubernetes/` - All Kubernetes posts
- `/tags/python/` - All Python posts

Tag pages show:
- Tag emoji and display name
- Tag description
- All posts with that tag (paginated)

### 4. Visual Styling

Every tag renders with the same editorial treatment wherever it appears (index entries, the tag index, post headers): small monospace capitals with a hairline underline that shifts to the accent color on hover. `getTagColorClasses()` in `src/utils/tags.ts` returns the single `tag-editorial` class for all tags.

## Tag Styling Reference

The per-tag pastel color palette is retired. The `colorLight` / `colorDark` fields still exist on `TAG_METADATA` in `src/consts.ts` but are no longer rendered - all tags share the `.tag-editorial` style defined in `src/styles/global.css`.

## Adding New Tags (Advanced)

If you need to add a new tag, edit `src/consts.ts`:

### 1. Add to TAG_METADATA

```typescript
export const TAG_METADATA: Record<string, TagMetadata> = {
  // ... existing tags ...

  "your-new-tag": {
    title: "Your Tag Name 🏷️",
    description: "Description for tag page",
    colorLight: "bg-indigo-50 text-indigo-700 inset-ring inset-ring-indigo-700/10",
    colorDark: "dark:bg-indigo-400/10 dark:text-indigo-400 dark:inset-ring-indigo-400/30"
  }
};
```

The `colorLight` / `colorDark` fields are still required by the `TagMetadata` interface but are no longer rendered - every tag gets the same editorial styling.

### 2. Add to TAG_AVATAR_MAP (optional)

```typescript
export const TAG_AVATAR_MAP: Record<string, string> = {
  // ... existing mappings ...

  "your-new-tag": "your-avatar.svg"
};
```

### 3. Regenerate Types

```bash
pnpm run astro -- sync
```

### 4. Use in Posts

```yaml
tags: ["your-new-tag", "other-tag"]
```

## Tag Statistics

Current tag usage across the blog:

```bash
# View all tags and post counts
Visit: /tags/

# View specific tag archive
Visit: /tags/docker/
```

## Common Patterns

### Docker & Kubernetes Posts

```yaml
tags: ["docker", "kubernetes", "devops"]
```

### Cloud Platform Posts

```yaml
# AWS
tags: ["aws", "cloud", "devops"]

# Azure
tags: ["azure", "cloud", "devops"]

# Multi-cloud
tags: ["cloud", "aws", "azure"]
```

### Automation Posts

```yaml
tags: ["automation", "ansible", "terraform", "infrastructure-as-code"]
```

### Development Posts

```yaml
# Python
tags: ["python", "code", "automation"]

# Web development
tags: ["web", "code", "tools"]
```

### Music Posts

```yaml
# Weekly listening (tunes posts)
tags: ["listened"]

# Vinyl posts
tags: ["vinyl", "listened"]
```

### Book Posts

```yaml
# Books you've written
tags: ["author", "book", "docker"]

# Books you're reading
tags: ["book", "devops"]
```

## Tag Archive URLs

All tag archives follow the pattern:

```
/tags/[tag-name]/
/tags/[tag-name]/2/  (page 2)
/tags/[tag-name]/3/  (page 3)
```

**Examples:**
- https://www.russ.cloud/tags/docker/
- https://www.russ.cloud/tags/kubernetes/
- https://www.russ.cloud/tags/python/
- https://www.russ.cloud/tags/listened/

## Troubleshooting

### Tag Missing Emoji or Description

**Problem**: Tag appears without its emoji title or has no description on its tag page

**Solution**: Tag must be defined in `TAG_METADATA` in `src/consts.ts`

```yaml
# If tag is not in TAG_METADATA, it falls back to the raw slug
tags: ["undefined-tag"]  # No emoji title or tag-page description
```

### Wrong Avatar Displaying

**Problem**: Post shows unexpected avatar

**Solution**: Check first tag in array or specify avatar manually

```yaml
# First tag determines avatar
tags: ["linux", "docker"]  # Uses Linux terminal avatar

# Or override
tags: ["linux", "docker"]
avatar: "docker"  # Force Docker avatar
```

### Tag Page 404

**Problem**: `/tags/my-tag/` returns 404

**Solution**: Tag page is generated at build time. Rebuild the site:

```bash
pnpm run build
```

## Related Documentation

- **[Creating Posts](./creating-posts.md)** - How to write posts with tags
- **[Frontmatter Fields](../reference/frontmatter-fields.md)** - Complete frontmatter reference
- **[CLAUDE.md](../../CLAUDE.md)** - Avatar system details

## Tag Definition Source

**File**: `src/consts.ts`

- `TAG_METADATA` - Tag names, emojis, descriptions (plus retired `colorLight`/`colorDark` fields)
- `TAG_AVATAR_MAP` - Tag-to-avatar mappings

---

**Last Updated**: November 2025
**Total Tags**: 30
