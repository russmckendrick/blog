// Album covers to exclude from tunes COVER-ART source images.
//
// Blocklisted albums still appear in the post itself (gallery, top-albums list) -
// they are only kept out of the images fed to the AI cover generator. Use this for
// sleeves that consistently spoil the header, e.g. covers dominated by large
// lettering that leaks into the result as text-like marks.
//
// Matching is on the album name (compared loosely - case, spacing, and punctuation
// are ignored), so use the album title roughly as it appears. `artist` and `reason`
// are notes for humans only; they are not used for matching.

export const COVER_BLOCKLIST = [
  { artist: 'Prince', album: '1999', reason: 'large "PRINCE 1999" lettering leaks into the cover as text' }
]
