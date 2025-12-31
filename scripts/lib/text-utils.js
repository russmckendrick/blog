/**
 * Shared text normalization and lookup utilities
 */

/**
 * Escape quotes in text for safe use in HTML/JSX attributes
 */
export function escapeQuotes(text) {
  if (!text) return ''
  return text
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function normalizeText(text) {
  if (!text) return ''
  return text
    .normalize('NFKD')
    .toLowerCase()
    .trim()
    // Replace "&" with "and" for consistent matching
    .replace(/\s*&\s*/g, ' and ')
    // Normalize multiple spaces to single space
    .replace(/\s+/g, ' ')
}

export function removeArticle(text) {
  if (!text) return ''
  return text.replace(/^(the|a|an)\s+/i, '')
}

/**
 * Remove bracketed suffixes from album names
 * e.g., "A Momentary Lapse of Reason (2019 Remix)" -> "A Momentary Lapse of Reason"
 * e.g., "The Sound of the Smiths (Deluxe; 2008 Remaster)" -> "The Sound of the Smiths"
 */
export function removeBracketedSuffix(text) {
  if (!text) return ''
  // Remove content in parentheses, square brackets, or curly braces at the end
  // Also handles multiple brackets like "Album (Deluxe) (Remastered)"
  return text
    .replace(/\s*[\(\[\{][^\)\]\}]*[\)\]\}]\s*$/g, '')
    .replace(/\s*[\(\[\{][^\)\]\}]*[\)\]\}]\s*$/g, '') // Run twice for nested/multiple
    .trim()
}

/**
 * Check if an artist name is a variation of "Various Artists"
 */
export function isVariousArtists(artist) {
  if (!artist) return false
  const normalized = normalizeText(artist)
  const variousPatterns = [
    'various artists',
    'various artitsts', // common typo
    'various',
    'va'
  ]
  return variousPatterns.includes(normalized)
}

/**
 * Normalize text for filenames - convert special characters to ASCII equivalents
 */
export function normalizeForFilename(text) {
  if (!text) return ''

  // First normalize unicode characters
  let normalized = text.normalize('NFD')

  // Replace special Icelandic and other characters with ASCII equivalents
  const charMap = {
    'á': 'a', 'Á': 'A',
    'ð': 'd', 'Ð': 'D',
    'é': 'e', 'É': 'E',
    'í': 'i', 'Í': 'I',
    'ó': 'o', 'Ó': 'O',
    'ú': 'u', 'Ú': 'U',
    'ý': 'y', 'Ý': 'Y',
    'þ': 'th', 'Þ': 'Th',
    'æ': 'ae', 'Æ': 'Ae',
    'ö': 'o', 'Ö': 'O',
    'ø': 'o', 'Ø': 'O',
    'å': 'a', 'Å': 'A',
    'ü': 'u', 'Ü': 'U',
    'ä': 'a', 'Ä': 'A',
    'ë': 'e', 'Ë': 'E',
    'ï': 'i', 'Ï': 'I',
  }

  // Replace each special character
  for (const [special, replacement] of Object.entries(charMap)) {
    normalized = normalized.replace(new RegExp(special, 'g'), replacement)
  }

  // Remove any remaining diacritics
  normalized = normalized.replace(/[\u0300-\u036f]/g, '')

  // Replace spaces and special chars with hyphens
  normalized = normalized.replace(/\s+/g, '-')
                       .replace(/[\/\\]/g, '-')
                       .replace(/[']/g, '')
                       .replace(/[^\w-]/g, '-')
                       .replace(/-+/g, '-')
                       .replace(/^-|-$/g, '')

  return normalized
}

export function lookupArtistData(artist, collectionInfo) {
  // Remove Last.fm disambiguation suffixes like "(3)" before matching
  const cleanArtist = removeBracketedSuffix(artist)
  const normalizedArtist = normalizeText(cleanArtist)
  const normalizedArtistWithoutThe = normalizeText(removeArticle(cleanArtist))

  for (const [key, data] of Object.entries(collectionInfo)) {
    // Skip album entries (those with |||)
    if (typeof key === 'string' && !key.includes('|||')) {
      const normalizedKey = normalizeText(key)
      const normalizedKeyWithoutThe = normalizeText(removeArticle(key))

      // Try exact match first, then match without articles
      if (normalizedKey === normalizedArtist ||
          normalizedKey === normalizedArtistWithoutThe ||
          normalizedKeyWithoutThe === normalizedArtist ||
          normalizedKeyWithoutThe === normalizedArtistWithoutThe) {
        return {
          link: data.artist_link,
          image: data.artist_image
        }
      }
    }
  }
  return null
}

/**
 * Check if one artist name is a component of another (handles "Artist & Artist2" formats)
 * e.g., "Gary Numan" should match "Gary Numan & Tubeway Army"
 */
function isArtistComponent(searchArtist, collectionArtist) {
  // Split collection artist by common separators (already normalized, so "&" is "and")
  const separators = [' and ', ' with ', ' featuring ', ' feat ', ' ft ', ', ']

  for (const sep of separators) {
    if (collectionArtist.includes(sep)) {
      const parts = collectionArtist.split(sep).map(p => p.trim())
      if (parts.some(part => part === searchArtist || removeArticle(part) === removeArticle(searchArtist))) {
        return true
      }
    }
  }

  // Also check if search artist contains collection artist as a component
  for (const sep of separators) {
    if (searchArtist.includes(sep)) {
      const parts = searchArtist.split(sep).map(p => p.trim())
      if (parts.some(part => part === collectionArtist || removeArticle(part) === removeArticle(collectionArtist))) {
        return true
      }
    }
  }

  return false
}

export function lookupAlbumData(artist, album, collectionInfo) {
  // Remove Last.fm disambiguation suffixes like "(3)" before matching
  const cleanArtist = removeBracketedSuffix(artist)
  const normalizedArtist = normalizeText(cleanArtist)
  const normalizedArtistWithoutThe = normalizeText(removeArticle(cleanArtist))
  const normalizedAlbum = normalizeText(album)
  // Also try without bracketed suffixes like "(2019 Remix)", "(Deluxe; 2008 Remaster)"
  const normalizedAlbumWithoutBrackets = normalizeText(removeBracketedSuffix(album))

  for (const [key, data] of Object.entries(collectionInfo)) {
    if (key.includes('|||')) {
      const [keyArtist, keyAlbum] = key.split('|||')
      const normalizedKeyArtist = normalizeText(keyArtist)
      const normalizedKeyArtistWithoutThe = normalizeText(removeArticle(keyArtist))
      const normalizedKeyAlbum = normalizeText(keyAlbum)
      const normalizedKeyAlbumWithoutBrackets = normalizeText(removeBracketedSuffix(keyAlbum))

      // Try exact artist match first, then match without articles
      const exactArtistMatch = normalizedKeyArtist === normalizedArtist ||
                         normalizedKeyArtist === normalizedArtistWithoutThe ||
                         normalizedKeyArtistWithoutThe === normalizedArtist ||
                         normalizedKeyArtistWithoutThe === normalizedArtistWithoutThe

      // Try partial artist match for "Artist & Artist2" formats
      const partialArtistMatch = isArtistComponent(normalizedArtist, normalizedKeyArtist) ||
                                  isArtistComponent(normalizedArtistWithoutThe, normalizedKeyArtistWithoutThe)

      const artistMatch = exactArtistMatch || partialArtistMatch

      // Try album match: exact, without brackets on search term, without brackets on key, or both without brackets
      const albumMatch = normalizedKeyAlbum === normalizedAlbum ||
                        normalizedKeyAlbum === normalizedAlbumWithoutBrackets ||
                        normalizedKeyAlbumWithoutBrackets === normalizedAlbum ||
                        normalizedKeyAlbumWithoutBrackets === normalizedAlbumWithoutBrackets

      if (artistMatch && albumMatch) {
        return {
          link: data.album_link,
          image: data.album_image
        }
      }
    }
  }
  return null
}
