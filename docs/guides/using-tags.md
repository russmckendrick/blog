# Using Tags

Complete guide to the tag system in Russ.Cloud blog.

## Overview

The blog uses a comprehensive tag system with 30+ predefined tags. Each tag has:

- **Custom emoji** 🎨
- **Color scheme** (light/dark mode)
- **Description** for tag pages
- **Avatar mapping** for post cards

Tags are defined in `src/consts.ts` and used throughout the site for categorization, navigation, and visual styling.

## Available Tags

### Technology & Cloud

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `ai` | AI 🤖 | All my posts about AI | Purple |
| `aws` | AWS ☁️ | All my posts about Amazon Web Services | Orange |
| `azure` | Azure ☁️ | All my posts about Microsoft Azure | Blue |
| `cloud` | Cloud ⛅️ | All my posts about various Cloud technologies | Sky Blue |

### DevOps & Automation

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `ansible` | Ansible 👨‍💻 | All my posts about Ansible | Red |
| `automation` | Automation 🤖 | All my posts about Automation | Indigo |
| `devops` | DevOps 🦾 | All my posts about DevOps | Teal |
| `github` | GitHub 👨‍💻 | All my posts about GitHub related services | Slate |
| `infrastructure-as-code` | Infrastructure as Code 🤖 | All my posts about Infrastructure as Code | Purple |
| `packer` | Packer 📦 | All my posts about Packer | Amber |
| `terraform` | Terraform 👨‍💻 | All my posts about Terraform | Violet |

### Containers & Orchestration

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `containers` | Containers 🐳 | All my posts about Containers | Cyan |
| `docker` | Docker 🐳 | All my posts about Docker | Blue |
| `kubernetes` | Kubernetes 🐳 | All my posts about Kubernetes | Blue |
| `podman` | Podman 🦭 | All my posts about Podman | Purple |

### Programming & Development

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `code` | Code 🐛 | All my posts about various bits of code and projects | Green |
| `python` | Python 🐍 | All my posts about Python | Yellow |
| `web` | Web 🌍 | All my posts about this and other web sites | Emerald |

### Operating Systems

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `linux` | Linux 🐧 | All my posts about various Linux technologies | Yellow |
| `macos` | macOS 🍏 | All my posts about various macOS technologies | Gray |

### Content & Media

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `author` | Author 📚 | All the posts about the books I have written | Amber |
| `book` | Book 📚 | All the posts about the books I have written and am reading | Emerald |
| `listened` | Listened 🎧 | What did I listen to in a week? | Fuchsia |
| `vinyl` | Vinyl 🎧 | All my posts about Vinyl records I am listening to | Rose |

### Other Topics

| Tag | Display | Description | Color |
|-----|---------|-------------|-------|
| `blog` | Blog 🤷‍♂️ | Some general Posts | Gray |
| `conference` | Conference 📢 | All my posts about attending conferences | Violet |
| `life` | Life 👨‍🏫 | Some general Posts | Pink |
| `security` | Security 🔐 | All my posts about security | Red |
| `tools` | Tools 🧰 | All my posts about various tools | Orange |

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

Tags have custom colors that appear:

**Post Cards:**
```
Tag badges with color-coded backgrounds
```

**Tag Cloud** (`/tags/`):
```
Animated tag cloud with custom colors
Post counts for each tag
```

**Post Headers:**
```
Colored tag badges below post title
```

## Tag Colors Reference

Tags use Tailwind color schemes with light/dark mode support:

| Color Family | Tags | Example |
|--------------|------|---------|
| **Purple** | ai, infrastructure-as-code, podman | Purple badge |
| **Blue** | azure, docker, kubernetes | Blue badge |
| **Sky** | cloud | Sky blue badge |
| **Orange** | aws, tools | Orange badge |
| **Teal** | devops | Teal badge |
| **Green** | code | Green badge |
| **Yellow** | linux, python | Yellow badge |
| **Red** | ansible, security | Red badge |
| **Pink** | life | Pink badge |
| **Fuchsia** | listened | Fuchsia badge |
| **Rose** | vinyl | Rose badge |
| **Emerald** | book, web | Emerald badge |
| **Gray** | blog, macos | Gray badge |

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

### 2. Add to TAG_AVATAR_MAP (optional)

```typescript
export const TAG_AVATAR_MAP: Record<string, string> = {
  // ... existing mappings ...

  "your-new-tag": "your-avatar.svg"
};
```

### 3. Regenerate Types

```bash
npm run astro -- sync
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

### Tag Not Showing Color

**Problem**: Tag appears with default styling

**Solution**: Tag must be defined in `TAG_METADATA` in `src/consts.ts`

```yaml
# If tag is not in TAG_METADATA, it won't have custom colors
tags: ["undefined-tag"]  # Will use default gray
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
npm run build
```

## Related Documentation

- **[Creating Posts](./creating-posts.md)** - How to write posts with tags
- **[Frontmatter Fields](../reference/frontmatter-fields.md)** - Complete frontmatter reference
- **[CLAUDE.md](../../CLAUDE.md)** - Avatar system details

## Tag Definition Source

**File**: `src/consts.ts`

- `TAG_METADATA` - Tag names, emojis, descriptions, colors
- `TAG_AVATAR_MAP` - Tag-to-avatar mappings

---

**Last Updated**: November 2025
**Total Tags**: 30
