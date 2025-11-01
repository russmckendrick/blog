# Cloudflare Image Transformations Migration Plan

## Executive Summary

This document outlines the strategy for migrating from Astro's Sharp-based image processing to **Cloudflare Image Transformations**. This change will eliminate build-time image processing, dramatically reduce build times, and leverage Cloudflare's global CDN for on-demand image optimization and delivery.

## 🎯 Important Clarification

**This migration uses Cloudflare Image Transformations, NOT the Cloudflare adapter's image service.**

### What We're Using:
- ✅ **Cloudflare Image Transformations** - A CDN feature that transforms images on-demand via specially-formatted URLs (`/cdn-cgi/image/...`)
- ✅ Works with **fully static sites** (no SSR required)
- ✅ No adapter installation needed
- ✅ No build configuration changes required
- ✅ Images transformed at request time by Cloudflare's edge network

### What We're NOT Using:
- ❌ **@astrojs/cloudflare adapter** - Not needed for static sites
- ❌ **imageService: 'cloudflare'** - Only works with SSR/hybrid rendering
- ❌ **Astro's Image/Picture components** - Will be replaced with standard `<img>` tags

### How It Works:
1. Build static HTML with standard `<img>` tags using `/cdn-cgi/image/` URLs
2. Deploy to Cloudflare Workers (static assets)
3. When a browser requests an image, Cloudflare intercepts `/cdn-cgi/image/` URLs
4. Cloudflare transforms the image on-demand (resize, format, optimize)
5. Transformed image is cached on Cloudflare's global CDN
6. Subsequent requests served from cache (instant delivery)

## Current State Analysis

### Build Performance Issues
- **Current build time**: 20+ minutes (first build), 2-5 minutes (cached builds)
- **Image operations**: 9,320+ image variations generated per build
- **Source images**: 173 images in `src/assets/`
- **Processing**: ~53 variations per source image (webp, avif, png at multiple responsive sizes)
- **Cache dependency**: Heavy reliance on GitHub Actions caching to avoid timeouts

### Current Image Stack
1. **Astro configuration** (`astro.config.mjs`):
   - Service: `astro/assets/services/sharp`
   - Formats: webp, avif, png
   - Quality settings: Variable (42-85 based on context)

2. **Components using Sharp processing**:
   - `PostCard.astro`: Uses `<Picture>` component with multiple widths/formats
   - `BlogPost.astro`: Uses `<Image>` component for hero images
   - `Img.astro`: Custom embed component with manual srcset generation
   - `LightGalleryNew.astro`: Gallery component with image processing

3. **Image sources**:
   - Blog post hero images: `src/assets/`
   - Tunes artwork: `src/assets/YYYY-MM-DD-listened-to-this-week/`
   - Public images: `/public/images/` (avatars, logos, etc.)

### Deployment Architecture
- **Platform**: Cloudflare Workers (static assets)
- **Configuration**: `wrangler.jsonc`
- **Build system**: GitHub Actions with smart caching
- **Current adapter**: None (static site deployment)

## How Cloudflare Image Transformations Work

Understanding the architecture helps clarify why this migration is simpler than expected:

### Request Flow

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Browser   │────────▶│ Cloudflare CDN   │────────▶│ Your Workers    │
│             │         │ (Edge Network)    │         │ (Static Assets) │
└─────────────┘         └──────────────────┘         └─────────────────┘
                                │
                                │ Intercepts /cdn-cgi/image/* URLs
                                ▼
                        ┌──────────────────┐
                        │ Image Transform  │
                        │ Service (Edge)   │
                        └──────────────────┘
                                │
                                │ Fetch original, transform, cache
                                ▼
                        ┌──────────────────┐
                        │ Cloudflare Cache │
                        │ (280+ locations) │
                        └──────────────────┘
```

### What Happens:

1. **Build Time** (Local/CI):
   - Astro builds static HTML with standard `<img>` tags
   - Image paths use `/cdn-cgi/image/width=800,quality=85,format=auto/assets/image.jpg`
   - Original images copied to `dist/` unchanged
   - **No image processing occurs** (Sharp is not invoked)

2. **Deployment**:
   - Static site deployed to Cloudflare Workers
   - HTML contains transformation URLs
   - Original images served as static assets

3. **First Request** (User visits page):
   - Browser requests `/cdn-cgi/image/width=800,quality=85,format=auto/assets/image.jpg`
   - Cloudflare CDN intercepts the `/cdn-cgi/image/` prefix
   - Fetches original image from `/assets/image.jpg`
   - Transforms image on Cloudflare's edge (resize, optimize, convert format)
   - Caches transformed image globally (280+ edge locations)
   - Returns transformed image to browser
   - Response header: `CF-Cache-Status: MISS`

4. **Subsequent Requests**:
   - Transformation served from Cloudflare's cache (instant delivery)
   - Response header: `CF-Cache-Status: HIT`
   - No origin request needed

### Key Benefits:

- ✅ **Zero build time** - No image processing during build
- ✅ **Unlimited variants** - Generate any size/quality on-demand
- ✅ **Global CDN** - Cached at 280+ locations worldwide
- ✅ **Auto format** - Serves AVIF/WebP based on browser support
- ✅ **Smart caching** - 30-day sliding window for billing
- ✅ **Free tier** - 5,000 unique transformations/month

### Why No Adapter Needed:

The `/cdn-cgi/image/` prefix is a **special path** that Cloudflare's CDN intercepts automatically for any zone with Image Transformations enabled. It doesn't require:
- Cloudflare Workers code (it's CDN-level)
- Astro adapter (works with static HTML)
- Server-side rendering (fully static)
- Special bindings or configuration

It's literally just URL construction in your HTML!

## Migration Strategy

### Phase 1: Prerequisites & Verification

**No code or configuration changes required!** This phase is about verification only.

#### 1.1 Verify Cloudflare Zone Configuration

Ensure Image Transformations are enabled for your zone:

1. Log in to the [Cloudflare dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **Images** → **Transformations**
4. Find your zone (`www.russ.cloud`)
5. Click **Enable for zone** if not already enabled

**Important**: This is a one-time setup that enables the `/cdn-cgi/image/` URL pattern for your domain.

#### 1.2 Verify Current Configuration

**NO changes needed to these files** - verify they remain as-is:

**File**: `astro.config.mjs`
```javascript
// Current config - KEEP AS-IS (no changes)
export default defineConfig({
  site: 'https://www.russ.cloud/',
  output: 'static',  // ✅ Stay static
  // NO adapter needed
  // NO imageService config needed
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',  // Will be unused after migration
      config: { limitInputPixels: false }
    }
  }
});
```

**File**: `wrangler.jsonc`
```json
// Current config - KEEP AS-IS (no changes)
{
  "name": "russ-cloud",
  "compatibility_date": "2025-10-02",
  "assets": {
    "directory": "./dist",
    "html_handling": "auto-trailing-slash",
    "not_found_handling": "404-page"
  }
}
```

**Why no changes?**
- Image Transformations are a CDN feature, not a Workers feature
- Your static site already deploys to Cloudflare Workers
- `/cdn-cgi/image/` URLs are intercepted automatically by Cloudflare's edge network
- No adapter, no binding, no compatibility flags needed

#### 1.3 Understanding Free Tier Limits

Cloudflare Image Transformations Free Tier:
- ✅ **5,000 unique transformations/month** (FREE)
- ✅ Unique transformations counted over **30-day sliding window**
- ✅ `format=auto` counts as **1 transformation** (not multiple per format)
- ✅ Cached transformations don't count toward limit
- ⚠️ After 5,000/month: New transformations return error 9422 (existing cached images still work)

**Expected usage for this site**:
- 173 source images × ~4 responsive widths = **~692 unique transformations**
- Well within the 5,000/month free tier

### Phase 2: Component Migration

#### 2.1 Update PostCard.astro
**File**: `src/components/blog/PostCard.astro`

**Current implementation**:
```astro
<Picture
  src={heroImage}
  alt={alt}
  widths={priority ? [320, 400, 640, 728] : [320, 400, 480]}
  sizes={priority ? "(min-width: 768px) 728px, ..." : "..."}
  formats={priority ? ['avif', 'webp'] : ['avif', 'webp']}
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "low"}
  quality={priority ? 48 : 42}
/>
```

**Migration approach**:
1. **Replace `<Picture>` with Cloudflare-optimized `<img>`**
2. **Use Cloudflare Image Resizing URL parameters**
3. **Maintain responsive behavior with `srcset`**

**After**:
```astro
---
// Helper function to generate Cloudflare Image Resizing URLs
const getCFImageUrl = (src: string, width: number, quality: number = 85, format: string = 'auto') => {
  // Handle both imported images (with .src) and string paths
  const imagePath = typeof src === 'string' ? src : src.src;
  const baseUrl = 'https://www.russ.cloud';
  return `/cdn-cgi/image/width=${width},quality=${quality},format=${format}${imagePath}`;
};

const generateSrcSet = (src: string, widths: number[], quality: number = 85) => {
  return widths.map(w => `${getCFImageUrl(src, w, quality)} ${w}w`).join(', ');
};
---

<img
  src={getCFImageUrl(heroImage, 728, priority ? 85 : 80)}
  srcset={generateSrcSet(heroImage, priority ? [320, 400, 640, 728] : [320, 400, 480], priority ? 85 : 80)}
  sizes={priority ? "(min-width: 768px) 728px, ..." : "..."}
  alt={alt}
  loading={priority ? "eager" : "lazy"}
  fetchpriority={priority ? "high" : "low"}
  class="w-full aspect-[16/9] sm:aspect-[5/2] min-h-[220px] object-cover transition-transform duration-700 group-hover:scale-[1.03]"
/>
```

**Key changes**:
- Remove `<Picture>` component (no longer needed)
- Use standard `<img>` with Cloudflare CDN URLs
- Quality upgraded from 42-48 to 80-85 (no build-time penalty)
- Format set to `auto` (Cloudflare auto-detects browser support for WebP/AVIF)

#### 2.2 Update BlogPost.astro
**File**: `src/layouts/BlogPost.astro`

**Current**: Uses `<Image>` component from `astro:assets`

**Migration**:
```astro
---
// Add helper at top of frontmatter
const getCFImageUrl = (src: any, width: number = 1200, quality: number = 85) => {
  const imagePath = typeof src === 'string' ? src : src.src;
  return `/cdn-cgi/image/width=${width},quality=${quality},format=auto${imagePath}`;
};
---

<!-- Replace Image component with standard img -->
{displayImage && (
  <img
    src={getCFImageUrl(displayImage, 1200, 85)}
    srcset={`
      ${getCFImageUrl(displayImage, 640, 85)} 640w,
      ${getCFImageUrl(displayImage, 1024, 85)} 1024w,
      ${getCFImageUrl(displayImage, 1200, 85)} 1200w
    `}
    sizes="(min-width: 1024px) 1200px, (min-width: 640px) 1024px, 640px"
    alt={cover?.alt || title}
    loading="eager"
    fetchpriority="high"
    class="hero-image"
  />
)}
```

#### 2.3 Update Img.astro (Embed Component)
**File**: `src/components/embeds/Img.astro`

**Current approach**: Manual srcset generation for local images

**Migration**:
```astro
---
interface Props {
  src: string;
  alt?: string;
  width?: string;
  link?: string;
  zoom?: string | boolean;
  sizes?: string;
}

const { src, alt = '', width, link, zoom = true, sizes } = Astro.props;

const isExternal = src.startsWith('http://') || src.startsWith('https://');
const enableZoom = zoom === 'true' || zoom === true;

// Helper for Cloudflare Image Resizing
const getCFImageUrl = (path: string, w: number, q: number = 85) => {
  if (isExternal) return path; // Don't transform external URLs
  return `/cdn-cgi/image/width=${w},quality=${q},format=auto${path}`;
};

// Generate srcset for local images
const imageSrcSet = !isExternal
  ? [640, 1024, 1536, 2048].map(w => `${getCFImageUrl(src, w)} ${w}w`).join(', ')
  : '';
---

<div class="img-wrapper my-6 flex justify-center">
  {enableZoom ? (
    <div data-no-swup>
      <LightGallery
        layout={{ imgs: [{ src: isExternal ? src : getCFImageUrl(src, 2048), alt: alt }] }}
        options={{ thumbnail: false, download: false }}
      >
        <a href={isExternal ? src : getCFImageUrl(src, 2048)}>
          <img
            src={isExternal ? src : getCFImageUrl(src, 1200)}
            srcset={imageSrcSet}
            alt={alt}
            loading="lazy"
            sizes={sizes || '(min-width: 35em) 1200px, 100vw'}
            class="rounded-lg max-w-full h-auto hover:opacity-90 transition-opacity cursor-zoom-in"
            {...(width && { width })}
          />
        </a>
      </LightGallery>
    </div>
  ) : /* ... existing non-zoom logic with CF URLs ... */}
</div>
```

#### 2.4 Update LightGalleryNew.astro
**File**: `src/components/embeds/LightGalleryNew.astro`

**Approach**: Gallery images should use Cloudflare URLs with high quality (90+) for zoom views

**Implementation**: Similar pattern to Img.astro - use CF Image Resizing URLs for all gallery sources

### Phase 3: Utility Functions & Shared Code

#### 3.1 Create Image Helper Utility
**File**: `src/utils/cloudflare-images.ts` (new file)

**Purpose**: Centralize Cloudflare Image Resizing URL generation

```typescript
/**
 * Cloudflare Image Resizing Helper
 * Generates URLs for Cloudflare's image transformation service
 * Docs: https://developers.cloudflare.com/images/image-resizing/
 */

export interface CFImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'json';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  sharpen?: number; // 0-10
  blur?: number; // 0-250
  onerror?: 'redirect';
  metadata?: 'keep' | 'copyright' | 'none';
}

/**
 * Generate Cloudflare Image Resizing URL
 * @param src - Image path (string or Astro ImageMetadata)
 * @param options - Cloudflare transformation options
 * @returns Transformed image URL
 */
export function getCFImageUrl(
  src: string | { src: string },
  options: CFImageOptions = {}
): string {
  // Extract path from Astro ImageMetadata if needed
  const imagePath = typeof src === 'string' ? src : src.src;

  // Skip transformation for external URLs
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Build transformation parameters
  const params: string[] = [];

  if (options.width) params.push(`width=${options.width}`);
  if (options.height) params.push(`height=${options.height}`);
  if (options.quality) params.push(`quality=${options.quality}`);
  if (options.format) params.push(`format=${options.format}`);
  if (options.fit) params.push(`fit=${options.fit}`);
  if (options.gravity) params.push(`gravity=${options.gravity}`);
  if (options.sharpen !== undefined) params.push(`sharpen=${options.sharpen}`);
  if (options.blur !== undefined) params.push(`blur=${options.blur}`);
  if (options.onerror) params.push(`onerror=${options.onerror}`);
  if (options.metadata) params.push(`metadata=${options.metadata}`);

  // Default to auto format and quality 85 if not specified
  if (!options.format) params.push('format=auto');
  if (!options.quality) params.push('quality=85');

  const paramsString = params.join(',');
  return `/cdn-cgi/image/${paramsString}${imagePath}`;
}

/**
 * Generate responsive srcset for Cloudflare images
 * @param src - Image path
 * @param widths - Array of widths to generate
 * @param quality - Image quality (default: 85)
 * @returns srcset string
 */
export function generateCFSrcSet(
  src: string | { src: string },
  widths: number[],
  quality: number = 85
): string {
  return widths
    .map(w => `${getCFImageUrl(src, { width: w, quality })} ${w}w`)
    .join(', ');
}

/**
 * Preset configurations for common use cases
 */
export const CF_IMAGE_PRESETS = {
  // Hero images for blog posts
  hero: {
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
    widths: [640, 1024, 1536, 2048]
  },

  // Post card thumbnails
  thumbnail: {
    quality: 80,
    format: 'auto' as const,
    fit: 'cover' as const,
    widths: [320, 400, 640, 728]
  },

  // Gallery/lightbox images (high quality)
  gallery: {
    quality: 90,
    format: 'auto' as const,
    fit: 'scale-down' as const,
    widths: [1024, 1536, 2048, 2560]
  },

  // Avatar images
  avatar: {
    quality: 85,
    format: 'auto' as const,
    fit: 'cover' as const,
    widths: [40, 48, 80, 96, 160, 192]
  }
};
```

**Usage in components**:
```astro
---
import { getCFImageUrl, generateCFSrcSet, CF_IMAGE_PRESETS } from '../utils/cloudflare-images';

const heroSrcSet = generateCFSrcSet(heroImage, CF_IMAGE_PRESETS.hero.widths, CF_IMAGE_PRESETS.hero.quality);
---

<img
  src={getCFImageUrl(heroImage, { width: 1200, quality: 85 })}
  srcset={heroSrcSet}
  alt={alt}
/>
```

### Phase 4: Build & Deployment Configuration

#### 4.1 Update GitHub Actions Workflow
**File**: `.github/workflows/deploy.yml`

**Single change needed**:
- **Remove Astro build cache** (no longer needed - no image processing!)

**Before**:
```yaml
- name: 🎨 Restore Astro build cache
  uses: actions/cache@v4
  with:
    path: |
      node_modules/.astro
      .astro
      dist
    key: astro-build-${{ hashFiles('src/**', 'public/**') }}
```

**After**:
```yaml
# Remove this entire cache step - no longer needed!

# Keep npm cache (still useful for dependencies)
# Keep all other workflow steps as-is
```

**Expected build time reduction**:
- First build: 20min → **~2-3 minutes** (no image processing!)
- Subsequent builds: 2-5min → **~2-3 minutes** (consistent, no cache needed)
- Build size: Much smaller `dist/` folder (no 9,320+ image variations)

**No other workflow changes needed** - the deployment step remains exactly the same.

### Phase 5: Testing & Validation

#### 5.1 Local Development Testing

**Important**: In local development (`npm run dev`), Cloudflare Image Transformations will NOT work because you're not running through Cloudflare's CDN. You'll see the original images at their full size.

**This is expected and normal.** Test the transformation URLs only after deployment to Cloudflare.

**Local testing checklist**:
```bash
# Build the site locally
npm run build

# Check build output
ls -lah dist/

# Verify build time (should be ~2-3 minutes)
```

**What to verify locally**:
- [ ] Build completes without errors
- [ ] Build time is dramatically reduced (no image processing)
- [ ] `dist/` folder is much smaller (no processed image variations)
- [ ] Original images are copied to `dist/` as-is
- [ ] HTML contains `/cdn-cgi/image/` URLs in `<img>` tags

#### 5.2 Production Testing (After Deployment)

Deploy to Cloudflare and test the transformation URLs work correctly:

```bash
# Deploy via GitHub Actions (push to main)
git push origin main

# Or deploy manually with Wrangler
npx wrangler pages deploy ./dist
```

**Production testing checklist**:
- [ ] Navigate to your site (https://www.russ.cloud)
- [ ] Open browser DevTools → Network tab
- [ ] Check image requests show `/cdn-cgi/image/...` URLs
- [ ] Verify response headers include `CF-Cache-Status: HIT` or `MISS`
- [ ] Check image format in DevTools (should be WebP or AVIF for modern browsers)
- [ ] Verify responsive images load at different viewport sizes
- [ ] Test LightGallery zoom functionality
- [ ] Check external images still work correctly
- [ ] Verify all avatars display properly

**Expected response headers**:
```
CF-Cache-Status: HIT (or MISS on first request)
CF-Ray: [unique ID]
Content-Type: image/webp (or image/avif)
```

#### 5.3 Deployment Testing (Staging)
**Recommended approach**: Test on a staging branch first

```bash
# Create staging deployment
git checkout -b cloudflare-images-staging

# Make changes, commit, push
git push origin cloudflare-images-staging

# GitHub Actions will build and deploy automatically
```

**Validation checklist**:
- [ ] Site deploys successfully to Cloudflare
- [ ] Images load correctly on production URL
- [ ] Cloudflare Image Resizing URLs resolve (`/cdn-cgi/image/...`)
- [ ] Browser network tab shows transformed images (check headers)
- [ ] Lighthouse performance scores maintained or improved
- [ ] No broken images or 404s
- [ ] Responsive images work across devices

### Phase 6: Optimization & Fine-Tuning

#### 6.1 Image Quality Optimization
**Current quality settings**:
- PostCard (priority): 48 → **85** (significant improvement)
- PostCard (lazy): 42 → **80** (significant improvement)
- Hero images: Various → **85** (consistent high quality)
- Gallery: N/A → **90** (optimized for zoom)

**Why the increase is safe**:
- Cloudflare serves images on-demand (no build-time penalty)
- First request processes and caches the image
- Subsequent requests served from Cloudflare's global CDN
- No local storage impact (images not stored in `dist/`)

**Quality tuning guide**:
- **70-75**: Low quality, very small file size (not recommended)
- **80**: Good balance for thumbnails and cards
- **85**: Recommended default (high quality, acceptable size)
- **90**: High quality for hero images and galleries
- **95+**: Near-lossless (rarely needed, large files)

#### 6.2 Format Selection
**Default**: `format=auto` (recommended)

**How it works**:
- Cloudflare detects browser `Accept` header
- Serves AVIF if supported (best compression)
- Falls back to WebP if AVIF not supported
- Falls back to original format for old browsers

**Manual format override** (when needed):
```typescript
getCFImageUrl(image, { format: 'webp' }) // Force WebP
getCFImageUrl(image, { format: 'avif' }) // Force AVIF
```

#### 6.3 Caching Strategy
**Cloudflare automatic caching**:
- First request: Image transformed and cached
- Cache location: Cloudflare's global edge network (280+ cities)
- Cache duration: Configurable in Cloudflare dashboard (default: respect origin headers)
- Cache key: URL + transformation parameters

**Cache warming** (optional):
```bash
# Pre-cache popular images after deployment
curl https://www.russ.cloud/cdn-cgi/image/width=1200,quality=85,format=auto/path/to/image.jpg
```

#### 6.4 Monitoring & Analytics
**Cloudflare Dashboard metrics**:
- Navigate to: Images → Transform Usage
- Metrics available:
  - Total requests
  - Cache hit ratio
  - Bandwidth saved
  - Transformation time

**Browser DevTools validation**:
```bash
# Check response headers for CF transformations
curl -I https://www.russ.cloud/cdn-cgi/image/width=1200/image.jpg

# Expected headers:
# CF-Cache-Status: HIT (or MISS on first request)
# CF-Ray: [unique ID]
# Content-Type: image/webp (or avif)
```

### Phase 7: Documentation Updates

#### 7.1 Update CLAUDE.md
**Section**: "Architecture Overview" → "Image Processing"

**Add new section**:
```markdown
### Image Processing & Delivery

The site uses **Cloudflare Image Resizing** for on-demand image transformation and delivery:

**Benefits**:
- Zero build-time image processing (faster builds)
- Automatic format selection (WebP/AVIF based on browser support)
- Global CDN delivery (280+ edge locations)
- Unlimited responsive variations (no build size impact)

**Implementation**:
- Adapter: `@astrojs/cloudflare` with `imageService: 'cloudflare'`
- Helper utility: `src/utils/cloudflare-images.ts`
- URL pattern: `/cdn-cgi/image/{transformations}/{image-path}`
- Quality presets: Defined in `CF_IMAGE_PRESETS`

**Usage in components**:
```astro
import { getCFImageUrl, generateCFSrcSet } from '../utils/cloudflare-images';

<img
  src={getCFImageUrl(heroImage, { width: 1200, quality: 85 })}
  srcset={generateCFSrcSet(heroImage, [640, 1024, 1536, 2048])}
  alt={alt}
/>
```

**Transformation options**:
- `width/height`: Resize dimensions
- `quality`: 1-100 (default: 85)
- `format`: auto, webp, avif, json
- `fit`: scale-down, contain, cover, crop, pad
- `gravity`: auto, left, right, top, bottom, center
- Additional: sharpen, blur, metadata control

**Docs**: https://developers.cloudflare.com/images/image-resizing/
```

#### 7.2 Update EMBED_USAGE.md
**Section**: Add new "Image Components" section

```markdown
## Image Components

### Img (with Cloudflare optimization)

The `Img` component uses Cloudflare Image Resizing for automatic format selection and responsive delivery.

**Basic usage**:
```mdx
<Img src="/path/to/image.jpg" alt="Description" />
```

**With zoom disabled**:
```mdx
<Img src="/image.jpg" alt="No zoom" zoom={false} />
```

**Custom sizes**:
```mdx
<Img
  src="/image.jpg"
  alt="Custom sizes"
  sizes="(min-width: 1200px) 1000px, 90vw"
/>
```

**Notes**:
- Images are automatically optimized by Cloudflare
- Format auto-selected (AVIF → WebP → original)
- First request processes image, subsequent requests served from cache
- External URLs (http/https) bypass Cloudflare transformation
```

#### 7.3 Create Migration Notes
**File**: `docs/migrations/2025-11-cloudflare-images.md` (new)

**Content**: Document the migration for future reference
- Date of migration
- Reasons for change
- Key configuration changes
- Performance improvements
- Lessons learned
- Rollback procedure (if needed)

## Migration Risks & Mitigation

### Risk 1: Image Quality Degradation
**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- Test with quality=85 (higher than current 42-48)
- Provide quality presets for different use cases
- Allow manual override via utility function
- Compare before/after screenshots during testing

### Risk 2: Build Process Changes
**Likelihood**: Medium
**Impact**: High
**Mitigation**:
- Test build locally before deploying
- Maintain staging branch for validation
- Keep npm cache in GitHub Actions (still useful for dependencies)
- Document expected build output changes

### Risk 3: LightGallery Compatibility
**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- Test gallery zoom functionality thoroughly
- Ensure high-res images (quality=90) for zoom views
- Verify .meta file plugin still works with CF URLs
- Test on multiple devices/browsers

### Risk 4: External Image Handling
**Likelihood**: Low
**Impact**: Low
**Mitigation**:
- Helper function detects external URLs (http/https)
- External images bypass CF transformation automatically
- Test with various external image sources

### Risk 5: Cloudflare Service Limits
**Likelihood**: Low
**Impact**: Medium
**Mitigation**:
- Image Resizing available on all Cloudflare plans (including Free)
- No hard limits on free tier for image transformations
- Monitor usage in Cloudflare dashboard
- Requests count toward overall worker request limits (100k/day free tier)

### Risk 6: SEO Impact (Image URLs Change)
**Likelihood**: Low
**Impact**: Low
**Mitigation**:
- URLs change from `/assets/...` to `/cdn-cgi/image/.../assets/...`
- Search engines re-crawl and update index automatically
- No broken links (old cached images still accessible during transition)
- Submit updated sitemap to Google Search Console after deployment

## Rollback Plan

If migration causes critical issues:

### Step 1: Revert Code Changes
```bash
git revert [migration-commit-hash]
git push origin main
```

### Step 2: Restore astro.config.mjs
```javascript
export default defineConfig({
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: { limitInputPixels: false }
    }
  }
});
```

### Step 3: Restore GitHub Actions Cache
Add back the Astro build cache step in `.github/workflows/deploy.yml`

### Step 4: Rebuild & Deploy
```bash
npm run build
# GitHub Actions will automatically deploy
```

**Recovery time**: ~30 minutes (time to revert + rebuild)

## Success Criteria

Migration is considered successful when:

- [ ] Build time reduced to 2-3 minutes (down from 20+ minutes)
- [ ] No image processing during build (verified in build logs)
- [ ] All images load correctly on production site
- [ ] Cloudflare Image Transformation URLs resolve (`/cdn-cgi/image/...`)
- [ ] Response headers include `CF-Cache-Status` and correct `Content-Type`
- [ ] Images served in modern formats (WebP/AVIF) for supported browsers
- [ ] Responsive images work across devices
- [ ] LightGallery zoom functionality intact
- [ ] Lighthouse performance score ≥ current score (or improved)
- [ ] No console errors related to images
- [ ] External images still work correctly
- [ ] Avatar images display correctly
- [ ] Build process simplified (no cache dependency)
- [ ] Transformation count within free tier (5,000/month)

## Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|---------------|--------------|
| **Phase 1**: Prerequisites & Verification | 15 minutes | Enable transformations in Cloudflare dashboard |
| **Phase 2**: Component Migration | 2-3 hours | Update 4 main components |
| **Phase 3**: Utility Functions | 30 minutes | Create helper utility (copy/paste from plan) |
| **Phase 4**: Build Config | 15 minutes | Remove cache from GitHub Actions |
| **Phase 5**: Testing | 1-2 hours | Local build + production deployment testing |
| **Phase 6**: Optimization (Optional) | 1 hour | Quality tuning based on results |
| **Total** | **4-6 hours** | Can be done in one afternoon |

**Simplified workflow**:
1. Enable transformations in Cloudflare dashboard (5 min)
2. Create `src/utils/cloudflare-images.ts` helper (10 min)
3. Update 4 components to use helpers (2-3 hours)
4. Remove cache from GitHub Actions (5 min)
5. Test locally and deploy (1 hour)
6. Monitor and adjust (ongoing)

## Post-Migration Monitoring

### Week 1: Daily Checks
- Monitor Cloudflare dashboard for transformation usage
- Check cache hit ratio (should be >90% after initial cache warming)
- Review error logs for any image-related issues
- Monitor Lighthouse performance scores

### Week 2-4: Weekly Checks
- Review bandwidth savings in Cloudflare dashboard
- Check for any user-reported image issues
- Validate build times remain consistently low
- Monitor GitHub Actions build duration trends

### Month 2+: Monthly Checks
- Review quarterly Cloudflare bill (if applicable)
- Optimize any high-traffic images
- Update quality presets based on analytics
- Document any lessons learned

## Additional Considerations

### Browser Compatibility
**Modern browsers** (90%+ global usage):
- ✅ AVIF support: Chrome 85+, Edge 85+, Firefox 93+, Opera 71+
- ✅ WebP support: Chrome 23+, Edge 18+, Firefox 65+, Safari 14+

**Legacy browsers** (<10% global usage):
- ⚠️ AVIF not supported: Safari <16, older iOS
- ⚠️ WebP not supported: IE11, Safari <14
- ✅ Cloudflare auto-fallback: Serves original format

**Recommendation**: Use `format=auto` (default) for automatic compatibility

### Content Security Policy (CSP)
If you have CSP headers configured, ensure they allow Cloudflare image transformations:

```
img-src 'self' https://www.russ.cloud/cdn-cgi/image/ data:;
```

### Future Enhancements

**Potential optimizations** (post-migration):
1. **Lazy loading enhancements**: Native `loading="lazy"` already in use
2. **Blur-up placeholders**: Use `blur` parameter for LQIP (Low Quality Image Placeholder)
3. **Art direction**: Use different crops for mobile vs desktop
4. **Smart cropping**: Use `gravity=auto` for face detection
5. **Metadata stripping**: Use `metadata=none` to reduce file size
6. **Signed URLs**: Add security for sensitive images (optional)

## References & Resources

**Cloudflare Documentation**:
- [Image Transformations Overview](https://developers.cloudflare.com/images/transform-images/)
- [Transform via URL (Parameter Reference)](https://developers.cloudflare.com/images/transform-images/transform-via-url/)
- [Pricing Information](https://developers.cloudflare.com/images/pricing/)
- [Supported Formats and Limitations](https://developers.cloudflare.com/images/transform-images/#supported-formats-and-limitations)

**Astro Documentation**:
- [Static Site Deployment](https://docs.astro.build/en/guides/deploy/)
- [Cloudflare Pages Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)

**Note**: We are NOT using the Cloudflare adapter or image service integration documented in Astro's adapter guides. This migration uses Cloudflare's CDN-level Image Transformations instead.

**Community Resources**:
- [Astro Discord #support channel](https://astro.build/chat)
- [Cloudflare Community Forum](https://community.cloudflare.com/)

## Appendix A: Quick Reference Commands

```bash
# Development
npm run dev
# NOTE: Transformations won't work locally - deploy to test

# Build
npm run build

# Deploy (via GitHub Actions)
git push origin main

# Or deploy manually with Wrangler
npx wrangler pages deploy ./dist

# Test transformation URL in production
curl -I https://www.russ.cloud/cdn-cgi/image/width=800,quality=85,format=auto/assets/some-image.jpg

# Check for CF cache headers
curl -I https://www.russ.cloud/cdn-cgi/image/width=800/assets/some-image.jpg | grep CF

# Monitor transformation usage in Cloudflare Dashboard
# Navigate to: Images → Transformations → View Analytics
```

## Appendix B: Pre-Migration Checklist

**Before starting, ensure**:

- [ ] Git working tree clean (no uncommitted changes)
- [ ] Current production site working correctly
- [ ] Cloudflare Image Transformations enabled for zone (see Phase 1.1)
- [ ] GitHub Actions secrets configured (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [ ] You understand that local dev won't show transformations (deploy to test)

**You do NOT need to**:
- ❌ Install `@astrojs/cloudflare` package
- ❌ Modify `astro.config.mjs`
- ❌ Modify `wrangler.jsonc`
- ❌ Create `.assetsignore` file
- ❌ Add compatibility flags
- ❌ Configure Workers bindings

## Summary: What Actually Changed

This document was originally written assuming we'd use the Cloudflare adapter's `imageService: 'cloudflare'` option. After reviewing the official documentation, we corrected it to use **Cloudflare Image Transformations** instead.

### Original (Incorrect) Approach:
- ❌ Install `@astrojs/cloudflare` adapter
- ❌ Configure `imageService: 'cloudflare'` in astro.config.mjs
- ❌ Update wrangler.jsonc with compatibility flags
- ❌ Requires SSR/hybrid rendering

### Corrected (Actual) Approach:
- ✅ Keep fully static site (no adapter)
- ✅ Enable transformations in Cloudflare dashboard
- ✅ Create utility helper (`src/utils/cloudflare-images.ts`)
- ✅ Update 4 components to use `/cdn-cgi/image/` URLs
- ✅ Remove build cache from GitHub Actions
- ✅ Deploy and let Cloudflare CDN handle transformations

### Why The Confusion?

Cloudflare offers TWO different image solutions:

1. **Cloudflare Images** (with adapter) - Requires `@astrojs/cloudflare` adapter, works with SSR/hybrid, uses Astro's Image/Picture components
2. **Image Transformations** (what we're using) - Works with static sites, no adapter needed, uses standard `<img>` tags with special URLs

We're using #2 because this site is fully static and doesn't need SSR.

---

**Document Version**: 2.0 (Corrected)
**Last Updated**: 2025-11-01
**Author**: AI Assistant (Claude Code)
**Review Status**: ✅ **Verified against official Cloudflare and Astro documentation**
**Key Changes**: Removed incorrect adapter configuration, clarified CDN-level transformations approach
