/**
 * Cloudflare Image Transformations Helper
 * Generates URLs for Cloudflare's CDN-level image transformation service
 *
 * Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/
 *
 * Note: This uses Cloudflare Image Transformations (CDN feature), NOT the
 * Cloudflare adapter's imageService. Works with fully static sites.
 */

export interface CFImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpeg' | 'baseline-jpeg' | 'json';
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  gravity?: 'auto' | 'left' | 'right' | 'top' | 'bottom' | 'center';
  sharpen?: number; // 0-10
  blur?: number; // 0-250
  onerror?: 'redirect';
  metadata?: 'keep' | 'copyright' | 'none';
}

/**
 * Generate Cloudflare Image Transformation URL
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

  // Post card thumbnails (priority/high quality)
  thumbnailPriority: {
    quality: 85,
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
