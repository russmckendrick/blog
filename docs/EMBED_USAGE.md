# Embed Components Usage Guide

All embed components are available globally in MDX files without requiring imports. Simply use them directly in your blog posts.

## Available Components

### YouTube
Embed YouTube videos responsively with proper accessibility.

```mdx
<!-- Basic YouTube embed -->
<YouTube id="oqUclC3gqKs" />

<!-- YouTube embed with custom parameters -->
<YouTube id="oqUclC3gqKs" params="start=30&end=120" />
```

**Features:**
- ✅ Responsive design
- ✅ Privacy-focused (no cookies until clicked)
- ✅ Accessible with proper ARIA labels
- ✅ Custom start/end times support
- ✅ Playlist support
- ✅ Lazy-loaded by default

### Instagram
Embed Instagram posts and reels with full interactivity.

```mdx
<!-- Instagram post -->
<Instagram permalink="https://www.instagram.com/p/ABC123/" />

<!-- Instagram reel -->
<Instagram permalink="https://www.instagram.com/reel/XYZ789/" />

<!-- Without caption -->
<Instagram permalink="https://www.instagram.com/p/ABC123/" captioned={false} />
```

**Features:**
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Optional captions
- ✅ Full Instagram embed functionality

### Audio
Embed audio files with native HTML5 audio controls.

```mdx
<!-- Single MP3 file -->
<Audio mp3="/audio/podcast.mp3" />

<!-- Multiple formats for browser compatibility -->
<Audio
  mp3="/audio/song.mp3"
  ogg="/audio/song.ogg"
  wav="/audio/song.wav"
/>

<!-- Just OGG -->
<Audio ogg="/audio/sound.ogg" />
```

**Features:**
- ✅ Supports MP3, OGG, and WAV formats
- ✅ Responsive width
- ✅ Dark mode support
- ✅ Accessible controls

### AppleMusic
Embed Apple Music albums, playlists, or songs directly in your content.

```mdx
<!-- Basic Apple Music embed -->
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" />

<!-- Custom height -->
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" height="600px" />
```

**Features:**
- ✅ Direct inline player
- ✅ Automatic dark/light theme switching
- ✅ Responsive design
- ✅ Rounded borders with dark mode support

### Giphy
Embed Giphy GIFs with responsive aspect ratios.

```mdx
<!-- Basic Giphy embed -->
<Giphy id="3o7btPCcdNniyf0ArS" />

<!-- Custom aspect ratio -->
<Giphy id="3o7btPCcdNniyf0ArS" paddingBottom="56.25%" />
```

**Features:**
- ✅ Responsive design with aspect ratio
- ✅ Rounded borders
- ✅ Encrypted media support
- ✅ Custom aspect ratios

### LinkPreview
Generate rich link previews automatically.

```mdx
<!-- Basic link preview -->
<LinkPreview id="https://www.anthropic.com/news/claude-4" />
```

**Features:**
- ✅ Automatic metadata extraction
- ✅ Fallback for missing images
- ✅ Responsive design
- ✅ Open Graph and Twitter Card support
- ✅ Metadata caching for performance

### Reddit
Embed Reddit posts, comments, or threads.

```mdx
<!-- Basic Reddit embed (auto-detects theme) -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" />

<!-- Custom height -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" height="600px" />

<!-- Force dark theme -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" theme="dark" />

<!-- Force light theme -->
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" theme="light" />
```

**Features:**
- ✅ Responsive design
- ✅ Automatic dark/light theme switching
- ✅ Custom height
- ✅ Uses official Reddit embed widget
- ✅ Scrollable content

### Img
Embed responsive images with medium-zoom functionality for click-to-enlarge.

```mdx
<!-- Basic image -->
<Img src="/assets/image.png" alt="Description of image" />

<!-- External image -->
<Img src="https://example.com/image.jpg" alt="External image" />

<!-- Image with link wrapper -->
<Img src="/assets/image.png" alt="Clickable image" link="https://example.com" />

<!-- Image without zoom -->
<Img src="/assets/image.png" alt="No zoom" zoom={false} />

<!-- Custom width and sizes -->
<Img
  src="/assets/image.png"
  alt="Custom sized image"
  width="800"
  sizes="(min-width: 768px) 800px, 100vw"
/>
```

**Features:**
- ✅ Responsive design with automatic srcset generation
- ✅ Medium-zoom click-to-enlarge functionality
- ✅ Support for external URLs and local images
- ✅ Optional link wrapper
- ✅ Dark mode support with themed zoom overlay
- ✅ Lazy loading by default
- ✅ Customizable sizes and width
- ✅ Smooth hover animation

### LightGallery
Create beautiful image galleries with lightbox functionality, thumbnails, and zoom capabilities.

```mdx
<!-- Basic gallery -->
<LightGallery
  layout={{
    imgs: [
      { src: "/images/photo1.jpg", alt: "Photo 1" },
      { src: "/images/photo2.jpg", alt: "Photo 2" },
      { src: "/images/photo3.jpg", alt: "Photo 3" }
    ]
  }}
/>

<!-- Gallery with options -->
<LightGallery
  layout={{
    imgs: [
      { src: "/images/photo1.jpg", alt: "Photo 1" },
      { src: "/images/photo2.jpg", alt: "Photo 2" }
    ]
  }}
  options={{
    thumbnail: true,
    download: true
  }}
/>

<!-- Gallery without thumbnails -->
<LightGallery
  layout={{
    imgs: [
      { src: "/images/photo1.jpg" },
      { src: "/images/photo2.jpg" }
    ]
  }}
  options={{
    thumbnail: false,
    download: false
  }}
/>
```

**Props:**
- `layout` - Object containing `imgs` array with `src` and optional `alt` properties (required)
- `options` - Optional configuration object:
  - `thumbnail` - Show thumbnail navigation (boolean)
  - `download` - Enable download button (boolean)

**Features:**
- ✅ Beautiful lightbox image viewer
- ✅ Thumbnail navigation
- ✅ Zoom and pan functionality
- ✅ Keyboard navigation support
- ✅ Optional download button
- ✅ Responsive grid layout
- ✅ Dark mode support
- ✅ Swup-compatible (won't trigger page transitions)
- ✅ Full-screen viewing mode

### ChatMessage
Display chat-style messages with optional avatars, names, timestamps, and custom colors - perfect for showing conversations, prompts, or chat interfaces.

```mdx
<!-- Left-aligned message (default gray) -->
<ChatMessage avatar="https://example.com/avatar.png" name="User" time="2:30 PM">
This is a message from the left side, typically used for user input or questions.
</ChatMessage>

<!-- Right-aligned message (default light blue) -->
<ChatMessage position="right" avatar="https://example.com/assistant.png" name="Assistant" time="2:31 PM">
This is a message from the right side, typically used for responses or AI output.
</ChatMessage>

<!-- Message without avatar -->
<ChatMessage position="left" name="Anonymous">
You can also have messages without avatars.
</ChatMessage>

<!-- Message with custom color -->
<ChatMessage
  position="left"
  avatar="https://example.com/avatar.png"
  color="bg-green-100 dark:bg-green-900"
>
Custom colored message bubble!
</ChatMessage>

<!-- Message with markdown content -->
<ChatMessage position="right" name="Claude">
Supports **bold**, *italic*, `code`, and [links](https://example.com)!

- List items
- Also work
</ChatMessage>

<!-- Minimal message -->
<ChatMessage>
Just a simple message with no extras.
</ChatMessage>
```

**Props:**
- `position` - "left" (default) or "right" - Side of the message
- `avatar` - URL to avatar image (optional)
- `name` - Display name above message (optional)
- `time` - Timestamp below message (optional)
- `color` - Custom Tailwind color classes (optional, defaults: left=gray, right=blue)

**Features:**
- ✅ Left or right alignment with triangular tails
- ✅ Optional avatar images (circular, positioned at top)
- ✅ Optional name labels and timestamps
- ✅ Customizable bubble colors with sensible defaults
- ✅ Markdown content support (bold, italic, code, links, lists)
- ✅ Dark mode support with automatic color switching
- ✅ Modern chat bubble styling with 3 rounded corners
- ✅ Responsive design with small, readable text
- ✅ Proper chat tail pointing toward avatar

## Callout Components

All callout components support custom titles and markdown content.

```mdx
<!-- Note callout -->
<NoteCallout title="Note">
This is important information to remember.
</NoteCallout>

<!-- Tip callout -->
<TipCallout title="Pro Tip">
Here's a helpful suggestion!
</TipCallout>

<!-- Warning callout -->
<WarningCallout title="Warning">
Be careful with this approach.
</WarningCallout>

<!-- Important callout -->
<ImportantCallout title="Important">
Critical information goes here.
</ImportantCallout>

<!-- Caution callout -->
<CautionCallout title="Caution">
Proceed with care.
</CautionCallout>

<!-- Info callout -->
<InfoCallout title="Info">
Additional context or information.
</InfoCallout>

<!-- General callout (customizable) -->
<GeneralCallout title="Custom Title">
Use this for any other type of callout.
</GeneralCallout>

<!-- Callout (alias for GeneralCallout) -->
<Callout title="Notice">
Another general-purpose callout option.
</Callout>
```

## Migration from Hugo Shortcodes

### YouTube Videos
**Before (Hugo):**
```markdown
{{< youtube oqUclC3gqKs >}}
```

**After (Astro):**
```mdx
<YouTube id="oqUclC3gqKs" />
```

### Audio
**Before (Hugo):**
```markdown
{{< audio mp3="/audio/file.mp3" ogg="/audio/file.ogg" >}}
```

**After (Astro):**
```mdx
<Audio mp3="/audio/file.mp3" ogg="/audio/file.ogg" />
```

### Apple Music
**Before (Hugo):**
```markdown
{{< applemusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" >}}
```

**After (Astro):**
```mdx
<AppleMusic url="https://music.apple.com/gb/album/signals-remastered/1440765198" />
```

### Giphy
**Before (Hugo):**
```markdown
{{< giphy "3o7btPCcdNniyf0ArS" >}}
```

**After (Astro):**
```mdx
<Giphy id="3o7btPCcdNniyf0ArS" />
```

### Chat Messages
**Before (Hugo):**
```markdown
{{< chat-message position="left" avatar="https://example.com/avatar.svg" >}}
This is my message content.
{{< /chat-message >}}
```

**After (Astro):**
```mdx
<!-- Basic migration -->
<ChatMessage position="left" avatar="https://example.com/avatar.svg">
This is my message content.
</ChatMessage>

<!-- With new features (name, time, custom color) -->
<ChatMessage
  position="left"
  avatar="https://example.com/avatar.svg"
  name="User"
  time="2:30 PM"
  color="bg-purple-100 dark:bg-purple-900"
>
This is my message content.
</ChatMessage>
```

### Reddit
**Before (Hugo):**
```markdown
{{< reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" >}}
```

**After (Astro):**
```mdx
<Reddit url="https://www.reddit.com/r/Anthropic/comments/1ntnwb8/sonnet_45_is_available_now/" />
```

### Images
**Before (Hugo):**
```markdown
{{img src="/assets/image.png" alt="Description" }}
```

**After (Astro):**
```mdx
<Img src="/assets/image.png" alt="Description" />
```

## External Links

External links automatically get an arrow icon (↗) and `target="_blank"` with security attributes. You can control this behavior with special markers in your link text:

```mdx
<!-- Standard external link with icon -->
[Anthropic](https://anthropic.com)

<!-- External link without icon -->
[Anthropic[noExternalIcon]](https://anthropic.com)

<!-- External link with icon but no space -->
[Anthropic[noSpace]](https://anthropic.com)
```

The markers `[noExternalIcon]` and `[noSpace]` are automatically removed from the displayed text.