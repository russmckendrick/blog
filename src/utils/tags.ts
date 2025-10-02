// Tag utility functions
// TAG_METADATA is imported from consts.ts
import { TAG_METADATA, type TagMetadata } from '../consts';

/**
 * Normalize tag slug for consistent lookup
 * Converts to lowercase and replaces spaces with hyphens
 */
export function normalizeTagSlug(slug: string): string {
  return slug.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get tag metadata by slug (case-insensitive, space-insensitive)
 * Returns title with emoji and description
 */
export function getTagMetadata(slug: string): TagMetadata {
  // Normalize slug to lowercase and replace spaces with hyphens
  const normalizedSlug = normalizeTagSlug(slug);
  return TAG_METADATA[normalizedSlug] || {
    title: slug.charAt(0).toUpperCase() + slug.slice(1),
    description: `All posts tagged with ${slug}`
  };
}

/**
 * Get just the display name (with emoji) for a tag
 */
export function getTagDisplayName(slug: string): string {
  return getTagMetadata(slug).title;
}

/**
 * Extract emoji from tag title
 */
export function getTagEmoji(slug: string): string {
  const title = getTagMetadata(slug).title;
  const emojiMatch = title.match(/[\p{Emoji}]/u);
  return emojiMatch ? emojiMatch[0] : '🏷️';
}

/**
 * Get tag name without emoji
 */
export function getTagName(slug: string): string {
  const title = getTagMetadata(slug).title;
  return title.replace(/[\p{Emoji}\s]/gu, '').trim();
}

/**
 * Create tag URL (normalized: lowercase with hyphens)
 */
export function getTagUrl(slug: string): string {
  return `/tags/${normalizeTagSlug(slug)}/`;
}

/**
 * Get tag color classes (combined light and dark mode)
 */
export function getTagColorClasses(slug: string): string {
  const metadata = getTagMetadata(slug);
  return `${metadata.colorLight} ${metadata.colorDark}`;
}