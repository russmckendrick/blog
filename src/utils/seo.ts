/**
 * Small helpers for head metadata and structured data.
 */

import sanitizeHtml from 'sanitize-html'

/**
 * Plain text from a string that may contain HTML (tag descriptions carry
 * links). Tags are removed by sanitize-html, never by regex, per the
 * project's sanitisation rule. sanitize-html entity-encodes its text output,
 * and the result goes into attributes and JSON-LD that are escaped again on
 * render, so the few entities it emits are decoded back to characters —
 * `&amp;` last, so nothing is unescaped twice.
 */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}

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
  const plain = stripEmoji(htmlToText(text)).replace(/\s+/g, ' ').trim()
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
