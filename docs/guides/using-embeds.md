# Using Embed Components

Quick guide to using embed components in your MDX blog posts.

## Overview

Embed components are available globally in all MDX files without imports. Simply use them directly in your content.

**Complete Reference**: See [Embed Components Reference](../reference/embed-components.md) for full API documentation.

## Quick Examples

### Media Components

```mdx
<!-- YouTube video -->
<YouTube id="dQw4w9WgXcQ" />

<!-- Audio player -->
<Audio mp3="/audio/podcast.mp3" />

<!-- Apple Music -->
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" />

<!-- Instagram post -->
<Instagram permalink="https://www.instagram.com/p/ABC123/" />

<!-- Reddit post -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/" />

<!-- Giphy GIF -->
<Giphy id="3o7btPCcdNniyf0ArS" />
```

### Image Components

```mdx
<!-- Single image with zoom -->
<Img src="/assets/2025-11-02-post/screenshot.jpg" alt="Screenshot" />

<!-- Image without zoom -->
<Img src="/assets/image.jpg" alt="Image" zoom={false} />

<!-- Image gallery -->
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/photo1.jpg", alt: "Photo 1" },
      { src: "/assets/photo2.jpg", alt: "Photo 2" },
      { src: "/assets/photo3.jpg", alt: "Photo 3" }
    ]
  }}
/>
```

### Content Components

```mdx
<!-- Link preview with automatic metadata -->
<LinkPreview id="https://www.anthropic.com/news/claude-4" />

<!-- Chat message (left-aligned) -->
<ChatMessage avatar="https://example.com/avatar.png" name="User" time="2:30 PM">
This is my message.
</ChatMessage>

<!-- Chat message (right-aligned) -->
<ChatMessage position="right" name="Assistant">
This is the response.
</ChatMessage>
```

### Callout Components

```mdx
<NoteCallout title="Note">
This is important information to remember.
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

<CautionCallout title="Caution">
Proceed with care.
</CautionCallout>

<InfoCallout title="Info">
Additional context or information.
</InfoCallout>
```

## Common Patterns

### Multiple Images with Captions

```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/before.jpg", alt: "Before optimization" },
      { src: "/assets/after.jpg", alt: "After optimization" }
    ]
  }}
  options={{
    thumbnail: true,
    download: false
  }}
/>
```

### Chat Conversation

```mdx
<ChatMessage position="left" avatar="/images/avatars/coffee.svg" name="User">
How do I deploy to production?
</ChatMessage>

<ChatMessage position="right" name="Claude">
Here's a step-by-step guide:

1. Run `npm run build`
2. Commit and push to main
3. GitHub Actions will deploy automatically
</ChatMessage>
```

### Tutorial with Callouts

```mdx
## Installation

<NoteCallout title="Prerequisites">
Ensure you have Node.js 20.x or later installed.
</NoteCallout>

Run the following command:

\`\`\`bash
npm install
\`\`\`

<TipCallout title="Pro Tip">
Use `npm ci` for faster, deterministic installs in CI/CD.
</TipCallout>

<WarningCallout title="Warning">
Don't use `sudo npm install` - it can cause permission issues.
</WarningCallout>
```

## Available Components

### Media Embeds

| Component | Description |
|-----------|-------------|
| `<YouTube>` | Embed YouTube videos |
| `<Instagram>` | Embed Instagram posts |
| `<Giphy>` | Embed Giphy GIFs |
| `<Reddit>` | Embed Reddit posts |
| `<Audio>` | HTML5 audio player |
| `<AppleMusic>` | Apple Music embed |

### Image Embeds

| Component | Description |
|-----------|-------------|
| `<Img>` | Single image with optional zoom |
| `<LightGallery>` | Image gallery with lightbox |

### Content Embeds

| Component | Description |
|-----------|-------------|
| `<LinkPreview>` | Rich link preview with metadata |
| `<ChatMessage>` | Chat-style message bubble |

### Callouts

| Component | Description | Color |
|-----------|-------------|-------|
| `<NoteCallout>` | General notes | Blue |
| `<TipCallout>` | Helpful tips | Green |
| `<InfoCallout>` | Information | Blue |
| `<ImportantCallout>` | Important information | Purple |
| `<WarningCallout>` | Warnings | Yellow/Orange |
| `<CautionCallout>` | Cautions | Red |
| `<GeneralCallout>` | Custom callouts | Gray |

## Props Reference

### YouTube

```typescript
{
  id: string;          // Video ID (required)
  params?: string;     // URL parameters (e.g., "start=30&end=120")
}
```

### Img

```typescript
{
  src: string;         // Image path (required)
  alt?: string;        // Alt text
  width?: string;      // Custom width
  link?: string;       // Wrap in link
  zoom?: boolean;      // Enable zoom (default: true)
  sizes?: string;      // Responsive sizes
}
```

### LightGallery

```typescript
{
  layout: {
    imgs: Array<{
      src: string;     // Image path (required)
      alt?: string;    // Alt text
    }>;
  };
  options?: {
    thumbnail?: boolean;  // Show thumbnails
    download?: boolean;   // Enable download
  };
  enableMetaPlugin?: boolean;  // Load .meta files (default: true)
  debugMeta?: boolean;         // Debug mode (default: false)
}
```

### ChatMessage

```typescript
{
  position?: "left" | "right";  // Message side (default: "left")
  avatar?: string;              // Avatar URL
  name?: string;                // Display name
  time?: string;                // Timestamp
  color?: string;               // Custom Tailwind color classes
  children: ReactNode;          // Message content (supports markdown)
}
```

### LinkPreview

```typescript
{
  id: string;          // URL to preview (required)
  hideMedia?: boolean; // Hide image/video (default: false)
}
```

## Tips & Best Practices

### 1. Always Provide Alt Text

```mdx
<!-- Good -->
<Img src="/assets/screenshot.jpg" alt="Application dashboard showing user metrics" />

<!-- Bad -->
<Img src="/assets/screenshot.jpg" />
```

### 2. Use Appropriate Callouts

- **Note**: General information
- **Tip**: Helpful suggestions
- **Info**: Additional context
- **Important**: Critical information
- **Warning**: Things that might go wrong
- **Caution**: Dangerous operations

### 3. Optimize Gallery Images

Keep gallery image count reasonable (3-10 images):

```mdx
<!-- Good: Focused gallery -->
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/step1.jpg", alt: "Step 1" },
      { src: "/assets/step2.jpg", alt: "Step 2" },
      { src: "/assets/step3.jpg", alt: "Step 3" }
    ]
  }}
/>

<!-- Avoid: Too many images -->
<LightGallery layout={{ imgs: [...25 images...] }} />
```

### 4. Use Chat Messages for Conversational Content

```mdx
<ChatMessage position="left" name="Developer">
How do I debug this error?
</ChatMessage>

<ChatMessage position="right" name="Expert">
Start by checking the console logs:

\`\`\`bash
npm run dev
\`\`\`
</ChatMessage>
```

## Migration from Hugo

If migrating from Hugo, here's the conversion:

| Hugo Shortcode | Astro Component |
|----------------|-----------------|
| `{{< youtube ID >}}` | `<YouTube id="ID" />` |
| `{{< audio mp3="file.mp3" >}}` | `<Audio mp3="file.mp3" />` |
| `{{< applemusic url="..." >}}` | `<AppleMusic url="..." />` |
| `{{< giphy "ID" >}}` | `<Giphy id="ID" />` |
| `{{< img src="..." >}}` | `<Img src="..." />` |

## Next Steps

- **[Embed Components Reference](../reference/embed-components.md)** - Complete API documentation
- **[Creating Posts](./creating-posts.md)** - Full post creation guide
- **[LightGallery Meta Plugin](../reference/lightgallery-meta.md)** - Image caption system

---

**Last Updated**: November 2025
