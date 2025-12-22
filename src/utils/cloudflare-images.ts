/**
 * Cloudflare Image Transformations Helper
 * Generates URLs for Cloudflare's CDN-level image transformation service
 *
 * Docs: https://developers.cloudflare.com/images/transform-images/transform-via-url/
 *
 * Note: This uses Cloudflare Image Transformations (CDN feature), NOT the
 * Cloudflare adapter's imageService. Works with fully static sites.
 */

import { CF_IMAGE_PRESETS } from '../consts';

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

  // Skip transformations in local development
  // This allows npm run dev to work with original images
  if (import.meta.env.DEV) {
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

  // Default to auto format and default quality if not specified
  if (!options.format) params.push('format=auto');
  if (!options.quality) params.push(`quality=${CF_IMAGE_PRESETS.default.quality}`);

  const paramsString = params.join(',');
  return `/cdn-cgi/image/${paramsString}${imagePath}`;
}

/**
 * Generate responsive srcset for Cloudflare images
 * @param src - Image path
 * @param widths - Array of widths to generate
 * @param quality - Image quality (default: CF_IMAGE_PRESETS.default.quality)
 * @param format - Image format (default: 'auto')
 * @returns srcset string
 */
export function generateCFSrcSet(
  src: string | { src: string },
  widths: number[],
  quality: number = CF_IMAGE_PRESETS.default.quality,
  format: 'auto' | 'webp' | 'avif' | 'jpeg' | 'baseline-jpeg' | 'json' = 'auto'
): string {
  return widths
    .map(w => `${getCFImageUrl(src, { width: w, quality, format })} ${w}w`)
    .join(', ');
}

/**
 * Generate LQIP (Low Quality Image Placeholder) URL
 * Returns a tiny, highly compressed image URL for instant placeholder display
 * @param src - Image path
 * @returns LQIP URL string
 */
export function getLQIPUrl(src: string | { src: string }): string {
  return getCFImageUrl(src, {
    width: CF_IMAGE_PRESETS.lqip.width,
    quality: CF_IMAGE_PRESETS.lqip.quality,
    format: CF_IMAGE_PRESETS.lqip.format,
    fit: CF_IMAGE_PRESETS.lqip.fit
  });
}

// Re-export CF_IMAGE_PRESETS from consts for backward compatibility
export { CF_IMAGE_PRESETS };
