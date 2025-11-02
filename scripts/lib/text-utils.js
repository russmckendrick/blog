/**
 * Shared text normalization and lookup utilities
 */

export function normalizeText(text) {
  if (!text) return ''
  return text.normalize('NFKD').toLowerCase().trim()
}

export function removeArticle(text) {
  if (!text) return ''
  return text.replace(/^(the|a|an)\s+/i, '')
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
  const normalizedArtist = normalizeText(artist)
  const normalizedArtistWithoutThe = normalizeText(removeArticle(artist))

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

export function lookupAlbumData(artist, album, collectionInfo) {
  const normalizedArtist = normalizeText(artist)
  const normalizedArtistWithoutThe = normalizeText(removeArticle(artist))
  const normalizedAlbum = normalizeText(album)

  for (const [key, data] of Object.entries(collectionInfo)) {
    if (key.includes('|||')) {
      const [keyArtist, keyAlbum] = key.split('|||')
      const normalizedKeyArtist = normalizeText(keyArtist)
      const normalizedKeyArtistWithoutThe = normalizeText(removeArticle(keyArtist))
      const normalizedKeyAlbum = normalizeText(keyAlbum)

      // Try exact artist match first, then match without articles
      const artistMatch = normalizedKeyArtist === normalizedArtist ||
                         normalizedKeyArtist === normalizedArtistWithoutThe ||
                         normalizedKeyArtistWithoutThe === normalizedArtist ||
                         normalizedKeyArtistWithoutThe === normalizedArtistWithoutThe

      if (artistMatch && normalizedKeyAlbum === normalizedAlbum) {
        return {
          link: data.album_link,
          image: data.album_image
        }
      }
    }
  }
  return null
}
