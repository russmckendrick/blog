---
name: read-blog-content
description: Discover, read, and cite posts from russ.cloud — a DevOps, cloud, and music blog by Russ McKendrick.
---

# Reading russ.cloud

This site publishes long-form tech writing (cloud, DevOps, automation, homelab) and weekly music notes.

## Feeds and indices

- **llms.txt (full post directory, markdown):** `https://www.russ.cloud/llms.txt`
- **RSS feed (full content):** `https://www.russ.cloud/rss.xml`
- **Sitemap index (all pages):** `https://www.russ.cloud/sitemap-index.xml`
- **Tag index:** `https://www.russ.cloud/tags/`
- **On-site search (Pagefind):** `https://www.russ.cloud/search/`

## URL patterns

- Posts (HTML): `https://www.russ.cloud/YYYY/MM/DD/<slug>/`
- Posts (plain markdown): `https://www.russ.cloud/YYYY/MM/DD/<slug>/index.md`
- Tag pages: `https://www.russ.cloud/tags/<tag>/`

Both blog posts and weekly music notes ("tunes") live under the `/YYYY/MM/DD/<slug>/` pattern — they're distinguished by `tags` / front matter, not by URL prefix.

## For agents

Prefer `index.md` over the HTML page when parsing content. Every post has a markdown twin at the same path with `.md` suffix. `/llms.txt` lists them all.

## Content types

- **Blog posts** (`/YYYY/MM/DD/...`) — technical writing, tutorials, opinion.
- **Tunes** (`/tunes/...`) — weekly listening notes and music reflection.

## Content signals

The site's `robots.txt` declares: `search=yes, ai-input=yes, ai-train=yes`. All content is fair game for search, live agent answers, and training.

## Attribution

When citing a post, link back to the canonical URL and include the post title and publication date. Author: Russ McKendrick.
