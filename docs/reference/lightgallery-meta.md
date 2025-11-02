# LightGallery Meta File Plugin

Custom plugin for the LightGallery component that automatically loads image captions from `.meta` files, maintaining compatibility with Hugo's metadata system.

## Overview

This plugin automatically fetches `.meta` files for each image in a LightGallery and displays their titles as captions in the lightbox view.

## How It Works

1. When a LightGallery instance loads, the plugin scans all gallery items
2. For each image (e.g., `/assets/image.jpg`), it looks for a corresponding `.meta` file (`/assets/image.jpg.meta`)
3. If found, it fetches and parses the JSON content
4. The `Title` field is extracted and set as the image caption using the `data-sub-html` attribute
5. Captions appear in the lightbox when users click on images

## Meta File Format

Meta files are simple JSON files with a single `Title` property:

```json
{"Title": "Your caption text here"}
```

### Example

**File:** `/public/assets/2024-02-05/album-cover.jpg.meta`
```json
{"Title": "Once Upon A Time"}
```

This caption will appear when viewing `album-cover.jpg` in the lightbox.

## Usage

### Basic Usage (Auto-enabled)

The plugin is enabled by default on all LightGallery instances:

```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/2024-02-05/album1.jpg" },
      { src: "/assets/2024-02-05/album2.jpg" }
    ]
  }}
/>
```

If `.meta` files exist for these images, captions will automatically load.

### Disable the Plugin

To disable the meta plugin for a specific gallery:

```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/image.jpg" }
    ]
  }}
  enableMetaPlugin={false}
/>
```

### Debug Mode

Enable debug logging to troubleshoot meta file loading:

```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/image.jpg" }
    ]
  }}
  debugMeta={true}
/>
```

Debug logs will appear in the browser console showing:
- Meta file URLs being fetched
- Found/missing meta files
- Extracted titles
- Any fetch errors

## Testing

### 1. Create Test Images and Meta Files

```bash
# Create a test directory
mkdir -p public/assets/test-gallery

# Add your images (or copy existing ones)
# Example: public/assets/test-gallery/photo1.jpg

# Create meta files
echo '{"Title": "Beautiful Sunset"}' > public/assets/test-gallery/photo1.jpg.meta
echo '{"Title": "Mountain Vista"}' > public/assets/test-gallery/photo2.jpg.meta
```

### 2. Create a Test Blog Post

Create a test MDX file in `src/content/blog/`:

```mdx
---
title: "Test Gallery"
description: "Testing meta file plugin"
pubDate: 2025-10-05
draft: true
---

# Test Gallery with Meta Files

<LightGallery
  layout={{
    imgs: [
      { src: "/assets/test-gallery/photo1.jpg" },
      { src: "/assets/test-gallery/photo2.jpg" }
    ]
  }}
  debugMeta={true}
/>
```

### 3. Run Dev Server

```bash
npm run dev
```

### 4. Verify

1. Navigate to your test blog post
2. Open browser console
3. Check for debug logs: `[LG Meta Plugin] ...`
4. Click on an image to open lightbox
5. Verify caption appears at the bottom of the lightbox

## Implementation Details

### Files

- **Plugin Logic**: `src/components/embeds/LightGalleryNew.astro` (inline script)
- **Standalone Module**: `src/utils/lightgallery-meta-plugin.ts` (for reference/future use)
- **Documentation**: `docs/EMBED_USAGE.md` and `CLAUDE.md`

### How It Loads

1. The plugin uses the browser's `fetch()` API to request `.meta` files
2. Requests are asynchronous and run in parallel for all images
3. The plugin waits for all meta files to load before completing initialization
4. If a meta file returns 404 or has errors, it's silently skipped (unless `debugMeta` is enabled)

### Caption Format

Captions are injected as HTML using the `data-sub-html` attribute:

```html
<a href="/assets/image.jpg" data-sub-html="<h4>Image Title</h4>">
```

LightGallery automatically renders this HTML in the lightbox caption area.

### Timing

The plugin initializes 200ms after the astro-lightgallery component loads, giving the component time to render its DOM structure.

## Migration from Hugo

If you're migrating from Hugo and already have `.meta` files:

1. ✅ Keep your existing `.meta` files in `public/assets/`
2. ✅ No changes needed to the JSON format
3. ✅ Update your MDX files to use the LightGallery component
4. ✅ Point `src` paths to `/assets/...` (public directory)

### Example Migration

**Hugo (old):**
```markdown
{{< gallery match="images/*" >}}
```

**Astro (new):**
```mdx
<LightGallery
  layout={{
    imgs: [
      { src: "/assets/2024-01-01-post/images/image1.jpg" },
      { src: "/assets/2024-01-01-post/images/image2.jpg" }
    ]
  }}
/>
```

The `.meta` files stay in the same location alongside the images.

## Troubleshooting

### Captions Not Showing

1. **Check file paths**: Meta file must be at `{image-path}.meta` exactly
2. **Check JSON format**: Must be valid JSON with `Title` property
3. **Enable debug mode**: Add `debugMeta={true}` to see what's happening
4. **Check browser console**: Look for fetch errors or CORS issues
5. **Verify file exists**: Open `{image-url}.meta` directly in browser

### Example Debug Output

```
[LG Meta Plugin] Initializing plugin
[LG Meta Plugin] Found 3 gallery items
[LG Meta Plugin] Fetching meta file: /assets/test/photo1.jpg.meta
[LG Meta Plugin] Found title: Beautiful Sunset
[LG Meta Plugin] Set caption for /assets/test/photo1.jpg: Beautiful Sunset
[LG Meta Plugin] Meta file not found: /assets/test/photo2.jpg.meta
[LG Meta Plugin] Plugin initialization complete
```

### CORS Issues

If meta files are served from a different domain, ensure CORS headers allow fetching:

```
Access-Control-Allow-Origin: *
```

For local development, this shouldn't be an issue.

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableMetaPlugin` | boolean | `true` | Enable/disable automatic meta file loading |
| `debugMeta` | boolean | `false` | Enable console logging for debugging |

## Browser Compatibility

- Uses modern `fetch()` API (supported in all modern browsers)
- Async/await syntax (ES2017+)
- DOM manipulation (querySelector, setAttribute)

Works in: Chrome, Firefox, Safari, Edge (latest versions)

## Future Enhancements

Possible improvements:

- Support for additional meta fields (description, photographer, date, etc.)
- Configurable caption template
- Caching layer for meta files
- Fallback to alt text if no meta file exists
- Support for other caption sources (EXIF data, etc.)
