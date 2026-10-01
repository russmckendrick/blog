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
  // Strip pictographic emoji only — \p{Emoji} also matches digits and spaces
  return title.replace(/[\p{Extended_Pictographic}️]/gu, '').replace(/\s+/g, ' ').trim();
}

/**
 * Tags whose posts live in the tunes collection. Tag hubs under /tags/ are
 * built from the blog collection only, so these point at the tunes hubs
 * instead (public/_redirects 301s the old /tags/ paths to the same place).
 */
const TAG_URL_OVERRIDES: Record<string, string> = {
  listened: '/tunes/',
  yearend: '/tunes/year/',
};

/**
 * Create tag URL (normalized: lowercase with hyphens)
 */
export function getTagUrl(slug: string): string {
  const normalized = normalizeTagSlug(slug);
  return TAG_URL_OVERRIDES[normalized] ?? `/tags/${normalized}/`;
}

/**
 * Get tag classes — one editorial treatment for every tag.
 * The per-tag pastel palette (colorLight/colorDark in TAG_METADATA)
 * is retired visually; metadata titles/emojis/descriptions still apply.
 */
export function getTagColorClasses(_slug?: string): string {
  return 'tag-editorial';
}