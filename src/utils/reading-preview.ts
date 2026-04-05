/**
 * Reading Preview Utilities
 *
 * Helper functions for accessing cached reading list OG images
 * and generating Cloudflare-transformed image URLs.
 */

import { getCFImageUrl } from './cloudflare-images'
import { CF_IMAGE_PRESETS } from '../consts'

import readingImageCache from '../data/reading-image-cache.json'

export interface ReadingImageCacheEntry {
  localImage: string | null
  originalImage: string | null
  imageType: 'og-image' | null
  title: string
  description: string
  imageAlt?: string
  fetchedAt: string
}

type ReadingImageCacheType = Record<string, ReadingImageCacheEntry>

/**
 * Get the cached data for a reading list URL
 */
export function getReadingPreviewData(url: string): ReadingImageCacheEntry | null {
  return (readingImageCache as ReadingImageCacheType)[url] || null
}

/**
 * Get the image URL for a reading list item, with Cloudflare transformations
 */
export function getReadingPreviewImage(url: string): string | null {
  const entry = getReadingPreviewData(url)

  if (!entry?.localImage) return null

  return getCFImageUrl(entry.localImage, {
    width: 1200,
    quality: CF_IMAGE_PRESETS.linkPreview.quality,
    format: CF_IMAGE_PRESETS.linkPreview.format,
  })
}

/**
 * Get responsive srcset for a reading list item image
 */
export function getReadingPreviewSrcSet(url: string): string | null {
  const entry = getReadingPreviewData(url)

  if (!entry?.localImage) return null

  const widths = CF_IMAGE_PRESETS.linkPreview.widths
  const quality = CF_IMAGE_PRESETS.linkPreview.quality
  const format = CF_IMAGE_PRESETS.linkPreview.format

  return widths
    .map(w => `${getCFImageUrl(entry.localImage!, { width: w, quality, format })} ${w}w`)
    .join(', ')
}
