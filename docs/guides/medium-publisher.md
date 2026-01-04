# Medium Publisher

Cross-publish your blog posts to Medium with automatic MDX component transformation and SEO-friendly canonical URLs.

## Setup

### 1. Get Your Medium Integration Token

1. Go to [Medium Settings > Security](https://medium.com/me/settings/security)
2. Scroll to "Integration tokens"
3. Generate a new token

### 2. Add Environment Variable

Add to your `.env` file:

```bash
MEDIUM_TOKEN=your-medium-integration-token
```

Optional variables:
```bash
BLOG_URL=https://www.russ.cloud  # Default blog URL
GITHUB_TOKEN=your-github-token   # For GitHub Gist code blocks
```

## Usage

### Interactive Mode

Run without arguments to see a paginated list of posts:

```bash
pnpm run medium
```

**Controls:**
- `← →` Arrow keys to navigate between pages
- Enter a number to select a post
- `q` to quit

### Direct Mode

Publish a specific post by slug:

```bash
# By slug
pnpm run medium 2025-01-12-my-post-title

# By URL-style path
pnpm run medium 2025/01/12/my-post-title

# By file path
pnpm run medium src/content/blog/2025-01-12-my-post-title.mdx
```

### Dry Run

Preview the transformation without publishing:

```bash
pnpm run medium 2025-01-12-my-post-title --dry-run
```

## What Gets Transformed

The script automatically transforms MDX components to Medium-compatible format:

| Component | Medium Output |
|-----------|---------------|
| `<YouTube id="..." />` | YouTube URL (auto-embeds) |
| `<Instagram permalink="..." />` | Instagram URL (auto-embeds) |
| `<LinkPreview id="..." />` | URL only (Medium auto-embeds) |
| `<Img src="..." />` | Markdown image with absolute URL |
| `<LightGallery ... />` | Individual images extracted |
| `<*Callout>` | Blockquote with emoji prefix |
| `<ChatMessage>` | Styled blockquote |
| `<Mermaid>` | Link to original post (not supported) |
| `<Audio>` | Link to audio file |
| `<AppleMusic>` | Link to Apple Music |
| Markdown tables | GitHub Gists (with `--gists`) or bullet lists |
| Code blocks | Native Medium code blocks |

### Tables as GitHub Gists

Medium doesn't support markdown tables natively. By default, tables are converted to bullet lists. For better rendering with search functionality, use the `--gists` flag:

```bash
pnpm run medium 2025-01-12-my-post --gists
```

This creates a CSV Gist for each table, which Medium auto-embeds with:
- Proper table formatting
- Search functionality
- Interactive scrolling

Requires `GITHUB_TOKEN` environment variable.

### Callout Emojis

| Callout Type | Emoji |
|--------------|-------|
| NoteCallout | 📝 |
| TipCallout | 💡 |
| InfoCallout | ℹ️ |
| ImportantCallout | ❗ |
| CautionCallout | ⚠️ |
| WarningCallout | 🚨 |

## Post Structure on Medium

The published post includes:

1. **H1 Title** - Your post title as the header
2. **Transformed Content** - All MDX components converted
3. **Footer** - Original publish date and canonical link

**Note:** Cover images need to be added manually in Medium's editor after publishing.

Example footer:
```
---
*Originally published on January 12, 2025 at [www.russ.cloud](https://www.russ.cloud/2025/01/12/my-post/)*
```

## After Publishing

The script publishes as a **draft** (not public) and shows next steps.

**Next steps in Medium:**
1. Review formatting in the Medium editor
2. Add cover image manually (copy from original post)
3. Copy any other images that didn't load
4. Set featured image with `Shift+F` on desired image
5. Set focal point with `Alt/Opt + click` on image
6. Publish when ready

## Limitations

Due to Medium API constraints:
- **No custom publish date** - Medium uses current date; original date shown in footer
- **No programmatic featured image** - First image becomes default thumbnail
- **No post updates** - API only supports creating new posts
- **Max 5 tags** - Tags are automatically limited

## Troubleshooting

### "MEDIUM_TOKEN environment variable is required"

Add your token to `.env`:
```bash
MEDIUM_TOKEN=your-token-here
```

### Images not displaying on Medium

Medium auto-loads images from URLs. If images don't appear:
1. Check image URLs are publicly accessible
2. Copy images manually from the original post (opens in browser)
3. Paste directly into Medium editor

### API Error 401

Your token may be invalid or expired. Generate a new one at:
https://medium.com/me/settings/security

## Files

- `scripts/publish-to-medium.js` - Main CLI script
- `scripts/lib/medium-client.js` - Medium API wrapper
- `scripts/lib/mdx-to-medium.js` - MDX transformation logic
- `scripts/lib/github-gist-client.js` - GitHub Gist API (for `--gists` flag)
