/**
 * Small helpers for head metadata and structured data.
 */

/** Drop emoji (and their joiners/variation selectors) and tidy the spacing. */
export function stripEmoji(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * Fit text to a meta description: plain text, at most `max` characters,
 * cut at a word boundary with an ellipsis. Search results show roughly
 * 150-160 characters, so the default leaves room for the ellipsis.
 */
export function metaDescription(text: string, max = 158): string {
  const plain = stripEmoji(text.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, '')}…`
}

/** Absolute URL for a site path (passes absolute URLs through untouched). */
export function absoluteUrl(pathOrUrl: string, siteUrl: string): string {
  return new URL(pathOrUrl, siteUrl).toString()
}

/** The PNG twin of an avatar illustration (rich results don't take SVG). */
export function avatarPng(avatarPath: string): string {
  return avatarPath.replace(/\.svg$/i, '.png')
}
